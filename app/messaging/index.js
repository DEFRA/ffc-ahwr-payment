const { MessageReceiver } = require('ffc-messaging')
const processApplicationPaymentRequest = require('./process-application-payment-request')
const processPaymentResponse = require('./process-payment-response')
const { applicationPaymentRequestQueue, paymentResponseSubscription } = require('../config').messageQueueConfig

let applicationClaimReceiver
let paymentActionReceiver

const start = async () => {
  console.log('Starting message receivers')
  console.log('Application payment request queue: ' + JSON.stringify(applicationPaymentRequestQueue.address))
  console.log('Payment response subscription: ' + JSON.stringify(paymentResponseSubscription.topic) + ' ' + JSON.stringify(paymentResponseSubscription.address))

  const applicationClaimAction = message => processApplicationPaymentRequest(message, applicationClaimReceiver)
  applicationClaimReceiver = new MessageReceiver(applicationPaymentRequestQueue, applicationClaimAction)
  await applicationClaimReceiver.subscribe()

  console.log(`Ready to receive messages on ${JSON.stringify(applicationPaymentRequestQueue.address)}`)

  const paymentRequestAction = message => processPaymentResponse(message, paymentActionReceiver)
  paymentActionReceiver = new MessageReceiver(paymentResponseSubscription, paymentRequestAction)
  await paymentActionReceiver.subscribe()

  console.log(`Ready to receive messages on subscription ${JSON.stringify(paymentResponseSubscription.address)}`)
}

const stop = async () => {
  await applicationClaimReceiver.closeConnection()
  await paymentActionReceiver.closeConnection()
}

module.exports = { start, stop }
