import { MessageReceiver } from 'ffc-messaging'
import { processApplicationPaymentRequest } from './process-application-payment-request.js'
import { processPaymentResponse } from './process-payment-response.js'
import { config } from '../config/message-queue.js'

let applicationClaimReceiver
let paymentActionReceiver

export const start = async (logger) => {
  const { applicationPaymentRequestQueue, paymentResponseSubscription } = config
  const applicationClaimAction = message => {
    const childLogger = logger.child({})
    processApplicationPaymentRequest(childLogger, message, applicationClaimReceiver)
  }
  applicationClaimReceiver = new MessageReceiver(applicationPaymentRequestQueue, applicationClaimAction)
  await applicationClaimReceiver.subscribe()

  const paymentRequestAction = message => {
    const childLogger = logger.child({})
    processPaymentResponse(childLogger, message, paymentActionReceiver)
  }
  paymentActionReceiver = new MessageReceiver(paymentResponseSubscription, paymentRequestAction)
  await paymentActionReceiver.subscribe()

  logger.info('Ready to receive messages')
}

export const stop = async () => {
  await applicationClaimReceiver.closeConnection()
  await paymentActionReceiver.closeConnection()
}
