import * as storageBlob from '@azure/storage-blob'
import { initialiseClient, getBlob } from '../../../app/storage'
import { config } from '../../../app/config/storage'

const mockErrorLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger
}

describe('storage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Download blob', () => {
    test('create blob client with connectionStringEnabled = true', () => {
      config.useConnectionString = true
      const fromStringSpy = jest.spyOn(storageBlob.BlobServiceClient, 'fromConnectionString')
      fromStringSpy.mockImplementation()

      initialiseClient()

      expect(fromStringSpy).toHaveBeenCalledTimes(1)
    })

    test('create blob client with connectionStringEnabled = false', () => {
      config.useConnectionString = false
      const mockFromString = jest.fn()
      const mockBlobClientFn = jest.fn().mockImplementation(() => {
        return {
          fromConnectionString: mockFromString
        }
      })
      // storageBlob.BlobServiceClient = mockBlobClientFn
      // const constructorSpy = jest.spyOn(storageBlob, 'BlobServiceClient')

      jest.mock('@azure/storage-blob', () => {
        return {
          BlobServiceClient: mockBlobClientFn
        }
      })

      initialiseClient()

      expect(mockFromString).toHaveBeenCalledTimes(0)
    })

    test('getBlob should return parsed JSON data from downloaded blob', async () => {
      const mockDownloadResponse = {
        readableStreamBody: {
          on: jest.fn(),
          read: jest.fn(),
          once: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(),
          isPaused: jest.fn(),
          pipe: jest.fn(),
          unpipe: jest.fn(),
          unshift: jest.fn(),
          wrap: jest.fn(),
          [Symbol.asyncIterator]: jest.fn()
        }
      }
      const mockJsonData = { key: 'value' }
      const mockBuffer = Buffer.from(JSON.stringify(mockJsonData))
      const mockStreamToBuffer = jest.fn().mockResolvedValue(mockBuffer)
      const mockDownload = jest.fn()
      const mockBlobClient = jest.fn()
      jest.mock('../../../app/lib/streamToBuffer', () => ({
        streamToBuffer: mockStreamToBuffer
      }))
      const mockGetContainerClient = jest.fn().mockReturnValueOnce({
        getBlobClient: mockBlobClient.mockReturnValueOnce({
          download: mockDownload.mockResolvedValue(mockDownloadResponse)
        })
      })

      config.useConnectionString = false
      // const fromStringSpy = jest.spyOn(storageBlob.BlobServiceClient, 'getContainerClient')
      // fromStringSpy.mockImplementation(() => ({
      //   getContainerClient: mockGetContainerClient
      // }))
      // fromStringSpy.mockReturnValueOnce(mockGetContainerClient)

      jest.mock('@azure/storage-blob', () => {
        return {
          BlobServiceClient: jest.fn().mockImplementation(() => {
            return {
              getContainerClient: mockGetContainerClient
            }
          })
        }
      })

      const result = await getBlob(mockedLogger, 'filename.json')
      expect(mockGetContainerClient).toHaveBeenCalledTimes(1)
      expect(mockBlobClient).toHaveBeenCalledTimes(1)
      expect(mockDownload).toHaveBeenCalledTimes(1)
      expect(mockStreamToBuffer).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockJsonData)
    })
  })
})
