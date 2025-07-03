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
import { Status } from '../constants/constants.js'

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

const processPaymentDataBlob = async (paymentDataBlob, claimReferences, logger) => {
  if (!claimReferences.has(paymentDataBlob.agreementNumber)) { return }

  const { agreementNumber: claimReference, status } = paymentDataBlob
  logger.setBindings({ claimReference, status })

  if (status.state === Status.PAID) {
    await processPaidClaim(claimReference, logger)
  } else {
    await incrementPaymentCheckCount(claimReference)
  }
}

const processDataRequestResponse = async ({ logger, blobServiceClient, claimReferences, blobUri }) => {
  const blob = await blobServiceClient.getBlob(
    logger,
    blobUri,
    paymentDataHubDataRequestsContainer
  )

  for (const paymentDataBlob of blob.data) {
    await processPaymentDataBlob(paymentDataBlob, claimReferences, logger)
  }
}

const createReceiver = async (messageId) => {
  const receiver = new MessageReceiver(paymentDataRequestResponseQueue)
  await receiver.acceptSession(messageId)
  return receiver
}

const processFrnRequest = async (frn, logger, claimReferences, blobServiceClient) => {
  const requestMessageId = uuid()
  const sessionId = uuid()
  const requestMessage = createPaymentDataRequest(frn)

  logger.setBindings({ frn, messageId: requestMessageId })

  let receiver
  let responseMessage
  let blobUri

  try {
    await sendPaymentDataRequest(requestMessage, sessionId, logger, requestMessageId)

    receiver = await createReceiver(requestMessageId)
    const responseMessages = await receiver.receiveMessages(1, { maxWaitTimeInMs: 30000 })

    if (!responseMessages.length) {
      logger.error('No response messages received from payment data request')
      return
    }

    responseMessage = responseMessages[0]
    blobUri = responseMessage.body?.uri

    if (!blobUri) {
      logger.error('No blob URI received in payment data response')
      return
    }

    await processDataRequestResponse({
      logger,
      blobServiceClient,
      claimReferences,
      blobUri
    })
  } catch (err) {
    logger.error('Error processing payment', { err })
  } finally {
    if (receiver) {
      if (responseMessage) {
        await receiver.completeMessage(responseMessage).catch((err) =>
          logger.error('Error completing response message', { err })
        )
      }

      await receiver.closeConnection().catch((err) =>
        logger.error('Error closing receiver connection', { err })
      )
    }

    if (blobUri) {
      await blobServiceClient.deleteBlob(logger, blobUri, paymentDataHubDataRequestsContainer).catch((err) =>
        logger.error('Error deleting blob', { err, blobUri })
      )
    }
  }
}

export const requestPaymentStatus = async (logger) => {
  const uniqueFrns = new Set()
  const claimReferences = new Set()

  const pendingPayments = await getPendingPayments()

  for (const pendingPayment of pendingPayments) {
    uniqueFrns.add(pendingPayment.dataValues.frn)
    claimReferences.add(pendingPayment.dataValues.agreementNumber)
  }

  const blobServiceClient = createBlobServiceClient({
    connectionString: paymentDataHubConnectionString
  })

  for (const frn of uniqueFrns) {
    await processFrnRequest(frn, logger, claimReferences, blobServiceClient)
  }
}
