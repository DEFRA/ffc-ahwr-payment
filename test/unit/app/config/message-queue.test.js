const messageQueueConfig = require('../../../../app/config/message-queue')

describe('Message queue Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })
  test('Should pass validation for all fields populated', async () => {
    expect(messageQueueConfig).toBeDefined()
  })

  test('Invalid env var throws error', () => {
    try {
      process.env.MESSAGE_QUEUE_HOST = null
      require('../../../../app/config/message-queue')
    } catch (err) {
      expect(err.message).toBe('The message queue config is invalid. "applicationPaymentRequestQueue.host" must be a string. "paymentRequestTopic.host" must be a string. "paymentResponseSubscription.host" must be a string')
    }
  })
})
