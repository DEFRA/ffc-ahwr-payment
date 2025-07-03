import { config } from '../config/index.js'
import { requestPaymentStatus } from './request-payment-status.js'
import cron from 'node-cron'
import appInsights from 'applicationinsights'

const scheduler = {
  plugin: {
    name: 'requestPaymentStatusScheduler',
    register: async (server) => {
      const { schedule, enabled } = config.requestPaymentStatusScheduler
      const logger = server.logger.child({ plugin: 'requestPaymentStatusScheduler' })

      logger.info('Registering payment status scheduler', { schedule })

      if (!enabled) {
        logger.info('Payment status scheduler is disabled. Skipping cron job registration.')
        return
      }

      cron.schedule(schedule, async () => {
        const taskLogger = logger.child({ task: 'requestPaymentStatus' })
        taskLogger.info('Starting payment status request')

        try {
          await requestPaymentStatus()
          taskLogger.info('Successfully completed payment status request')
        } catch (err) {
          const errorDetails = {
            message: err.message,
            stack: err.stack
          }
          taskLogger.error('Failed to request payment statuses', errorDetails)
          appInsights.defaultClient.trackException({ exception: err })
        }
      })
    }
  }
}

export default scheduler
