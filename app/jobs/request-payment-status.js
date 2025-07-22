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
import { DAILY_RETRY_LIMIT, PaymentHubStatus, Status } from '../constants/constants.js'
import appInsights from 'applicationinsights'

const {
  messageQueueConfig: {
    moveClaimToPaidMsgType,
    applicationRequestQueue,
    paymentDataRequestResponseQueue
  }
} = config

const createPaymentDataRequest = (frn) => ({
  category: 'frn',
  value: frn
})

const processPaidClaim = async (claimReference, logger) => {
  const [, updatedRows] = await updatePaymentStatusByClaimRef(claimReference, Status.PAID)

  if (updatedRows?.length === 1) {
    const { data: { sbi } } = updatedRows[0].dataValues
    await sendMessage(
      {
        claimRef: claimReference,
        sbi
      },
      moveClaimToPaidMsgType,
      applicationRequestQueue,
      { sessionId: uuid() }
    )
  } else {
    logger.error('Payment not found to update paid status')
  }
}

const trackPaymentStatusError = ({ claimReference, statuses, sbi, type, logger, paymentCheckCount }) => {
  logger.info({ claimReference, sbi, type }, `Payment has not been paid after ${paymentCheckCount} status requests`)
  appInsights.defaultClient.trackException({
    exception: new Error('Payment has not been updated to paid status'),
    properties: {
      claimReference,
      statuses,
      sbi,
      type
    }
  })
}

const processPaymentDataEntry = async (paymentDataEntry, logger) => {
  const { agreementNumber: claimReference, status, events } = paymentDataEntry
  logger.info({ claimReference, status }, 'Processing data entry')

  if (status.name === PaymentHubStatus.SETTLED) {
    await processPaidClaim(claimReference, logger)
    return
  }

  const updatedPayment = await incrementPaymentCheckCount(claimReference)
  if (!updatedPayment) {
    logger.error({ claimReference }, 'No rows returned from incrementing paymentCheckCount')
    return
  }

  const { paymentCheckCount: paymentCheckCountStr, data: { sbi } = {} } = updatedPayment
  const paymentCheckCount = Number(paymentCheckCountStr)
  const statuses = events.map((event) => ({
    status: event.status.name,
    date: event.timestamp
  }))

  if (paymentCheckCount === DAILY_RETRY_LIMIT) {
    trackPaymentStatusError({ claimReference, statuses, sbi, type: 'INITIAL', logger, paymentCheckCount })
  }

  if (paymentCheckCount > DAILY_RETRY_LIMIT) {
    trackPaymentStatusError({ claimReference, statuses, sbi, type: 'FINAL', logger, paymentCheckCount })
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
    await processFrnRequest(frn, logger.child({ frn }), claimReferences)
  }
}
