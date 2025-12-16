import joi from 'joi'
import { config as messageQueueConfig } from './message-queue.js'
import { config as storageConfig } from './storage.js'

const DEFAULT_PORT = 3005

const schema = joi.object({
  port: joi.number(),
  env: joi.string().valid('development', 'test', 'production'),
  isDev: joi.boolean(),
  sendPaymentRequestOutbound: joi.boolean().required(),
  requestPaymentStatusScheduler: {
    enabled: joi.bool().required(),
    schedule: joi.string().required(),
    initialAttempts: joi.number().required()
  },
  checkStatusRequestType: joi.string().required(),
  pigsAndPayments: {
    releaseDate: joi.string().required()
  }
})

const baseConfig = {
  port: process.env.PORT ?? DEFAULT_PORT,
  env: process.env.NODE_ENV ?? 'development',
  isDev: process.env.NODE_ENV === 'development',
  sendPaymentRequestOutbound: process.env.SEND_PAYMENT_REQUEST === 'true',
  requestPaymentStatusScheduler: {
    enabled: process.env.REQUEST_PAYMENT_STATUS_ENABLED === 'true',
    schedule: process.env.REQUEST_PAYMENT_STATUS_SCHEDULE ?? '0 11 * * 1-5',
    initialAttempts: Number.parseInt(process.env.REQUEST_PAYMENT_INITIAL_ATTEMPTS ?? '3', 10)
  },
  checkStatusRequestType: 'uk.gov.ffc.ahwr.check.status.request',
  pigsAndPayments: {
    releaseDate: process.env.PIGS_AND_PAYMENTS_RELEASE_DATE || '2026-01-22'
  }
}

const { error } = schema.validate(baseConfig, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

export const config = { ...baseConfig, messageQueueConfig, storageConfig }
