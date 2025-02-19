import util from 'util'
import { processPaymentResponse } from '../../../../app/messaging/process-payment-response'
import * as paymentRepo from '../../../../app/repositories/payment-repository'
import appInsights from 'applicationinsights'

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
const updatePaymentSpy = jest.spyOn(paymentRepo, 'updateByReference')
const mockErrorLogger = jest.fn()
const mockInfoLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger,
  info: mockInfoLogger,
  setBindings: jest.fn()
}
describe(('Process payment response'), () => {
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
    updatePaymentSpy.mockResolvedValueOnce()
    await processPaymentResponse(mockedLogger, {
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

    expect(updatePaymentSpy).toHaveBeenCalledTimes(1)
    expect(updatePaymentSpy).toHaveBeenCalledWith(agreementNumber, 'success', {
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
    updatePaymentSpy.mockResolvedValueOnce()
    await processPaymentResponse(mockedLogger, {
      body: {
        paymentRequest: {
          agreementNumber
        },
        accepted: false
      }
    }
    , receiver)

    expect(updatePaymentSpy).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(mockErrorLogger).toHaveBeenCalledWith(
      `Failed payment request: ${util.inspect(
        {
          paymentRequest: {
            agreementNumber
          },
          accepted: false
        },
        false, null, true)}`
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('logger.error raised due to no agreement number within message', async () => {
    await processPaymentResponse(mockedLogger, {
      body: {
        paymentRequest: {},
        accepted: false
      }
    }, receiver)
    expect(mockErrorLogger).toHaveBeenCalledWith(
      `Received process payments response with no payment request and agreement number: ${util.inspect(
        {
          paymentRequest: {},
          accepted: false
        },
        false, null, true)}`
    )
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(updatePaymentSpy).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('logger.error raised due to empty message', async () => {
    await processPaymentResponse(mockedLogger, {}, receiver)
    expect(mockErrorLogger).toHaveBeenCalledTimes(2)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(updatePaymentSpy).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('error raised due to error thrown in updateByReference', async () => {
    const paymentRequest = { value: 0, agreementNumber }
    const accepted = 'success'
    const error = new Error('Something wrong')
    updatePaymentSpy.mockRejectedValueOnce(error)

    await processPaymentResponse(mockedLogger, { body: { paymentRequest, accepted } }, receiver)

    expect(mockErrorLogger).toHaveBeenCalledTimes(1)
    expect(updatePaymentSpy).toHaveBeenCalledWith(agreementNumber, accepted, paymentRequest)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })
})
