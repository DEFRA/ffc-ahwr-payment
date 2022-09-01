const { description, paymentRequestNumber, sourceSystem } = require('../constants/payment-request')
const { get, set } = require('../repositories/payment-repository')
const speciesData = require('./species')
const validateApplicationPaymentRequest = require('./application-payment-request-schema')
const validatePaymentRequest = require('./payment-request-schema')

const buildPaymentRequest = (application) => {
  const agreementNumber = application.reference
  const sbi = application.sbi
  const marketingYear = new Date().getFullYear()
  const species = application.whichReview
  const standardCode = speciesData[species]?.code
  const value = speciesData[species]?.value

  return {
    sourceSystem,
    sbi,
    marketingYear,
    paymentRequestNumber,
    agreementNumber,
    value,
    invoiceLines: [{
      standardCode,
      description,
      value
    }]
  }
}

const savePaymentRequest = async (applicationPaymentRequest) => {
  if (validateApplicationPaymentRequest(applicationPaymentRequest)) {
    const { reference } = applicationPaymentRequest

    const paymentExists = await checkIfPaymentExists(reference)

    if (!paymentExists) {
      const paymentRequest = buildPaymentRequest(applicationPaymentRequest)
      if (validatePaymentRequest(paymentRequest)) {
        await set(reference, paymentRequest)
      } else {
        throw new Error(`Payment request schema not valid for reference ${reference}`)
      }
    } else {
      throw new Error(`Payment request already exists for reference ${reference}`)
    }
  } else {
    throw new Error('Application payment request schema not valid')
  }
}

const checkIfPaymentExists = async (reference) => {
  return get(reference)
}

module.exports = savePaymentRequest
