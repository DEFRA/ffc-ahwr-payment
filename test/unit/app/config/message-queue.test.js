describe('Message queue Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Invalid env var throws error', () => {
    let thrownErr
    try {
      delete process.env.MESSAGE_QUEUE_HOST
      jest.requireActual('../../../../app/config/message-queue')
    } catch (err) {
      thrownErr = err
    }
    expect(thrownErr.message).toBe('The message queue config is invalid. "applicationPaymentRequestQueue.host" is required. "paymentRequestTopic.host" is required. "paymentResponseSubscription.host" is required. "paymentDataRequestTopic.host" is required')
  })

  test('Should pass validation for all fields populated', async () => {
    process.env.MESSAGE_QUEUE_HOST = 'host'
    process.env.MESSAGE_QUEUE_PASSWORD = 'password'
    process.env.MESSAGE_QUEUE_USER = 'user'
    process.env.APPLICATIONPAYMENTREQUEST_QUEUE_ADDRESS = 'queue-address'
    process.env.PAYMENTREQUEST_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS = 'subscription-address'
    process.env.PAYMENT_DATA_REQUEST_RESPONSE_QUEUE_ADDRESS = 'payment-data-request-response-queue-address'
    process.env.APPLICATION_REQUEST_QUEUE_ADDRESS = 'application-request-queue-address'
    process.env.PAYMENTREQUEST_TOPIC_ADDRESS = 'payment-request-topic-address'

    const messageQueueConfig = jest.requireActual('../../../../app/config/message-queue')
    expect(messageQueueConfig).toBeDefined()
    expect(messageQueueConfig.config.applicationPaymentRequestQueue).toBeDefined()
    expect(messageQueueConfig.config.paymentRequestTopic).toBeDefined()
    expect(messageQueueConfig.config.paymentResponseSubscription).toBeDefined()
    expect(messageQueueConfig.config.submitPaymentRequestMsgType).toBeDefined()
    expect(messageQueueConfig.config.applicationRequestQueue).toBeDefined()
    expect(messageQueueConfig.config.moveClaimToPaidMsgType).toBeDefined()
    expect(messageQueueConfig.config.paymentDataRequestResponseQueue).toBeDefined()
  })
})
