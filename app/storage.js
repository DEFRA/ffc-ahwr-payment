import { BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import { config } from './config/storage.js'
import { streamToBuffer } from './lib/streamToBuffer.js'

export const createBlobServiceClient = (options = {}) => {
  let blobServiceClient

  if (options.connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(options.connectionString)
  } else if (config.useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString)
  } else {
    const uri = `https://${config.storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID }))
  }

  const getBlob = async (logger, filename) => {
    try {
      const container = blobServiceClient.getContainerClient(config.endemicsSettingsContainer)
      const blobClient = container.getBlobClient(filename)
      const downloadResponse = await blobClient.download()
      const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)
      return JSON.parse(downloaded.toString())
    } catch (error) {
      logger.error(`Error when getting prices config from blob storage: ${error}`)
      throw error
    }
  }

  const deleteBlob = async ({ logger, filename }) => {
    try {
      const container = blobServiceClient.getContainerClient(config.endemicsSettingsContainer)
      const blobClient = container.getBlobClient(filename)
      const deleteResponse = await blobClient.deleteIfExists()

      if (deleteResponse.succeeded) {
        logger.info(`Successfully deleted blob: ${filename}`)
      } else {
        logger.warn(`Blob not found or already deleted: ${filename}`)
      }

      return deleteResponse.succeeded
    } catch (error) {
      logger.error(`Error deleting blob ${filename}: ${error.message}`)
      throw error
    }
  }

  return {
    getBlob,
    deleteBlob
  }
}
