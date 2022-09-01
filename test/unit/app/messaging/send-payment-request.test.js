const sendPaymentRequest = require('../../../../app/messaging/send-payment-request')
jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')

const reference = 'AA-123-456'

describe(('Submit payment request'), () => {
  let config

  beforeEach(async () => {
    config = require('../../../../app/config')
    jest.clearAllMocks()
  })

  test('Sends payment request message', async () => {
    config.sendPaymentRequest = true
    await sendPaymentRequest(
      {
        reference
      },
      '123456789')
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  test('Payment request message not sent due to config switch', async () => {
    config.sendPaymentRequest = false
    await sendPaymentRequest(
      {
        reference
      },
      '123456789')
    expect(sendMessage).toHaveBeenCalledTimes(0)
  })
})
