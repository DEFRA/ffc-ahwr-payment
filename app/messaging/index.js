const { MessageReceiver } = require('ffc-messaging')
const processApplicationPaymentRequest = require('./process-application-payment-request')
const processPaymentResponse = require('./process-payment-response')
const { applicationPaymentRequestQueue, paymentResponseSubscription } = require('../config').messageQueueConfig

let applicationClaimReceiver
let paymentActionReceiver

const start = async () => {
  const applicationClaimAction = message => processApplicationPaymentRequest(message, applicationClaimReceiver)
  applicationClaimReceiver = new MessageReceiver(applicationPaymentRequestQueue, applicationClaimAction)
  await applicationClaimReceiver.subscribe()

  const paymentRequestAction = message => processPaymentResponse(message, paymentActionReceiver)
  paymentActionReceiver = new MessageReceiver(paymentResponseSubscription, paymentRequestAction)
  await paymentActionReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationClaimReceiver.closeConnection()
  await paymentActionReceiver.closeConnection()
}

module.exports = { start, stop }
