const config = require('../config')
const sendMessage = require('./send-message')
const { submitPaymentRequestMsgType, paymentRequestTopic } = require('../config').messageQueueConfig

const sendPaymentRequest = async (paymentRequest, sessionId) => {
  if (config.sendPaymentRequest) {
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
  }
}

module.exports = sendPaymentRequest
