import { paymentRequest as paymentRequestConstant } from '../constants/constants.js'
import { get, set } from '../repositories/payment-repository.js'
import { validateApplicationPaymentRequest } from './application-payment-request-schema.js'
import { validatePaymentRequest } from './payment-request-schema.js'
import { getPaymentData } from '../lib/getPaymentData.js'
import { createBlobServiceClient } from '../storage.js'
import { config } from '../config/index.js'

export const isPigsAndPaymentsUserJourney = (dateOfVisit) => {
  return new Date(dateOfVisit) >= new Date(config.pigsAndPayments.releaseDate)
}

const getPricesConfig = async (dateOfVisit, logger) => {
  const filename = isPigsAndPaymentsUserJourney(dateOfVisit) ? 'claim-prices-config-20260122.json' : 'claim-prices-config.json'
  return createBlobServiceClient().getBlob(logger, filename, config.storageConfig.endemicsSettingsContainer)
}

const buildPaymentRequest = async (logger, applicationPaymentRequest) => {
  const {
    isEndemics,
    reviewTestResults,
    claimType,
    dateOfVisit,
    optionalPiHuntValue,
    reference: agreementNumber,
    sbi,
    whichReview: species
  } = applicationPaymentRequest
  const { description, paymentRequestNumber, sourceSystem } = paymentRequestConstant

  const marketingYear = new Date().getFullYear()

  const pricesConfig = await getPricesConfig(dateOfVisit, logger)

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
