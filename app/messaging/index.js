import { MessageReceiver } from 'ffc-messaging'
import { processApplicationPaymentRequest } from './process-application-payment-request.js'
import { processPaymentResponse } from './process-payment-response.js'
import { config } from '../config/index.js'
import { processCheckStatusRequest } from './process-check-status-request.js'

let applicationClaimReceiver
let paymentActionReceiver

export const start = async (logger) => {
  const { messageQueueConfig: { applicationPaymentRequestQueue, paymentResponseSubscription }, checkStatusRequestType } = config

  const applicationClaimAction = message => {
    const childLogger = logger.child({})
    const { applicationProperties } = message
    if (applicationProperties.type === checkStatusRequestType) {
      processCheckStatusRequest(childLogger, message, applicationClaimReceiver)
    } else {
      processApplicationPaymentRequest(childLogger, message, applicationClaimReceiver)
    }
  }
  applicationClaimReceiver = new MessageReceiver(applicationPaymentRequestQueue, applicationClaimAction)
  await applicationClaimReceiver.subscribe()

  const paymentResponseAction = message => {
    const childLogger = logger.child({})
    processPaymentResponse(childLogger, message, paymentActionReceiver)
  }
  paymentActionReceiver = new MessageReceiver(paymentResponseSubscription, paymentResponseAction)
  await paymentActionReceiver.subscribe()

  logger.info('Ready to receive messages')
}

export const stop = async () => {
  await applicationClaimReceiver.closeConnection()
  await paymentActionReceiver.closeConnection()
}
