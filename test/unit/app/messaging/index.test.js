import { MessageReceiver } from 'ffc-messaging'
import { routeMessage, start, stop } from '../../../../app/messaging'
import { processCheckStatusRequest } from '../../../../app/messaging/process-check-status-request.js'
import { processApplicationPaymentRequest } from '../../../../app/messaging/process-application-payment-request.js'

jest.mock('ffc-messaging')
jest.mock('../../../../app/config/message-queue', () => ({
  config: {
    applicationPaymentRequestQueue: 'application-payment-request-queue',
    paymentResponseSubscription: 'payment-response-subscription'
  }
}))
jest.mock('../../../../app/messaging/process-check-status-request.js')
jest.mock('../../../../app/messaging/process-application-payment-request.js')

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

  test('route inbound message to processApplicationPaymentRequest', async () => {
    const mockMessage = {
      applicationProperties: {
        type: 'uk.gov.ffc.ahwr.application.payment.request'
      },
      body: { reference: 'ABCD-1234-5678', amount: 555 }
    }
    const mockChild = jest.fn()
    const mockLogger = { child: jest.fn(() => mockChild) }
    await routeMessage(mockMessage, mockLogger)
    expect(mockLogger.child).toHaveBeenCalledTimes(1)
    expect(processApplicationPaymentRequest).toHaveBeenCalledWith(mockChild, mockMessage, expect.anything())
  })

  test('route inbound message to processCheckStatusRequest', async () => {
    const mockMessage = {
      applicationProperties: {
        type: 'uk.gov.ffc.ahwr.check.status.request'
      },
      body: { reference: 'ABCD-1234-5678' }
    }
    const mockChild = jest.fn()
    const mockLogger = { child: jest.fn(() => mockChild) }
    await routeMessage(mockMessage, mockLogger)
    expect(mockLogger.child).toHaveBeenCalledTimes(1)
    expect(processCheckStatusRequest).toHaveBeenCalledWith(mockChild, mockMessage, expect.anything())
  })
})
