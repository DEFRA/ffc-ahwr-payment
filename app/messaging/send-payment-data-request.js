import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentDataRequest = async (paymentDataRequest, sessionId, logger, messageId) => {
  const { sendPaymentRequestOutbound, messageQueueConfig: { submitPaymentRequestMsgType, paymentDataRequestTopic } } = config
  if (sendPaymentRequestOutbound) {
    await sendMessage(paymentDataRequest, submitPaymentRequestMsgType, paymentDataRequestTopic, { sessionId, messageId })
    logger.info('Payment data request sent.')
  } else {
    logger.info(`Payment integration is disabled, not sending payment request out.\n ${JSON.stringify(paymentDataRequestTopic)}`)
  }
}
