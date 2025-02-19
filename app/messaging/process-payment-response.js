import { updateByReference } from '../repositories/payment-repository.js'
import util from 'util'
import appInsights from 'applicationinsights'

export const processPaymentResponse = async (logger, message, receiver) => {
  try {
    const messageBody = message.body
    const paymentRequest = messageBody?.paymentRequest
    const agreementNumber = paymentRequest?.agreementNumber
    logger.setBindings({ reference: agreementNumber })
    const status = messageBody?.accepted ? 'success' : failedPaymentRequest(logger, messageBody)
    if (paymentRequest && agreementNumber) {
      logger.info('received process payments response', agreementNumber, status)
      if (paymentRequest?.value) {
        paymentRequest.value = paymentRequest.value / 100
      }
      if (paymentRequest?.invoiceLines?.length > 0 && paymentRequest?.invoiceLines[0]?.value) {
        paymentRequest.invoiceLines[0].value = paymentRequest.invoiceLines[0].value / 100
      }
      await updateByReference(agreementNumber, status, paymentRequest)

      appInsights.defaultClient.trackEvent({
        name: 'payment-response',
        properties: {
          status,
          agreementNumber,
          value: paymentRequest.value
        }
      })
      await receiver.completeMessage(message)
    } else {
      appInsights.defaultClient.trackEvent({
        name: 'payment-response',
        properties: {
          status: 'failed',
          agreementNumber,
          value: paymentRequest?.value
        }
      })
      logger.error(`Received process payments response with no payment request and agreement number: ${util.inspect(message.body, false, null, true)}`)
      await receiver.deadLetterMessage(message)
    }
  } catch (err) {
    appInsights.defaultClient.trackException({ exception: err })
    await receiver.deadLetterMessage(message)
    logger.error(`Unable to process payment request: ${err}`)
  }
}

function failedPaymentRequest (logger, messageBody) {
  logger.error(`Failed payment request: ${util.inspect(messageBody, false, null, true)}`)
  return 'failed'
}
