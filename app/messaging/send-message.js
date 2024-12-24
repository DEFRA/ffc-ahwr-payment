import { MessageSender } from 'ffc-messaging'
import { createMessage } from './create-message.js'

export const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = new MessageSender(config)
  await sender.sendMessage(message)
  await sender.closeConnection()
}
