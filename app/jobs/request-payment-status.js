import { MessageReceiver } from 'ffc-messaging'
import { config } from '../config/index.js'
import { sendMessage } from '../messaging/send-message.js'
import { sendPaymentDataRequest } from '../messaging/send-payment-data-request.js'
import {
  getPendingPayments,
  incrementPaymentCheckCount,
  updatePaymentStatusByClaimRef
} from '../repositories/payment-repository.js'
import { createBlobClient } from '../storage.js'
import { v4 as uuid } from 'uuid'
import { PaymentHubStatus, Status } from '../constants/constants.js'
import appInsights from 'applicationinsights'

const {
  messageQueueConfig: {
    moveClaimToPaidMsgType,
    applicationRequestQueue,
    paymentDataRequestResponseQueue
  }
} = config

const PAYMENT_CHECK_COUNT_LIMIT = 3

const createPaymentDataRequest = (frn) => ({
  category: 'frn',
  value: frn
})

const processPaidClaim = async (claimReference, logger) => {
  const [, updatedRows] = await updatePaymentStatusByClaimRef(claimReference, Status.PAID)

  if (updatedRows?.length === 1) {
    await sendMessage(
      {
        claimRef: claimReference,
        sbi: updatedRows[0].dataValues.sbi
      },
      moveClaimToPaidMsgType,
      applicationRequestQueue,
      { sessionId: uuid() }
    )
  } else {
    logger.error('Payment not found to update paid status')
  }
}

const processPaymentDataEntry = async (paymentDataEntry, logger) => {
  const { agreementNumber: claimReference, status } = paymentDataEntry
  logger.info({ claimReference, status }, 'Processing data entry')

  if (status.name === PaymentHubStatus.SETTLED) {
    await processPaidClaim(claimReference, logger)
  } else {
    const [affectedRows] = await incrementPaymentCheckCount(claimReference)

    if (affectedRows?.[0][0].paymentCheckCount === PAYMENT_CHECK_COUNT_LIMIT) {
      appInsights.defaultClient.trackException({
        exception: new Error('Exceeded attempts to retrieve paid payment status'),
        properties: {
          claimReference,
          payDataStatus: status.name,
          sbi: affectedRows?.[0][0].data.sbi
        }
      })
    }
  }
}

const processDataRequestResponse = async ({ logger, claimReferences, blobClient }) => {
  const blob = await blobClient.getBlob()

  const requestedPaymentData = blob.data.filter((blobData) => claimReferences.has(blobData.agreementNumber))
  if (!requestedPaymentData.length) {
    throw Error('Blob does not contain requested payment data')
  }

  for (const entry of requestedPaymentData) {
    await processPaymentDataEntry(entry, logger)
  }
}

const createReceiver = async (messageId) => {
  const receiver = new MessageReceiver(paymentDataRequestResponseQueue)
  await receiver.acceptSession(messageId)
  return receiver
}

const processFrnRequest = async (frn, logger, claimReferences) => {
  logger.setBindings({ frn })
  const requestMessageId = uuid()
  const sessionId = uuid()
  const requestMessage = createPaymentDataRequest(frn)
  let receiver, responseMessage, blobUri, blobClient

  try {
    await sendPaymentDataRequest(requestMessage, sessionId, logger, requestMessageId)

    receiver = await createReceiver(requestMessageId)
    const responseMessages = await receiver.receiveMessages(1, { maxWaitTimeInMs: 30000 })

    if (!responseMessages.length) {
      throw Error('No response messages received from payment data request')
    }

    responseMessage = responseMessages[0]
    blobUri = responseMessage.body?.uri

    if (!blobUri) {
      throw Error('No blob URI received in payment data response')
    }

    blobClient = createBlobClient(logger, blobUri)

    await processDataRequestResponse({
      logger,
      claimReferences,
      blobClient
    })
  } catch (err) {
    logger.error({ err }, 'Error requesting payment status')
  } finally {
    if (receiver) {
      if (responseMessage) {
        await receiver.completeMessage(responseMessage)
          .catch((err) => logger.error({ err, responseMessage }, 'Error completing response message'))
      }

      await receiver.closeConnection()
        .catch((err) => logger.error({ err }, 'Error closing receiver connection'))
    }

    if (blobClient) {
      await blobClient.deleteBlob()
        .catch((err) => logger.error({ err, blobUri }, 'Error deleting blob'))
    }
  }
}

export const requestPaymentStatus = async (logger) => {
  const uniqueFrns = new Set()
  const claimReferences = new Set()

  const pendingPayments = await getPendingPayments()

  logger.info(`Found ${pendingPayments.length} pending payments`)

  for (const pendingPayment of pendingPayments) {
    uniqueFrns.add(pendingPayment.dataValues.frn)
    claimReferences.add(pendingPayment.dataValues.applicationReference)
  }

  for (const frn of uniqueFrns) {
    await processFrnRequest(frn, logger, claimReferences)
  }
}
