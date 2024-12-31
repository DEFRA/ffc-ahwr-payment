import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentRequest = async (paymentRequest, sessionId) => {
  const { sendPaymentRequest, messageQueueConfig: { submitPaymentRequestMsgType, paymentRequestTopic } } = config
  if (sendPaymentRequest) {
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
  }
}
