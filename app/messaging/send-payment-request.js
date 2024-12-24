import { config } from '../config'
import { sendMessage } from './send-message'

export const sendPaymentRequest = async (paymentRequest, sessionId) => {
  const { sendPaymentRequest, messageQueueConfig: { submitPaymentRequestMsgType, paymentRequestTopic } } = config
  if (sendPaymentRequest) {
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
  }
}
