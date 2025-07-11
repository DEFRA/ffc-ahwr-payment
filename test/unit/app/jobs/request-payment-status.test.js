import { incrementPaymentCheckCount, updatePaymentStatusByClaimRef, getPendingPayments } from '../../../../app/repositories/payment-repository'
import { sendPaymentDataRequest } from '../../../../app/messaging/send-payment-data-request'
import { sendMessage } from '../../../../app/messaging/send-message'
import { createBlobClient } from '../../../../app/storage.js'
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
    }
  }
}))

describe('requestPaymentStatus', () => {
  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    setBindings: jest.fn()
  }

  const completeMessageMock = jest.fn().mockResolvedValue()
  const closeConnectionMock = jest.fn().mockResolvedValue()
  const deleteBlobMock = jest.fn().mockResolvedValue()
  const getBlobMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    getBlobMock.mockResolvedValue({
      data: [
        {
          agreementNumber: 'RESH-F99F-E09F',
          status: { name: 'Settled' },
          sbi: '107021978'
        }
      ]
    })
    getPendingPayments.mockResolvedValue([{
      dataValues: {
        frn: '1234567890',
        applicationReference: 'RESH-F99F-E09F'
      }
    }])
    updatePaymentStatusByClaimRef.mockResolvedValue([1, [{ dataValues: { sbi: '107021978' } }]])
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([{ body: { uri: 'blob://test-uri' } }]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))
    createBlobClient.mockReturnValue({
      getBlob: getBlobMock,
      deleteBlob: deleteBlobMock
    })
  })

  test('should send request and process paid claim response', async () => {
    await requestPaymentStatus(loggerMock)

    expect(sendPaymentDataRequest).toHaveBeenCalledWith(
      { category: 'frn', value: '1234567890' },
      expect.any(String),
      loggerMock,
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
    expect(loggerMock.error).not.toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
    expect(getBlobMock).toHaveBeenCalled()
    expect(createBlobClient).toHaveBeenCalledWith(loggerMock, 'blob://test-uri')
  })

  test('logs error if blob URI is missing', async () => {
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([{ body: {} }]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))

    await requestPaymentStatus(loggerMock)

    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('No blob URI received in payment data response') }, 'Error requesting payment status')
    expect(deleteBlobMock).not.toHaveBeenCalled()
    expect(completeMessageMock).toHaveBeenCalled()
  })

  test('logs error if receiveMessages returns empty array', async () => {
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockResolvedValue(),
      receiveMessages: jest.fn().mockResolvedValue([]),
      completeMessage: completeMessageMock,
      closeConnection: closeConnectionMock
    }))

    await requestPaymentStatus(loggerMock)

    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('No response messages received from payment data request') }, 'Error requesting payment status')
  })

  test('logs error if blob does not contain requested payment data', async () => {
    getBlobMock.mockResolvedValue({
      data: [
        {
          agreementNumber: 'AAAA-F99F-E09F',
          status: { name: 'Settled' },
          sbi: '107021978'
        }
      ]
    })
    await requestPaymentStatus(loggerMock)

    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('Blob does not contain requested payment data') }, 'Error requesting payment status')
    expect(completeMessageMock).toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
  })

  test('handles non-paid status by incrementing paid check count', async () => {
    getBlobMock.mockResolvedValue({
      data: [{ agreementNumber: 'RESH-F99F-E09F', status: { name: 'not_paid' } }]
    })

    await requestPaymentStatus(loggerMock)

    expect(incrementPaymentCheckCount).toHaveBeenCalledWith('RESH-F99F-E09F')
    expect(sendMessage).not.toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
    expect(completeMessageMock).toHaveBeenCalled()
  })
})
