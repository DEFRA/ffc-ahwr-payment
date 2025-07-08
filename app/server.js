import hapi from '@hapi/hapi'
import { config } from './config/index.js'
import { errorPlugin } from './plugins/errors.js'
import loggerPlugin from './plugins/logger.js'
import { healthRoutes } from './routes/health.js'
import { paymentApiRoutes } from './routes/api/payment.js'
import requestPaymentStatusScheduler from './jobs/request-payment-status-scheduler.js'
import { requestPaymentStatus } from './jobs/request-payment-status.js'

export async function createServer () {
  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Register the plugins
  await server.register(errorPlugin)
  await server.register([loggerPlugin])

  server.route([...healthRoutes, ...paymentApiRoutes])

  await server.register(requestPaymentStatusScheduler)

  server.route({
    method: 'POST',
    path: '/test/run-scheduler',
    handler: async (request, h) => {
      const logger = server.logger.child({ route: 'test/run-scheduler' })

      try {
        await requestPaymentStatus(logger)
        logger.info('Manually triggered scheduler task succeeded')
        return h.response({ status: 'ok' }).code(200)
      } catch (err) {
        logger.error('Manual trigger failed', err)
        return h.response({ error: err.message }).code(500)
      }
    }
  })

  return server
}
