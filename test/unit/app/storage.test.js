import { createBlobClient, createBlobServiceClient } from '../../../app/storage'
import { config } from '../../../app/config/storage'
import { streamToBuffer } from '../../../app/lib/streamToBuffer'
import { BlobClient, BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'

const mockErrorLogger = jest.fn()
const mockInfoLogger = jest.fn()
const mockWarnLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger,
  info: mockInfoLogger,
  warn: mockWarnLogger
}

jest.mock('@azure/identity')
jest.mock('@azure/storage-blob', () => {
  const mockBlobServiceClient = {
    getContainerClient: jest.fn().mockImplementation(() => ({
      getBlobClient: jest.fn().mockImplementation(() => ({
        download: jest.fn().mockResolvedValue({
          readableStreamBody: {
            on: jest.fn(),
            read: jest.fn(),
            [Symbol.asyncIterator]: jest.fn()
          }
        }),
        deleteIfExists: jest.fn().mockResolvedValue({ succeeded: true })
      }))
    }))
  }

  const BlobServiceClient = jest.fn().mockImplementation(() => mockBlobServiceClient)
  BlobServiceClient.fromConnectionString = jest.fn().mockReturnValue(mockBlobServiceClient)

  return {
    BlobServiceClient,
    BlobClient: jest.fn()
  }
})
jest.mock('../../../app/lib/streamToBuffer', () => ({
  streamToBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ key: 'value' })))
}))

describe('storage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBlobServiceClient', () => {
    test('should create client using connection string when config.useConnectionString is true', () => {
      config.useConnectionString = true
      config.connectionString = 'someConnectionString'

      const client = createBlobServiceClient()

      expect(client).toHaveProperty('getBlob')
      expect(client).toHaveProperty('deleteBlob')
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith('someConnectionString')
    })

    test('should create client using DefaultAzureCredential when config.useConnectionString is false', () => {
      config.useConnectionString = false
      config.storageAccount = 'testaccount'

      const client = createBlobServiceClient()

      expect(client).toHaveProperty('getBlob')
      expect(client).toHaveProperty('deleteBlob')
      expect(BlobServiceClient).toHaveBeenCalled()
    })

    test('should create client using options.connectionString if provided', () => {
      const customConnectionString = 'customConnectionString123'

      const client = createBlobServiceClient({ connectionString: customConnectionString })

      expect(client).toHaveProperty('getBlob')
      expect(client).toHaveProperty('deleteBlob')

      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(customConnectionString)
    })

    test('should create client using options.accountName if provided', () => {
      const accountName = 'pay-data-hub'

      const client = createBlobServiceClient({ accountName })

      expect(client).toHaveProperty('getBlob')
      expect(client).toHaveProperty('deleteBlob')

      expect(BlobServiceClient).toHaveBeenCalledWith(
        'https://pay-data-hub.blob.core.windows.net',
        expect.any(Object)
      )
    })
  })

  describe('getBlob', () => {
    test('should return parsed JSON from blob', async () => {
      config.useConnectionString = false

      const client = createBlobServiceClient()
      const result = await client.getBlob(mockedLogger, 'filename.json', 'data-requests')

      expect(result).toEqual({ key: 'value' })
      expect(streamToBuffer).toHaveBeenCalled()
    })

    test('should log and throw error if blob download fails', async () => {
      config.useConnectionString = true
      config.endemicsSettingsContainer = 'my-container'
      const error = new Error('Download failed')
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            download: jest.fn().mockRejectedValue(error)
          })
        })
      })

      const client = createBlobServiceClient()

      await expect(client.getBlob(mockedLogger, 'badfile.json', 'data-requests')).rejects.toThrow('Download failed')
      expect(mockErrorLogger).toHaveBeenCalledWith('Unable to retrieve blob: data-requests/badfile.json', { err: error })
    })
  })

  describe('deleteBlob', () => {
    test('should delete blob successfully and log info', async () => {
      config.useConnectionString = true
      config.endemicsSettingsContainer = 'my-container'
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            deleteIfExists: jest.fn().mockResolvedValueOnce({ succeeded: true })
          })
        })
      })

      const client = createBlobServiceClient()
      const result = await client.deleteBlob(mockedLogger, 'test.json', 'data-requests')

      expect(result).toBe(true)
      expect(mockInfoLogger).toHaveBeenCalledWith('Successfully deleted blob: test.json')
    })

    test('should log warning if blob not found or already deleted', async () => {
      config.useConnectionString = true
      config.endemicsSettingsContainer = 'my-container'
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            deleteIfExists: jest.fn().mockResolvedValueOnce({ succeeded: false })
          })
        })
      })

      const client = createBlobServiceClient()
      const result = await client.deleteBlob(mockedLogger, 'missing.json', 'data-requests')

      expect(result).toBe(false)
      expect(mockWarnLogger).toHaveBeenCalledWith('Blob not found or already deleted: missing.json')
    })

    test('should log and throw error if deletion fails', async () => {
      const error = new Error('Deletion failed')
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            deleteIfExists: jest.fn().mockRejectedValue(error)
          })
        })
      })
      const client = createBlobServiceClient()

      await expect(client.deleteBlob(mockedLogger, 'test.json', 'data-requests')).rejects.toThrow('Deletion failed')
      expect(mockErrorLogger).toHaveBeenCalledWith('Unable to delete blob: data-requests/test.json', { err: error })
    })
  })
})

