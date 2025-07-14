import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentDataRequest = async (paymentDataRequest, sessionId, logger, messageId) => {
  logger.info({ messageId, sessionId }, 'Sending payment data request')
  const { messageQueueConfig: { submitPaymentDataRequestMsgType, paymentDataRequestTopic } } = config
  await sendMessage(paymentDataRequest, submitPaymentDataRequestMsgType, paymentDataRequestTopic, { sessionId, messageId })
  logger.info({ messageId, sessionId }, 'Sent payment data request')
}
