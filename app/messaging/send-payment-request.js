import { config } from '../config/index.js'
import { sendMessage } from './send-message.js'

export const sendPaymentRequest = async (paymentRequest, sessionId, logger) => {
  const { sendPaymentRequestOutbound, messageQueueConfig: { submitPaymentRequestMsgType, paymentRequestTopic } } = config
  if (sendPaymentRequestOutbound) {
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
    logger.info('Payment request sent.')
  } else {
    logger.info(`Payment integration is disabled, not sending payment request out.\n ${JSON.stringify(paymentRequest)}`)
  }
}
