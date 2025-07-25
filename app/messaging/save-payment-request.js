import { paymentRequest } from '../constants/constants.js'
import { get, set } from '../repositories/payment-repository.js'
import { validateApplicationPaymentRequest } from './application-payment-request-schema.js'
import { validatePaymentRequest } from './payment-request-schema.js'
import { getPaymentData } from '../lib/getPaymentData.js'
import { createBlobServiceClient } from '../storage.js'
import { config } from '../config/storage.js'

const buildPaymentRequest = async (logger, applicationPaymentRequest) => {
  const {
    isEndemics,
    reviewTestResults,
    claimType,
    optionalPiHuntValue,
    reference: agreementNumber,
    sbi,
    whichReview: species
  } = applicationPaymentRequest
  const { description, paymentRequestNumber, sourceSystem } = paymentRequest
  const marketingYear = new Date().getFullYear()
  const blobServiceClient = createBlobServiceClient()
  const pricesConfig = await blobServiceClient.getBlob(logger, 'claim-prices-config.json', config.endemicsSettingsContainer)
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
    const { reference, frn } = applicationPaymentRequest

    const paymentExists = await checkIfPaymentExists(reference)

    if (!paymentExists) {
      const paymentRequest = await buildPaymentRequest(logger, applicationPaymentRequest)
      if (validatePaymentRequest(logger, paymentRequest)) {
        await set(reference, paymentRequest, frn)

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
