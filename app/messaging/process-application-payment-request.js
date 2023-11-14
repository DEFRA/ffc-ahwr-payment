const { v4: uuidv4 } = require('uuid')
const savePaymentRequest = require('./save-payment-request')
const sendPaymentRequest = require('../messaging/send-payment-request')
const appInsights = require('applicationinsights')

const processApplicationPaymentRequest = async (message, receiver) => {
  try {
    const messageBody = message.body
    console.log('Received application payment request', messageBody)
    const paymentRequest = await savePaymentRequest(messageBody)
    await sendPaymentRequest(paymentRequest, uuidv4())
    await receiver.completeMessage(message)
    appInsights.defaultClient.trackEvent({
      name: 'process-payment',
      properties: {
        value: messageBody
      }
    })
  } catch (err) {
    await receiver.deadLetterMessage(message)
    appInsights.defaultClient.trackException({
      exception: err ?? new Error('unknown'),
      properties: {
        agreementNo: messageBody.reference,
        payload: messageBody,
        request: paymentRequest ?? 'Server Error'
      }
    })
    console.error('Unable to process application payment request:', err)
  }
}

module.exports = processApplicationPaymentRequest
