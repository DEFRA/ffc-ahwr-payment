import scheduler from '../../../../app/jobs/request-payment-status-scheduler.js'
import { config } from '../../../../app/config/index.js'
import { requestPaymentStatus } from '../../../../app/jobs/request-payment-status.js'
import cron from 'node-cron'
import appInsights from 'applicationinsights'

jest.mock('../../../../app/config/index.js', () => ({
  config: {
    requestPaymentStatusScheduler: {
      schedule: '* * * * *',
      enabled: true
    }
  }
}))

jest.mock('../../../../app/jobs/request-payment-status.js', () => ({
  requestPaymentStatus: jest.fn()
}))

jest.mock('node-cron', () => ({
  schedule: jest.fn()
}))

jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackException: jest.fn()
  }
}))

describe('requestPaymentStatusScheduler', () => {
  let logger
  let server

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis()
    }

    server = { logger }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should register cron job when enabled', async () => {
    config.requestPaymentStatusScheduler.enabled = true

    await scheduler.plugin.register(server)

    expect(logger.info).toHaveBeenCalledWith(
      { schedule: '* * * * *' },
      'Registering payment status scheduler'
    )
    expect(cron.schedule).toHaveBeenCalled()
  })

  test('should not register cron job when not enabled', async () => {
    config.requestPaymentStatusScheduler.enabled = false

    await scheduler.plugin.register(server)

    expect(logger.info).toHaveBeenCalledWith(
      'Payment status scheduler is disabled. Skipping cron job registration.'
    )
    expect(cron.schedule).not.toHaveBeenCalled()
  })

  test('should execute task and log success', async () => {
    config.requestPaymentStatusScheduler.enabled = true
    const cronCallback = jest.fn()
    cron.schedule.mockImplementation((_, cb) => {
      cronCallback.mockImplementation(cb)
      return cb
    })
    await scheduler.plugin.register(server)
    requestPaymentStatus.mockResolvedValue()

    await cronCallback()

    expect(requestPaymentStatus).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('Starting payment status request')
    expect(logger.info).toHaveBeenCalledWith('Successfully completed payment status request')
  })

  test('should handle error and track exception', async () => {
    const cronCallback = jest.fn()
    cron.schedule.mockImplementation((_, cb) => {
      cronCallback.mockImplementation(cb)
      return cb
    })
    const error = new Error('Failure')
    requestPaymentStatus.mockRejectedValue(error)

    await scheduler.plugin.register(server)
    await cronCallback()

    expect(logger.error).toHaveBeenCalledWith(
      {
        message: 'Failure',
        stack: error.stack
      },
      'Failed to request payment statuses'
    )
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({
      exception: error
    })
  })
})
