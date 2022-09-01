const savePaymentRequest = require('./save-payment-request')

const processApplicationPaymentRequest = async (message, receiver) => {
  try {
    const messageBody = message.body
    console.log('Received application payment request', messageBody)
    await savePaymentRequest(messageBody)
    await receiver.completeMessage(message)
  } catch (err) {
    await receiver.deadLetterMessage(message)
    console.error('Unable to process application payment request:', err)
  }
}

module.exports = processApplicationPaymentRequest
