import { createMessage } from '../../../../app/messaging/create-message'
describe('createMessage', () => {
  test('returns an object with body, type, and source', () => {
    const message = createMessage('Hello', 'text')

    expect(message).toHaveProperty('body', 'Hello')
    expect(message).toHaveProperty('type', 'text')
    expect(message).toHaveProperty('source', 'ffc-ahwr-payment')
  })

  test('allows passing in options', () => {
    const message = createMessage('Hello', 'text', { id: '123' })

    expect(message.id).toEqual('123')
  })
})
