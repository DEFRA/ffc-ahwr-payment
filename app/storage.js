import { BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import { config } from './config/storage'
import { streamToBuffer } from './lib/streamToBuffer'

let blobServiceClient
let initialised = false

export function initialiseClient () {
  let initialisedBy = ''
  if (config.useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString)
    initialisedBy = 'connectionString'
  } else {
    const uri = `https://${config.storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
    initialisedBy = 'constructor'
  }
  initialised = true
  return initialisedBy
}

export const getBlob = async (logger, filename) => {
  try {
    if (!initialised) {
      initialiseClient()
    }
    const container = blobServiceClient.getContainerClient(config.endemicsSettingsContainer)
    const blobClient = container.getBlobClient(filename)
    const downloadResponse = await blobClient.download()
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)
    return JSON.parse(downloaded.toString())
  } catch (error) {
    logger.error('Error when getting prices config from blob storage', error)
    throw error
  }
}
