import { createBlobServiceClient } from '../../../app/storage'
import { config } from '../../../app/config/storage'
import { streamToBuffer } from '../../../app/lib/streamToBuffer'
import { BlobServiceClient } from '@azure/storage-blob'

const mockErrorLogger = jest.fn()
const mockInfoLogger = jest.fn()
const mockWarnLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger,
  info: mockInfoLogger,
  warn: mockWarnLogger
}

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
    BlobServiceClient
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
  })

  describe('getBlob', () => {
    test('should return parsed JSON from blob', async () => {
      config.useConnectionString = false

      const client = createBlobServiceClient()
      const result = await client.getBlob(mockedLogger, 'filename.json')

      expect(result).toEqual({ key: 'value' })
      expect(streamToBuffer).toHaveBeenCalled()
    })

    test('should log and throw error if blob download fails', async () => {
      config.useConnectionString = true
      config.endemicsSettingsContainer = 'my-container'
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            download: jest.fn().mockRejectedValue(new Error('Download failed'))
          })
        })
      })

      const client = createBlobServiceClient()

      await expect(client.getBlob(mockedLogger, 'badfile.json')).rejects.toThrow('Download failed')
      expect(mockErrorLogger).toHaveBeenCalledWith(expect.stringContaining('Error when getting prices config'))
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
      const result = await client.deleteBlob({ logger: mockedLogger, filename: 'test.json' })

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
      const result = await client.deleteBlob({ logger: mockedLogger, filename: 'missing.json' })

      expect(result).toBe(false)
      expect(mockWarnLogger).toHaveBeenCalledWith('Blob not found or already deleted: missing.json')
    })

    test('should log and throw error if deletion fails', async () => {
      BlobServiceClient.fromConnectionString.mockReturnValue({
        getContainerClient: () => ({
          getBlobClient: () => ({
            deleteIfExists: jest.fn().mockRejectedValue(new Error('Deletion failed'))
          })
        })
      })
      const client = createBlobServiceClient()

      await expect(client.deleteBlob({ logger: mockedLogger, filename: 'test.json' })).rejects.toThrow('Deletion failed')
      expect(mockErrorLogger).toHaveBeenCalledWith(expect.stringContaining('Error deleting blob test.json'))
    })
  })
})
