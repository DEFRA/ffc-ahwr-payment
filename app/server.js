import hapi from '@hapi/hapi'
import { config } from './config/index'
import { errorPlugin } from './plugins/errors'
import loggerPlugin from './plugins/logger'
import { healthRoutes } from './routes/health'
import { paymentApiRoutes } from './routes/api/payment'
import blippPkg from 'blipp'

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
  if (config.isDev) {
    await server.register([blippPkg])
  }

  server.route([...healthRoutes, ...paymentApiRoutes])

  return server
}
