import joi from 'joi'
import { config as messageQueueConfig } from './message-queue.js'
import { config as storageConfig } from './storage.js'

const schema = joi.object({
  port: joi.number(),
  env: joi.string().valid('development', 'test', 'production'),
  isDev: joi.boolean(),
  sendPaymentRequestOutbound: joi.boolean().required(),
  requestPaymentStatusScheduler: {
    enabled: joi.bool(),
    schedule: joi.string()
  }
})

const baseConfig = {
  port: process.env.PORT ?? 3005,
  env: process.env.NODE_ENV ?? 'development',
  isDev: process.env.NODE_ENV === 'development',
  sendPaymentRequestOutbound: process.env.SEND_PAYMENT_REQUEST === 'true',
  requestPaymentStatusScheduler: {
    enabled: process.env.REQUEST_PAYMENT_STATUS_ENABLED === 'true',
    schedule: process.env.REQUEST_PAYMENT_STATUS_SCHEDULE ?? '0 11 * * 1-5'
  }
}

const { error } = schema.validate(baseConfig, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

export const config = { ...baseConfig, messageQueueConfig, storageConfig }
