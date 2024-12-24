import joi from 'joi'
import { config as messageQueueConfig } from './message-queue.js'
import { config as storageConfig } from './storage.js'

const schema = joi.object({
  port: joi.number().default(3005),
  env: joi.string().valid('development', 'test', 'production').default('development'),
  isDev: joi.boolean().default(false),
  sendPaymentRequest: joi.boolean().default(true)
})

const baseConfig = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  sendPaymentRequest: process.env.SEND_PAYMENT_REQUEST
}

const { error } = schema.validate(baseConfig, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

export const config = { ...baseConfig, messageQueueConfig, storageConfig }
