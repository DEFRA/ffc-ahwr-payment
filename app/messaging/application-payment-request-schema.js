const joi = require('joi')

const applicationPaymentRequestSchema = joi.object({
  reference: joi.string().required(),
  sbi: joi.string().required(),
  isEndemics: joi.boolean().default(false),
  reviewTestResults: joi.string().allow(null).optional(),
  whichReview: joi.string().required(),
  frn: joi.string().optional(),
  claimType: joi.string().default('')
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
