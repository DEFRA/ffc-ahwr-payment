import { sendPaymentRequest } from '../../../../app/messaging/send-payment-request'
import { sendMessage } from '../../../../app/messaging/send-message'
import { config } from '../../../../app/config'

jest.mock('../../../../app/messaging/send-message')
const mockInfoLogger = jest.fn()

const mockedLogger = {
  info: mockInfoLogger
}

const reference = 'AA-123-456'

describe(('Submit payment request'), () => {
  // let config

  beforeEach(async () => {
    config.messageQueueConfig = {
      submitPaymentRequestMsgType: 'submit.payment.request',
      paymentRequestTopic: 'sometopic'
    }
    jest.clearAllMocks()
  })

  test('Sends payment request message', async () => {
    config.sendPaymentRequestOutbound = true
    await sendPaymentRequest(
      {
        reference
      },
      '123456789', mockedLogger)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  test('Payment request message not sent due to config switch', async () => {
    config.sendPaymentRequestOutbound = false
    await sendPaymentRequest(
      {
        reference
      },
      '123456789', mockedLogger)
    expect(sendMessage).toHaveBeenCalledTimes(0)
    expect(mockInfoLogger).toHaveBeenCalledWith('Payment integration is disabled, not sending payment request out.\n {"reference":"AA-123-456"}')
  })
})
