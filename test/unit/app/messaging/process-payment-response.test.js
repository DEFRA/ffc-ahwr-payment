import util from 'util'
import { processPaymentResponse } from '../../../../app/messaging/process-payment-response'
import * as paymentRepo from '../../../../app/repositories/payment-repository'
import appInsights from 'applicationinsights'

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
const updatePaymentResponseSpy = jest.spyOn(paymentRepo, 'updatePaymentResponse')
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
    updatePaymentResponseSpy.mockResolvedValueOnce()
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

    expect(updatePaymentResponseSpy).toHaveBeenCalledTimes(1)
    expect(updatePaymentResponseSpy).toHaveBeenCalledWith(agreementNumber, 'ack', {
      agreementNumber,
      value: 436,
      invoiceLines: [{
        value: 436
      }]
    })
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('Update the payment with failed status and raise exception', async () => {
    updatePaymentResponseSpy.mockResolvedValueOnce()
    await processPaymentResponse(mockedLogger, {
      body: {
        paymentRequest: {
          agreementNumber
        },
        accepted: false
      }
    }
    , receiver)

    expect(updatePaymentResponseSpy).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(mockErrorLogger).toHaveBeenCalledWith(
      `Failed payment request: ${util.inspect(
        {
          paymentRequest: {
            agreementNumber
          },
          accepted: false
        },
        false, null, false)}`
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })

  test('response message deadLettered and error logged when no agreement number within message', async () => {
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
        false, null, false)}`
    )
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(updatePaymentResponseSpy).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })

  test('Exception tracked and error log output when input is empty message', async () => {
    await processPaymentResponse(mockedLogger, {}, receiver)
    expect(mockErrorLogger).toHaveBeenCalledTimes(2)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(updatePaymentResponseSpy).toHaveBeenCalledTimes(0)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })

  test('Message deadlettered and TrackException called when error thrown in updatePaymentResponse', async () => {
    const paymentRequest = { value: 0, agreementNumber }
    const accepted = 'ack'
    const error = new Error('Something wrong')
    updatePaymentResponseSpy.mockRejectedValueOnce(error)

    await processPaymentResponse(mockedLogger, { body: { paymentRequest, accepted } }, receiver)

    expect(mockErrorLogger).toHaveBeenCalledTimes(1)
    expect(updatePaymentResponseSpy).toHaveBeenCalledWith(agreementNumber, accepted, paymentRequest)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })
})
