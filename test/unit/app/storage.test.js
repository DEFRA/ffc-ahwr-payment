import { initialiseClient, getBlob } from '../../../app/storage'
import { config } from '../../../app/config/storage'

const mockErrorLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger
}

jest.mock('@azure/storage-blob', () => {
  const mockBsc = jest.fn().mockImplementation(() => ({
    getContainerClient: jest.fn().mockReturnValueOnce({
      getBlobClient: jest.fn().mockReturnValueOnce({
        download: jest.fn().mockResolvedValue({
          readableStreamBody: {
            on: jest.fn(),
            read: jest.fn(),
            [Symbol.asyncIterator]: jest.fn()
          }
        })
      })
    })
  }))
  mockBsc.fromConnectionString = jest.fn()
  return {
    BlobServiceClient: mockBsc
  }
})
jest.mock('../../../app/lib/streamToBuffer', () => ({
  streamToBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ key: 'value' })))
}))

describe('storage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Download blob', () => {
    test('create blob client with connectionStringEnabled = true', () => {
      config.useConnectionString = true

      const initialisedBy = initialiseClient()

      expect(initialisedBy).toBe('connectionString')
    })

    test('create blob client with connectionStringEnabled = false', () => {
      config.useConnectionString = false

      const initialisedBy = initialiseClient()

      expect(initialisedBy).toBe('constructor')
    })

    test('getBlob should return parsed JSON data from downloaded blob', async () => {
      config.useConnectionString = false

      const result = await getBlob(mockedLogger, 'filename.json')

      expect(result).toEqual({ key: 'value' })
    })
  })
})
