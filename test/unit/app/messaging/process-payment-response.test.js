const util = require('util')
const processPaymentResponse = require('../../../../app/messaging/process-payment-response')
jest.mock('../../../../app/repositories/payment-repository')
const paymentRepository = require('../../../../app/repositories/payment-repository')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
const appInsights = require('applicationinsights')

describe(('Process payment response'), () => {
  const consoleError = jest.spyOn(console, 'error')
  const agreementNumber = 'AA-1234-567'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn(),
    deadLetterMessage: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Successfully update the payment with success status', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {
          agreementNumber,
          value: 43600,
          invoiceLines: [{
            value: 43600
          }]
        },
        accepted: true
      }
    }
    , receiver)

    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(paymentRepository.updateByReference).toHaveBeenCalledWith(agreementNumber, 'success', {
      agreementNumber,
      value: 436,
      invoiceLines: [{
        value: 436
      }]
    })
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('Update the payment with failed status', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {
          agreementNumber
        },
        accepted: false
      }
    }
    , receiver)

    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Failed payment request',
      util.inspect(
        {
          paymentRequest: {
            agreementNumber
          },
          accepted: false
        },
        false, null, true)
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due to no agreement number within message', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {},
        accepted: false
      }
    }, receiver)
    expect(consoleError).toHaveBeenCalledWith(
      'Received process payments response with no payment request and agreement number',
      util.inspect(
        {
          paymentRequest: {},
          accepted: false
        },
        false, null, true)
    )
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due empty message', async () => {
    await processPaymentResponse({}, receiver)
    expect(consoleError).toHaveBeenCalledTimes(2)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('error raised due to error thrown in updateByReference', async () => {
    const paymentRequest = { value: 0, agreementNumber }
    const accepted = 'success'
    await processPaymentResponse({ body: { paymentRequest, accepted } }, receiver)
    paymentRepository.updateByReference.mockImplementation(async () => { throw new Error('Fake Error') })
    expect(consoleError).toHaveBeenCalledTimes(0)
    expect(paymentRepository.updateByReference).toHaveBeenCalledWith(agreementNumber, accepted, paymentRequest)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })
})
