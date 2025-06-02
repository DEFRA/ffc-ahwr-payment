import joi from 'joi'
import appInsights from 'applicationinsights'

const msgTypePrefix = 'uk.gov.ffc.ahwr'

const sharedConfigSchema = {
  appInsights: joi.object(),
  host: joi.string().required(),
  password: joi.string(),
  username: joi.string(),
  useCredentialChain: joi.bool().default(false),
  managedIdentityClientId: joi.string().optional()
}

const schema = joi.object({
  applicationPaymentRequestQueue: {
    address: joi.string(),
    type: joi.string(),
    ...sharedConfigSchema
  },
  paymentRequestTopic: {
    address: joi.string(),
    ...sharedConfigSchema
  },
  paymentResponseSubscription: {
    topic: joi.string().default('paymentResponseTopic'),
    address: joi.string(),
    type: joi.string().default('subscription'),
    ...sharedConfigSchema
  },
  submitPaymentRequestMsgType: joi.string(),
  paymentDataRequestTopic: {
    address: joi.string().default('paymentDataRequestTopic'),
    ...sharedConfigSchema
  },
  paymentDataRequestResponse: {
    address: joi.string().default('paymentDataResponseQueue'),
    ...sharedConfigSchema
  },
})

const sharedConfig = {
  appInsights,
  host: process.env.MESSAGE_QUEUE_HOST,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  username: process.env.MESSAGE_QUEUE_USER,
  useCredentialChain: process.env.NODE_ENV === 'production',
  managedIdentityClientId: process.env.AZURE_CLIENT_ID
}

const combinedConfig = {
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
  submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`,
  paymentDataRequestTopic: {
    address: process.env.PAYMENT_DATA_REQUEST_TOPIC_ADDRESS,
    ...sharedConfig,
    host: process.env.PAYMENT_MESSAGE_QUEUE_HOST,
    password: process.env.PAYMENT_MESSAGE_QUEUE_PASSWORD,
    username: process.env.PAYMENT_MESSAGE_QUEUE_USER,
  },
  paymentDataRequestResponse: {
    address: process.env.PAYMENT_DATA_REQUEST_RESPONSE_ADDRESS,
    ...sharedConfig,
    host: process.env.PAYMENT_MESSAGE_QUEUE_HOST,
    password: process.env.PAYMENT_MESSAGE_QUEUE_PASSWORD,
    username: process.env.PAYMENT_MESSAGE_QUEUE_USER,
  },
}

const { error } = schema.validate(combinedConfig, { abortEarly: false })

if (error) {
  throw new Error(`The message queue config is invalid. ${error.message}`)
}

export const config = combinedConfig
