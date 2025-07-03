import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentDataRequest = async (paymentDataRequest, sessionId, logger, messageId) => {
  const { messageQueueConfig: { submitPaymentDataRequestMsgType, paymentDataRequestTopic } } = config
  await sendMessage(paymentDataRequest, submitPaymentDataRequestMsgType, paymentDataRequestTopic, { sessionId, messageId })
  logger.info('Payment data request sent.')
}
