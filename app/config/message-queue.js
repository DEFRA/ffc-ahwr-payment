const Joi = require('joi')
const msgTypePrefix = 'uk.gov.ffc.ahwr'

const sharedConfigSchema = {
  appInsights: Joi.object(),
  host: Joi.string(),
  password: Joi.string(),
  username: Joi.string(),
  useCredentialChain: Joi.bool().default(false)
}

const schema = Joi.object({
  applicationPaymentRequestQueue: {
    address: Joi.string(),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  paymentRequestTopic: {
    address: Joi.string(),
    ...sharedConfigSchema
  },
  paymentResponseSubscription: {
    topic: Joi.string().default('paymentResponseTopic'),
    address: Joi.string(),
    type: Joi.string().default('subscription'),
    ...sharedConfigSchema
  },
  submitPaymentRequestMsgType: Joi.string()
})

const sharedConfig = {
  appInsights: require('applicationinsights'),
  host: process.env.MESSAGE_QUEUE_HOST,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  username: process.env.MESSAGE_QUEUE_USER,
  useCredentialChain: process.env.NODE_ENV === 'production'
}

const config = {
  applicationPaymentRequestQueue: {
    address: process.env.APPLICATIONPAYMENTREQUEST_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  paymentRequestTopic: {
    address: process.env.PAYMENTREQUEST_TOPIC_ADDRESS,
    ...sharedConfig
  },
  paymentResponseSubscription: {
    topic: process.env.PAYMENTRESPONSE_TOPIC_ADDRESS,
    address: process.env.PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS,
    type: 'subscription',
    ...sharedConfig
  },
  submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The message queue config is invalid. ${error.message}`)
}
console.log('Message queue config validated>>>>>>>', value)
module.exports = value
