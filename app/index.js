import { setup } from './insights.js'
import { start, stop } from './messaging/index.js'
import { createServer } from './server.js'

const init = async () => {
  const server = await createServer()
  await start(server.logger)
  setup(server.logger)
  await server.start()
  server.logger.info('Server running on %s', server.info.uri)
}

process.on('SIGTERM', async () => {
  await stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await stop()
  process.exit(0)
})

await init()
