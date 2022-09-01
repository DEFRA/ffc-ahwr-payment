const processApplicationPaymentRequest = require('../../../../app/messaging/process-application-payment-request')
const savePaymentRequest = require('../../../../app/messaging/save-payment-request')
jest.mock('../../../../app/messaging/save-payment-request')

describe(('Process application payment request'), () => {
  const consoleError = jest.spyOn(console, 'error')
  const reference = 'AA-1234-567'
  const applicationPaymentRequest = {
    reference,
    sbi: '123456789',
    whichReview: 'beef'
  }

  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn(),
    deadLetterMessage: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Sucessfully update the payment with success status', async () => {
    await processApplicationPaymentRequest({
      body: {
        applicationPaymentRequest
      }
    }
    , receiver)

    expect(savePaymentRequest).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due to error thrown in updateByReference', async () => {
    savePaymentRequest.mockImplementation(() => { throw new Error() })
    await processApplicationPaymentRequest({}, receiver)
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })
})
