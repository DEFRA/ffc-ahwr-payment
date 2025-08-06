describe('Main Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }

    // set the required messaging env vars as that file will also be loaded during this test
    process.env.PAYMENTREQUEST_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_TOPIC_ADDRESS = 'topic-address'
    process.env.PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS = 'subscription-address'
    process.env.PAYMENT_DATA_REQUEST_RESPONSE_QUEUE_ADDRESS = 'payment-data-request-response-queue-address'
    process.env.APPLICATION_REQUEST_QUEUE_ADDRESS = 'application-request-queue-address'
    process.env.PAYMENTREQUEST_TOPIC_ADDRESS = 'payment-request-topic-address'
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Should pass validation for all fields populated using supplied values', async () => {
    process.env.SEND_PAYMENT_REQUEST = 'false'
    process.env.REQUEST_PAYMENT_STATUS_ENABLED = 'false'
    process.env.REQUEST_PAYMENT_STATUS_SCHEDULE = '0 0 0 0 0'
    process.env.REQUEST_PAYMENT_INITIAL_ATTEMPTS = '4'

    const { config } = jest.requireActual('../../../../app/config/index.js')
    expect(config).toBeDefined()
    expect(config.requestPaymentStatusScheduler.enabled).toBeFalsy()
    expect(config.requestPaymentStatusScheduler.schedule).toEqual('0 0 0 0 0')
    expect(config.requestPaymentStatusScheduler.initialAttempts).toEqual(4)
    expect(config.sendPaymentRequestOutbound).toBeFalsy()
  })

  test('Should pass validation for all fields populated using default values', async () => {
    process.env.SEND_PAYMENT_REQUEST = 'true'
    process.env.REQUEST_PAYMENT_STATUS_ENABLED = 'true'
    delete process.env.REQUEST_PAYMENT_STATUS_SCHEDULE
    delete process.env.REQUEST_PAYMENT_INITIAL_ATTEMPTS

    const { config } = jest.requireActual('../../../../app/config/index.js')
    expect(config).toBeDefined()
    expect(config.requestPaymentStatusScheduler.enabled).toBeTruthy()
    expect(config.requestPaymentStatusScheduler.schedule).toEqual('0 11 * * 1-5')
    expect(config.requestPaymentStatusScheduler.initialAttempts).toEqual(3)
    expect(config.sendPaymentRequestOutbound).toBeTruthy()
  })
})
