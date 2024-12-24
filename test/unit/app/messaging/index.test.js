import { MessageReceiver } from 'ffc-messaging'
import { start } from '../../../../app/messaging'

jest.mock('ffc-messaging')

const mocksubscribe = jest.fn()
MessageReceiver.prototype.subscribe = mocksubscribe

describe(('Fetch application tests'), () => {
  test('successfully fetched application', async () => {
    await start({ info: jest.fn() })
    expect(mocksubscribe).toHaveBeenCalledTimes(2)
  })
})
