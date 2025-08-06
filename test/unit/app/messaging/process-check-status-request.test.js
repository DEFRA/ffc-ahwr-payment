import { processCheckStatusRequest } from '../../../../app/messaging/process-check-status-request.js'
import { get } from '../../../../app/repositories/payment-repository.js'
import { processFrnRequest } from '../../../../app/jobs/request-payment-status.js'
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../app/config', () => ({
  config: {
    messageQueueConfig: {
      submitPaymentRequestMsgType: 'submit.payment.request'
    },
    requestPaymentStatusScheduler: {
      initialAttempts: 3
    }
  }
}))
jest.mock('../../../../app/repositories/payment-repository.js')
jest.mock('../../../../app/jobs/request-payment-status.js')

const mockInfoLogger = jest.fn()
const mockErrorLogger = jest.fn()
const mockSetBindings = jest.fn()

const mockedLogger = {
  info: mockInfoLogger,
  error: mockErrorLogger,
  setBindings: mockSetBindings
}

describe(('Process check status request'), () => {
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn(),
    deadLetterMessage: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Successfully call processFrnRequest and complete message', async () => {
    get.mockResolvedValueOnce({ dataValues: { frn: 'frn12345' } })
    await processCheckStatusRequest(mockedLogger, { body: { reference: 'ABCD-1234-5678' } }, receiver)

    expect(get).toHaveBeenCalledWith('ABCD-1234-5678')
    expect(processFrnRequest).toHaveBeenCalledWith('frn12345', mockedLogger, new Set(['ABCD-1234-5678']))
    expect(mockInfoLogger).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('when validation fails message is dead-lettered', async () => {
    await processCheckStatusRequest(mockedLogger, {}, receiver)
    expect(mockErrorLogger).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })

  test('when no existing record found message is dead-lettered', async () => {
    get.mockResolvedValueOnce(null)
    await processCheckStatusRequest(mockedLogger, { body: { reference: 'ABCD-1234-5678' } }, receiver)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('ABCD-1234-5678')
    expect(mockErrorLogger).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })
})
