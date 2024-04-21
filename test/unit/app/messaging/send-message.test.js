const createMessage = require('../../../../app/messaging/create-message')
const sendMessage = require('../../../../app/messaging/send-message')

jest.mock('../../../../app/messaging/create-message')
jest.mock('../../../../app/repositories/payment-repository')

describe('sendMessage', () => {
  test('should throw error if body is missing', async () => {
    const type = 'text'
    const options = {}
    const config = {}

    await expect(sendMessage(undefined, type, config, options)).rejects.toThrow(
      'Cannot read properties of undefined (reading \'type\')'
    )
  })

  test('should throw error if type is missing', async () => {
    const body = {}
    const options = {}
    const config = {}

    await expect(sendMessage(body, undefined, config, options)).rejects.toThrow(
      'Cannot read properties of undefined (reading \'type\')'
    )
  })

  test('should throw error if config is missing', async () => {
    const body = {}
    const type = 'text'
    const options = {}

    await expect(sendMessage(body, type, undefined, options)).rejects.toThrow(
      'Cannot read properties of undefined (reading \'name\')'
    )
  })

  test('should handle error from message sender', async () => {
    const body = {}
    const type = 'text'
    const options = {}
    const config = {}
    const message = {}
    const sender = {
      sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
    }

    createMessage.mockReturnValueOnce(message)

    await expect(sender.sendMessage(body, type, config, options)).rejects.toThrow(
      'Network error'
    )
  })
})
