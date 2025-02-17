import { v4 as uuidv4 } from 'uuid'
import { savePaymentRequest } from './save-payment-request.js'
import { sendPaymentRequest } from './send-payment-request.js'
import appInsights from 'applicationinsights'

export const processApplicationPaymentRequest = async (logger, message, receiver) => {
  try {
    const messageBody = message.body
    logger.setBindings({ sbi: messageBody.sbi, reference: messageBody.reference })
    logger.info(`Received application payment request ${JSON.stringify(messageBody)}`)
    const paymentRequest = await savePaymentRequest(logger, messageBody)
    await sendPaymentRequest(paymentRequest, uuidv4(), logger)
    await receiver.completeMessage(message)
    appInsights.defaultClient.trackEvent({
      name: 'process-payment',
      properties: {
        value: messageBody,
        paymentRequest
      }
    })
  } catch (err) {
    await receiver.deadLetterMessage(message)
    appInsights.defaultClient.trackException({
      exception: err ?? new Error('unknown'),
      properties: {
        agreementNo: message.body?.reference ?? '',
        payload: message.body ?? '',
        messageId: message.id ?? ''
      }
    })
    logger.error(`Unable to process application payment request: ${err}`)
  }
}
