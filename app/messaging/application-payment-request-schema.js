const joi = require('joi')

const applicationPaymentRequestSchema = joi.object({
  reference: joi.string().required(),
  sbi: joi.string().required(),
  whichReview: joi.string().required()
})

const validateApplicationPaymentRequest = (applicationPaymentRequest) => {
  const validate = applicationPaymentRequestSchema.validate(applicationPaymentRequest)

  if (validate.error) {
    console.error('Application payment request validation error', validate.error)
    return false
  }

  return true
}

module.exports = validateApplicationPaymentRequest
