import { sendPaymentDataRequest } from '../../../../app/messaging/send-payment-data-request'
import { sendMessage } from '../../../../app/messaging/send-message'
import { config } from '../../../../app/config'

jest.mock('../../../../app/messaging/send-message', () => ({
  sendMessage: jest.fn()
}))

jest.mock('../../../../app/config', () => ({
  config: {
    sendPaymentRequestOutbound: true,
    messageQueueConfig: {
      submitPaymentRequestMsgType: 'SubmitPaymentRequest',
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

  test('should send message when sendPaymentRequestOutbound is true', async () => {
    await sendPaymentDataRequest(paymentDataRequest, sessionId, mockLogger, messageId)

    expect(sendMessage).toHaveBeenCalledWith(
      paymentDataRequest,
      'SubmitPaymentRequest',
      'PaymentTopic',
      { sessionId, messageId }
    )
    expect(mockLogger.info).toHaveBeenCalledWith('Payment data request sent.')
  })

  test('should not send message when sendPaymentRequestOutbound is false', async () => {
    config.sendPaymentRequestOutbound = false

    await sendPaymentDataRequest(paymentDataRequest, sessionId, mockLogger, messageId)

    expect(sendMessage).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Payment integration is disabled, not sending payment request out.\n "PaymentTopic"'
    )
  })
})
