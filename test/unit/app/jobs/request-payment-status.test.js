import { incrementPaymentCheckCount, updatePaymentStatusByClaimRef, getPendingPayments } from '../../../../app/repositories/payment-repository'
import { sendPaymentDataRequest } from '../../../../app/messaging/send-payment-data-request'
import { sendMessage } from '../../../../app/messaging/send-message'
import { createBlobClient } from '../../../../app/storage.js'
import { requestPaymentStatus } from '../../../../app/jobs/request-payment-status'
import { MessageReceiver } from 'ffc-messaging'
import { defaultClient } from 'applicationinsights'

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
jest.mock('applicationinsights', () => {
  const trackExceptionMock = jest.fn()
  return {
    defaultClient: {
      trackException: trackExceptionMock
    },
    setup: jest.fn().mockReturnThis(),
    start: jest.fn()
  }
})

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
    expect(defaultClient.trackException).not.toHaveBeenCalled()
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
    expect(defaultClient.trackException).not.toHaveBeenCalled()
  })

  test('raises appInsights exception when the maximum number of attempts limit has been reached', async () => {
    getBlobMock.mockResolvedValue({
      data: [{ agreementNumber: 'RESH-F99F-E09F', status: { name: 'not_paid' } }]
    })
    incrementPaymentCheckCount.mockResolvedValue(
      [
        [
          [{
            id: '32742adb-f37d-4bc8-8927-7f7d7cfc685e',
            applicationReference: 'RESH-F99F-E09F',
            data: { sbi: '234234', value: 436, invoiceLines: [{ value: 436, description: 'G00 - Gross value of claim', standardCode: 'AHWR-Sheep' }], sourceSystem: 'AHWR', marketingYear: 2025, agreementNumber: 'ABC-1234', paymentRequestNumber: 1 },
            createdAt: '2025-06-25T08:24:56.309Z',
            updatedAt: '2025-07-11T15:49:20.297Z',
            status: 'ack',
            paymentResponse: [{}],
            paymentCheckCount: 3,
            frn: '12345'
          }],
          1
        ],
        2
      ]
    )

    await requestPaymentStatus(loggerMock)

    expect(incrementPaymentCheckCount).toHaveBeenCalledWith('RESH-F99F-E09F')
    expect(sendMessage).not.toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
    expect(completeMessageMock).toHaveBeenCalled()
    expect(defaultClient.trackException).toHaveBeenCalledWith({
      exception: expect.any(Error),
      properties: { claimReference: 'RESH-F99F-E09F', payDataStatus: 'not_paid', sbi: '234234' }
    })
  })

  test('does not raise appInsights exception when no payments were found to increment paymentCheckCount', async () => {
    getBlobMock.mockResolvedValue({
      data: [{ agreementNumber: 'RESH-F99F-E09F', status: { name: 'not_paid' } }]
    })
    incrementPaymentCheckCount.mockResolvedValue(
      [
        [], 0
      ]
    )

    await requestPaymentStatus(loggerMock)

    expect(incrementPaymentCheckCount).toHaveBeenCalledWith('RESH-F99F-E09F')
    expect(sendMessage).not.toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
    expect(completeMessageMock).toHaveBeenCalled()
    expect(defaultClient.trackException).not.toHaveBeenCalled()
  })

  test('logs error when updating status to paid for claim fails', async () => {
    updatePaymentStatusByClaimRef.mockResolvedValue([0, []])

    await requestPaymentStatus(loggerMock)

    expect(sendMessage).not.toHaveBeenCalled()
    expect(deleteBlobMock).toHaveBeenCalled()
    expect(completeMessageMock).toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith('Payment not found to update paid status')
  })

  test('logs error when receiver fails to complete message', async () => {
    completeMessageMock.mockRejectedValue(new Error('Unexpected error'))

    await requestPaymentStatus(loggerMock)

    expect(completeMessageMock).toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('Unexpected error'), responseMessage: { body: { uri: 'blob://test-uri' } } }, 'Error completing response message')
  })

  test('logs error when receiver fails to close connection', async () => {
    closeConnectionMock.mockRejectedValue(new Error('Unexpected error'))

    await requestPaymentStatus(loggerMock)

    expect(closeConnectionMock).toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('Unexpected error') }, 'Error closing receiver connection')
  })

  test('logs error when failing to delete blob', async () => {
    deleteBlobMock.mockRejectedValue(new Error('Unexpected error'))

    await requestPaymentStatus(loggerMock)

    expect(deleteBlobMock).toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('Unexpected error'), blobUri: 'blob://test-uri' }, 'Error deleting blob')
  })

  test('logs error when failing to create receiver', async () => {
    MessageReceiver.mockImplementation(() => ({
      acceptSession: jest.fn().mockRejectedValue(new Error('Unexpected error'))
    }))

    await requestPaymentStatus(loggerMock)

    expect(loggerMock.error).toHaveBeenCalledWith({ err: new Error('Unexpected error') }, 'Error requesting payment status')
  })
})
