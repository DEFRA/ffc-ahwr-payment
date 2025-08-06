import { get } from '../repositories/payment-repository.js'
import { processFrnRequest } from '../jobs/request-payment-status.js'
import joi from 'joi'

const checkStatusRequestSchema = joi.object({
  reference: joi.string().required()
})

export const processCheckStatusRequest = async (logger, message, receiver) => {
  try {
    const { reference } = message.body
    logger.setBindings({ reference })
    logger.info('Received check status request')
    const { error } = checkStatusRequestSchema.validate(message.body)
    if (error) {
      logger.error(error, 'Check status request validation error')
      throw new Error('Invalid message')
    }
    // get the record from DB
    const existingRecord = await get(reference)

    if (!existingRecord) {
      logger.info(`No payment request found for reference ${reference}`)
      throw new Error(`No payment request found for reference ${reference}`)
    }
    const { dataValues: { frn } } = existingRecord

    await processFrnRequest(frn, logger, new Set([reference]))
    await receiver.completeMessage(message)
  } catch (err) {
    await receiver.deadLetterMessage(message)

    logger.error(`Unable to process check status request: ${err}`)
  }
}
