import { processApplicationPaymentRequest } from '../../../../app/messaging/process-application-payment-request'
import * as savePayment from '../../../../app/messaging/save-payment-request'
import * as sendPayment from '../../../../app/messaging/send-payment-request'
import appInsights from 'applicationinsights'
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const sendPaymentSpy = jest.spyOn(sendPayment, 'sendPaymentRequest')
const savePaymentSpy = jest.spyOn(savePayment, 'savePaymentRequest')

const mockInfoLogger = jest.fn()
const mockErrorLogger = jest.fn()

const mockedLogger = {
  info: mockInfoLogger,
  error: mockErrorLogger
}

describe(('Process application payment request'), () => {
  const reference = 'AA-1234-567'
  const applicationPaymentRequestMissingFrn = {
    reference,
    sbi: '123456789',
    whichReview: 'beef'
  }
  const applicationPaymentRequest = {
    ...applicationPaymentRequestMissingFrn,
    frn: '123456789'
  }

  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn(),
    deadLetterMessage: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Successfully update the payment with success status', async () => {
    savePaymentSpy.mockResolvedValueOnce()
    sendPaymentSpy.mockResolvedValueOnce()
    await processApplicationPaymentRequest(mockedLogger, {
      body: {
        applicationPaymentRequest
      }
    }
    , receiver)

    expect(savePaymentSpy).toHaveBeenCalledTimes(1)
    expect(sendPaymentSpy).toHaveBeenCalledTimes(1)
    expect(mockInfoLogger).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
  })

  test('logger.error raised due to error thrown in updateByReference', async () => {
    savePaymentSpy.mockImplementation(() => { throw new Error() })
    await processApplicationPaymentRequest(mockedLogger, {}, receiver)
    expect(mockErrorLogger).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })
})
