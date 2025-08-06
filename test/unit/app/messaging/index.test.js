import { MessageReceiver } from 'ffc-messaging'
import { start, stop } from '../../../../app/messaging'

jest.mock('ffc-messaging')
jest.mock('../../../../app/config/message-queue', () => ({
  config: {
    applicationPaymentRequestQueue: 'application-payment-request-queue',
    paymentResponseSubscription: 'payment-response-subscription'
  }
}))
jest.mock('../../../../app/messaging/process-check-status-request.js', () => ({}))
jest.mock('../../../../app/messaging/process-application-payment-request.js', () => ({}))

const mocksubscribe = jest.fn()
const mockClose = jest.fn()
MessageReceiver.prototype.subscribe = mocksubscribe
MessageReceiver.prototype.closeConnection = mockClose

describe(('Message receivers'), () => {
  test('successfully started receivers', async () => {
    await start({ info: jest.fn() })
    expect(mocksubscribe).toHaveBeenCalledTimes(2)
  })

  test('successfully stopped receivers', async () => {
    await stop()
    expect(mockClose).toHaveBeenCalledTimes(2)
  })
})