describe('createBlobClient', () => {
  const blobUri = 'https://example.blob.core.windows.net/container/blob.json'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getBlob should return parsed JSON from blob', async () => {
    const downloadMock = jest.fn().mockResolvedValue({
      readableStreamBody: {}
    })
    BlobClient.mockImplementation(() => ({
      download: downloadMock
    }))
    streamToBuffer.mockResolvedValue(Buffer.from(JSON.stringify({ foo: 'bar' })))

    const client = createBlobClient(mockedLogger, blobUri)
    const data = await client.getBlob()

    expect(BlobClient).toHaveBeenCalledWith(
      blobUri,
      expect.any(DefaultAzureCredential)
    )
    expect(downloadMock).toHaveBeenCalled()
    expect(streamToBuffer).toHaveBeenCalledWith({})
    expect(data).toEqual({ foo: 'bar' })
  })

  test('getBlob should log error and throw if download fails', async () => {
    const error = new Error('Download error')
    BlobClient.mockImplementation(() => ({
      download: jest.fn().mockRejectedValue(error)
    }))

    const client = createBlobClient(mockedLogger, blobUri)

    await expect(client.getBlob()).rejects.toThrow('Download error')
    expect(mockErrorLogger).toHaveBeenCalledWith(
      `Unable to retrieve blob: ${blobUri}`,
      { err: error }
    )
  })

  test('deleteBlob should log info and return true on success', async () => {
    const deleteIfExistsMock = jest.fn().mockResolvedValue({ succeeded: true })
    BlobClient.mockImplementation(() => ({
      deleteIfExists: deleteIfExistsMock
    }))

    const client = createBlobClient(mockedLogger, blobUri)
    const result = await client.deleteBlob()

    expect(deleteIfExistsMock).toHaveBeenCalled()
    expect(result).toBe(true)
    expect(mockInfoLogger).toHaveBeenCalledWith(`Successfully deleted blob: ${blobUri}`)
  })

  test('deleteBlob should log warning and return false if blob not found', async () => {
    const deleteIfExistsMock = jest.fn().mockResolvedValue({ succeeded: false })
    BlobClient.mockImplementation(() => ({
      deleteIfExists: deleteIfExistsMock
    }))

    const client = createBlobClient(mockedLogger, blobUri)
    const result = await client.deleteBlob()

    expect(deleteIfExistsMock).toHaveBeenCalled()
    expect(result).toBe(false)
    expect(mockWarnLogger).toHaveBeenCalledWith(`Blob not found or already deleted: ${blobUri}`)
  })

  test('deleteBlob should log error and throw if deletion fails', async () => {
    const error = new Error('Delete error')
    BlobClient.mockImplementation(() => ({
      deleteIfExists: jest.fn().mockRejectedValue(error)
    }))

    const client = createBlobClient(mockedLogger, blobUri)

    await expect(client.deleteBlob()).rejects.toThrow('Delete error')
    expect(mockErrorLogger).toHaveBeenCalledWith(
      `Unable to delete blob: ${blobUri}`,
      { err: error }
    )
  })
})
