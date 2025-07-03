import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentDataRequest = async (paymentDataRequest, sessionId, logger, messageId) => {
  logger.info('Sending payment data request', { messageId, sessionId })
  const { messageQueueConfig: { submitPaymentDataRequestMsgType, paymentDataRequestTopic } } = config
  await sendMessage(paymentDataRequest, submitPaymentDataRequestMsgType, paymentDataRequestTopic, { sessionId, messageId })
  logger.info('Sent payment data request', { messageId, sessionId })
}
