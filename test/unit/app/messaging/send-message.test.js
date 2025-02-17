import { createMessage } from '../../../../app/messaging/create-message'
import { sendMessage } from '../../../../app/messaging/send-message'
import * as FfcMessaging from 'ffc-messaging'

jest.mock('../../../../app/messaging/create-message')
jest.mock('ffc-messaging')

describe('sendMessage', () => {
  test('should send message then close connection', async () => {
    const body = {}
    const type = 'text'
    const options = {}
    const config = {}
    const message = {
      mockMessageProp: 'A'
    }
    createMessage.mockReturnValueOnce(message)

    await sendMessage(body, type, config, options)

    const messageSenderCreated = FfcMessaging.MessageSender.mock.instances[0]

    expect(FfcMessaging.MessageSender).toHaveBeenCalledTimes(1)
    expect(messageSenderCreated.sendMessage).toHaveBeenCalledWith(message)
    expect(messageSenderCreated.closeConnection).toHaveBeenCalledTimes(1)
  })
})
