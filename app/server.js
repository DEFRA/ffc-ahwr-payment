import hapi from '@hapi/hapi'
import { config } from './config/index.js'
import { errorPlugin } from './plugins/errors.js'
import loggerPlugin from './plugins/logger.js'
import { healthRoutes } from './routes/health.js'
import { paymentApiRoutes } from './routes/api/payment.js'
import processPaymentDataScheduler from './crons/process-payment-data.js'


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
   await server.register(processPaymentDataScheduler)

  server.route([...healthRoutes, ...paymentApiRoutes])

  return server
}
