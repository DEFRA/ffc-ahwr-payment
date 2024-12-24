import { MessageReceiver } from 'ffc-messaging'
import { processApplicationPaymentRequest } from './process-application-payment-request'
import { processPaymentResponse } from './process-payment-response'
import { config } from '../config/message-queue'

let applicationClaimReceiver
let paymentActionReceiver

const start = async (logger) => {
  const { applicationPaymentRequestQueue, paymentResponseSubscription } = config
  const applicationClaimAction = message => processApplicationPaymentRequest(logger, message, applicationClaimReceiver)
  applicationClaimReceiver = new MessageReceiver(applicationPaymentRequestQueue, applicationClaimAction)
  await applicationClaimReceiver.subscribe()

  const paymentRequestAction = message => processPaymentResponse(logger, message, paymentActionReceiver)
  paymentActionReceiver = new MessageReceiver(paymentResponseSubscription, paymentRequestAction)
  await paymentActionReceiver.subscribe()

  logger.info('Ready to receive messages')
}

const stop = async () => {
  await applicationClaimReceiver.closeConnection()
  await paymentActionReceiver.closeConnection()
}

module.exports = { start, stop }
