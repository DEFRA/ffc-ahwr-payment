import { sendPaymentDataRequest } from '../../../../app/messaging/send-payment-data-request'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/messaging/send-message', () => ({
  sendMessage: jest.fn()
}))
jest.mock('../../../../app/config', () => ({
  config: {
    messageQueueConfig: {
      submitPaymentDataRequestMsgType: 'SubmitPaymentRequest',
      paymentDataRequestTopic: 'PaymentTopic'
    }
  }
}))

describe('sendPaymentDataRequest', () => {
  const mockLogger = {
    info: jest.fn()
  }

  const paymentDataRequest = { amount: 100 }
  const sessionId = 'b241101-e2bb-4255-8caf-4136c566a962'
  const messageId = '110ec58a-a0f2-4ac4-8393-c866d813b8d1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should send message and log info', async () => {
    await sendPaymentDataRequest(paymentDataRequest, sessionId, mockLogger, messageId)

    expect(sendMessage).toHaveBeenCalledWith(
      paymentDataRequest,
      'SubmitPaymentRequest',
      'PaymentTopic',
      { sessionId, messageId }
    )
    expect(mockLogger.info).toHaveBeenCalledWith('Sending payment data request', { messageId, sessionId })
    expect(mockLogger.info).toHaveBeenCalledWith('Sent payment data request', { messageId, sessionId })
  })
})
