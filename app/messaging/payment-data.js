import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'
import { config } from "../config/index.js";
import { sendMessage } from './send-message.js';
import { receiveMessage } from './receive-message.js';
import { streamToString } from '../lib/streamToString.js';

const messageType = "uk.gov.defra.ffc.pay.data.request";

export async function getPaymentData(frn) {
    const { paymentDataRequestTopic, paymentDataRequestResponse } = config.messageQueueConfig;

    console.log(`Retrieving payment data for reference: ${frn}`);
    console.log(`Address: ${paymentDataRequestTopic.address}`);
    console.log(`Response Queue: ${paymentDataRequestResponse.host} ${paymentDataRequestResponse.address}`);

    const messageId = uuidv4();
    
    await sendMessage(
        { category: "frn", value: frn },
       messageType,
       paymentDataRequestTopic,
        { messageId },
    )

    console.log(`Sent payment data request with ID: ${messageId}`);

    const response = await receiveMessage(messageId, paymentDataRequestResponse)
    console.log(`Received response for payment data: ${JSON.stringify(response)}`);

    const file = await getFile(response.uri);
    console.log(`Received payment data ${JSON.stringify(file)}`);

    return file
}

async function getFile(url) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.paymentDataStorageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(config.storageConfig.paymentDataStorageContainer);
    // just the file name, not the full path
    const fileName = url.split('/').pop();
    const blobClient = containerClient.getBlobClient(fileName);
     const downloadBlockBlobResponse = await blobClient.download(0);
    // Convert stream to string
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    return JSON.parse(downloaded);
}