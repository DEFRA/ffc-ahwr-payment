import { setup } from './insights'
import messaging from './messaging'
import { createServer } from './server'

const init = async () => {
  const server = await createServer()
  await messaging.start(server.logger)
  setup(server.logger)
  await server.start()
  server.logger.info('Server running on %s', server.info.uri)
}

process.on('SIGTERM', async () => {
  await messaging.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async function startService () {
  await init()
}())
