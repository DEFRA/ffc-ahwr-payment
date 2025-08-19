import { setup } from './insights.js'
import { start, stop } from './messaging/index.js'
import { createServer } from './server.js'

const init = async () => {
  const appInsightsRunning = setup()
  const server = await createServer()
  await start(server.logger)

  await server.start()
  server.logger.info('Server running on %s', server.info.uri)
  server.logger.info(`App insights ${appInsightsRunning ? '' : 'not '}running`)
}

const handleSignal = async () => {
  await stop()
  process.exit(0)
}

process.on('SIGTERM', handleSignal)

process.on('SIGINT', handleSignal)

await init()
