import { MessageReceiver } from 'ffc-messaging'
import { config } from '../config/index.js'
import { sendMessage } from '../messaging/send-message.js'
import { sendPaymentDataRequest } from '../messaging/send-payment-data-request.js'
import {
  getPendingPayments,
  incrementPaymentCheckCount,
  updatePaymentStatusByClaimRef
} from '../repositories/payment-repository.js'
import { createBlobServiceClient } from '../storage.js'
import { v4 as uuid } from 'uuid'
import { PaymentHubStatus, Status } from '../constants/constants.js'

const {
  messageQueueConfig: {
    moveClaimToPaidMsgType,
    applicationRequestQueue,
    paymentDataRequestResponseQueue
  },
  storageConfig: {
    paymentDataHubConnectionString,
    paymentDataHubDataRequestsContainer
  }
} = config

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
  logger.setBindings({ claimReference, status })

  if (status.name === PaymentHubStatus.SETTLED) {
    await processPaidClaim(claimReference, logger)
  } else {
    await incrementPaymentCheckCount(claimReference)
  }
}

const processDataRequestResponse = async ({ logger, blobServiceClient, claimReferences, blobUri }) => {
  logger.info(`Processing blob: ${blobUri}`)
  const blob = await blobServiceClient.getBlob(
    logger,
    blobUri,
    paymentDataHubDataRequestsContainer
  )

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

const processFrnRequest = async (frn, logger, claimReferences, blobServiceClient) => {
  logger.setBindings({ frn })
  const requestMessageId = uuid()
  const sessionId = uuid()
  const requestMessage = createPaymentDataRequest(frn)
  let receiver, responseMessage, blobUri

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

    await processDataRequestResponse({
      logger,
      blobServiceClient,
      claimReferences,
      blobUri
    })
  } catch (err) {
    logger.error('Error requesting payment status', { err })
  } finally {
    if (receiver) {
      if (responseMessage) {
        await receiver.completeMessage(responseMessage)
          .catch((err) => logger.error('Error completing response message', { err, responseMessage }))
      }

      await receiver.closeConnection()
        .catch((err) => logger.error('Error closing receiver connection', { err }))
    }

    if (blobUri) {
      await blobServiceClient.deleteBlob(logger, blobUri, paymentDataHubDataRequestsContainer)
        .catch((err) => logger.error('Error deleting blob', { err, blobUri }))
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

  const blobServiceClient = createBlobServiceClient({
    connectionString: paymentDataHubConnectionString
  })

  for (const frn of uniqueFrns) {
    await processFrnRequest(frn, logger, claimReferences, blobServiceClient)
  }
}
