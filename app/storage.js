const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
const { connectionString, useConnectionString, endemicsSettingsContainer, storageAccount } = require('./config').storage

let blobServiceClient

if (useConnectionString === true) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
} else {
  const uri = `https://${storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
}

const streamToBuffer = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

const getBlob = async (filename) => {
  try {
    const container = blobServiceClient.getContainerClient(endemicsSettingsContainer)
    const blobClient = container.getBlobClient(filename)
    const downloadResponse = await blobClient.download()
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)
    return JSON.parse(downloaded.toString())
  } catch (error) {
    console.log('Error:', error)
    throw error
  }
}

module.exports = {
  getBlob
}