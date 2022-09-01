const Joi = require('joi')
const messageQueueConfig = require('./message-queue')

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  isDev: Joi.boolean().default(false),
  sendPaymentRequest: Joi.boolean().default(true)
})

const config = {
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  sendPaymentRequest: process.env.SEND_PAYMENT_REQUEST
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.messageQueueConfig = messageQueueConfig

module.exports = value
