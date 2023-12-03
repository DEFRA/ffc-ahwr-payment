const Joi = require('joi')
const messageQueueConfig = require('./message-queue')

const schema = Joi.object({
  port: Joi.number().default(3005),
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  isDev: Joi.boolean().default(false),
  sendPaymentRequest: Joi.boolean().default(true),
  CheckPaymentStatusScheduler: {
    enabled: Joi.bool().default(true),
    schedule: Joi.string().default('0 18 * * 1-5')
  }
})

const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  sendPaymentRequest: process.env.SEND_PAYMENT_REQUEST,
  CheckPaymentStatusScheduler: {
    enabled: process.env.CHECK_PAYMENT_STATUS_SCHEDULER_ENABLED,
    schedule: process.env.CHECK_PAYMENT_STATUS_SCHEDULER_SCHEDULE
  }
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.messageQueueConfig = messageQueueConfig

module.exports = value
