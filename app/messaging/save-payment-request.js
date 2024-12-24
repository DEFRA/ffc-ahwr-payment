import { paymentRequest } from '../constants/constants'
import { get, set } from '../repositories/payment-repository'
import { validateApplicationPaymentRequest } from './application-payment-request-schema'
import { validatePaymentRequest } from './payment-request-schema'
import { getPaymentData } from '../lib/getPaymentData'
import { getBlob } from '../storage'

const buildPaymentRequest = async (application) => {
  const { description, paymentRequestNumber, sourceSystem } = paymentRequest
  const agreementNumber = application.reference
  const sbi = application.sbi
  const marketingYear = new Date().getFullYear()
  const species = application.whichReview
  const { isEndemics, reviewTestResults, claimType, optionalPiHuntValue } = application
  const pricesConfig = await getBlob('claim-prices-config.json')
  const { standardCode, value } = getPaymentData(species, reviewTestResults, pricesConfig, isEndemics, claimType, optionalPiHuntValue)

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

const checkIfPaymentExists = async (reference) => {
  return get(reference)
}

export const savePaymentRequest = async (logger, applicationPaymentRequest) => {
  if (validateApplicationPaymentRequest(logger, applicationPaymentRequest)) {
    const { reference } = applicationPaymentRequest

    const paymentExists = await checkIfPaymentExists(reference)

    if (!paymentExists) {
      const paymentRequest = await buildPaymentRequest(applicationPaymentRequest)
      if (validatePaymentRequest(logger, paymentRequest)) {
        await set(reference, paymentRequest)

        return paymentRequest
      } else {
        throw new Error(`Payment request schema not valid for reference ${reference}`)
      }
    } else {
      throw new Error(`Payment request already exists for reference ${reference}`)
    }
  } else {
    logger.error()
    throw new Error('Application payment request schema not valid')
  }
}
