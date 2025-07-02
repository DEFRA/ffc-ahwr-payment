import { incrementPaymentCheckCount, updatePaymentStatusByClaimRef, getPendingPayments } from '../../../../app/repositories/payment-repository'
import { sendPaymentDataRequest } from '../../../../app/messaging/send-payment-data-request'
import { sendMessage } from '../../../../app/messaging/send-message'
import { createBlobServiceClient } from '../../../../app/storage.js'
import { requestPaymentStatus } from '../../../../app/jobs/request-payment-status'
import { MessageReceiver } from 'ffc-messaging'

jest.mock('../../../../app/repositories/payment-repository')
jest.mock('../../../../app/messaging/send-payment-data-request')
jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/storage.js')
jest.mock('ffc-messaging')
jest.mock('../../../../app/config', () => ({
  config: {
    messageQueueConfig: {
      moveClaimToPaidMsgType: 'move-claim-to-paid-msg-type',
      applicationRequestQueue: 'application-request-queue',
      paymentDataRequestResponseQueue: 'payment-data-request-response-queue'
    },
    storageConfig: {
      paymentDataHubConnectionString: 'payment-data-hub-connection-string'
    }
  }
}))

describe('requestPaymentStatus', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    setBindings: jest.fn()
  }

  let completeMessageMock, closeConnectionMock

  beforeEach(() => {
    jest.clearAllMocks()

    getPendingPayments.mockResolvedValue([{
      dataValues: {
        frn: '1234567890',
        agreementNumber: 'RESH-F99F-E09F'
      }
    }])
    updatePaymentStatusByClaimRef.mockResolvedValue([1, [{ dataValues: { sbi: '107021978' } }]])
    incrementPaymentCheckCount.mockResolvedValue()

    sendPaymentDataRequest.mockResolvedValue()
    sendMessage.mockResolvedValue()

    completeMessageMock = jest.fn().mockResolvedValue()
    closeConnectionMock = jest.fn().mockResolvedValue()

    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([{ body: { uri: 'blob://test-uri' } }]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))

    createBlobServiceClient.mockReturnValue({
      getBlob: jest.fn().mockResolvedValue({
        data: [
          {
            agreementNumber: 'RESH-F99F-E09F',
            status: { state: 'paid' },
            sbi: '107021978'
          }
        ]
      }),
      deleteBlob: jest.fn().mockResolvedValue()
    })
  })

  test('should send request and process paid claim response', async () => {
    await requestPaymentStatus(mockLogger)

    expect(sendPaymentDataRequest).toHaveBeenCalledWith(
      { category: 'frn', value: '1234567890' },
      expect.any(String),
      mockLogger,
      expect.any(String)
    )
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        claimRef: 'RESH-F99F-E09F',
        sbi: '107021978'
      }),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ sessionId: expect.any(String) })
    )
    expect(completeMessageMock).toHaveBeenCalled()
    expect(closeConnectionMock).toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  test('logs error if blob URI is missing', async () => {
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([{ body: {} }]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))

    await requestPaymentStatus(mockLogger)

    expect(mockLogger.error).toHaveBeenCalledWith('No blob URI received in payment data response')
    expect(createBlobServiceClient().deleteBlob).not.toHaveBeenCalled()
  })

  test('logs error if receiveMessages returns empty array', async () => {
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))

    await requestPaymentStatus(mockLogger)

    expect(mockLogger.error).toHaveBeenCalledWith('No response messages received from payment data request')
  })

  test('handles non-paid status by incrementing paid check count', async () => {
    createBlobServiceClient.mockReturnValue({
      getBlob: jest.fn().mockResolvedValue({
        data: [{ agreementNumber: 'RESH-F99F-E09F', status: { state: 'not_paid' } }]
      }),
      deleteBlob: jest.fn().mockResolvedValue()
    })

    await requestPaymentStatus(mockLogger)

    expect(incrementPaymentCheckCount).toHaveBeenCalledWith('RESH-F99F-E09F')
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
