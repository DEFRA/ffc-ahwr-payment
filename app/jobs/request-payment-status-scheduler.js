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

      if (!enabled) {
        logger.info('Payment status scheduler is disabled. Skipping cron job registration.')
        return
      }

      logger.info({ schedule }, 'Registering payment status scheduler')

      cron.schedule(schedule, async () => {
        const taskLogger = logger.child({ task: 'requestPaymentStatus' })
        taskLogger.info('Starting payment status requests')

        try {
          await requestPaymentStatus(taskLogger)
          taskLogger.info('Successfully completed payment status requests')
        } catch (err) {
          const errorDetails = {
            message: err.message,
            stack: err.stack
          }
          taskLogger.error(errorDetails, 'Failed to request payment statuses')
          appInsights.defaultClient.trackException({ exception: err })
        }
      })
    }
  }
}

export default scheduler
