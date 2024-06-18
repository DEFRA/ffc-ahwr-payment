const { description, paymentRequestNumber, sourceSystem } = require('../constants/payment-request')
const { get, set } = require('../repositories/payment-repository')
const validateApplicationPaymentRequest = require('./application-payment-request-schema')
const validatePaymentRequest = require('./payment-request-schema')
const { getPaymentData } = require('../lib/getPaymentData')
const { getBlob } = require('../storage')
const buildPaymentRequest = async (application) => {
  const agreementNumber = application.reference
  const sbi = application.sbi
  const marketingYear = new Date().getFullYear()
  const species = application.whichReview
  const { isEndemics, reviewTestResults, claimType } = application
  const pricesConfig = await getBlob('claim-prices-config.json')
  const { standardCode, value } = getPaymentData(species, reviewTestResults, pricesConfig, isEndemics, claimType)

  return {
    sourceSystem,
    sbi,
    marketingYear,
    paymentRequestNumber,
    agreementNumber,
    value,
    invoiceLines: [{
      description,
      standardCode,
      value
    }]
  }
}

const savePaymentRequest = async (applicationPaymentRequest) => {
  if (validateApplicationPaymentRequest(applicationPaymentRequest)) {
    const { reference } = applicationPaymentRequest

    const paymentExists = await checkIfPaymentExists(reference)

    if (!paymentExists) {
      const paymentRequest = await buildPaymentRequest(applicationPaymentRequest)
      if (validatePaymentRequest(paymentRequest)) {
        await set(reference, paymentRequest)

        return paymentRequest
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
