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
      expect(err.message).toBe('The message queue config is invalid. "applicationdDocCreationRequestQueue.host" must be a string. "applicationRequestQueue.host" must be a string. "applicationResponseQueue.host" must be a string. "submitRequestQueue.host" must be a string. "eventQueue.host" must be a string')
    }
  })
})
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
    process.env.MESSAGE_QUEUE_HOST = 'host'
    process.env.MESSAGE_QUEUE_PASSWORD = 'password'
    process.env.MESSAGE_QUEUE_USER = 'user'
    process.env.APPLICATIONPAYMENTREQUEST_QUEUE_ADDRESS = 'queue-address'
    process.env.PAYMENTREQUEST_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS = 'subscription-address'

    const messageQueueConfig = jest.requireActual('../../../../app/config/message-queue')
    expect(messageQueueConfig).toBeDefined()
    expect(messageQueueConfig.applicationPaymentRequestQueue).toBeDefined()
    expect(messageQueueConfig.paymentRequestTopic).toBeDefined()
    expect(messageQueueConfig.paymentResponseSubscription).toBeDefined()
    expect(messageQueueConfig.submitPaymentRequestMsgType).toBeDefined()
  })
})
