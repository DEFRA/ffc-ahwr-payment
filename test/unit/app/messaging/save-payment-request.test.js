const savePaymentRequest = require('../../../../app/messaging/save-payment-request')
const { getBlob } = require('../../../../app/storage')
const { getPaymentData } = require('../../../../app/lib/getPaymentData')
const pricesConfig = require('../../../data/claim-prices-config.json')

jest.mock('../../../../app/repositories/payment-repository')
jest.mock('../../../../app/lib/getPaymentData')
jest.mock('../../../../app/storage')
const paymentRepository = require('../../../../app/repositories/payment-repository')
jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/config', () => ({
  storage: {
    storageAccount: 'mockStorageAccount',
    useConnectionString: false,
    endemicsSettingsContainer: 'endemics-settings',
    connectionString: 'connectionString'
  }
}))
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
const reference = 'AA-123-456'
const applicationPaymentRequestMissingFrn = {
  reference,
  sbi: '123456789',
  whichReview: 'beef',
  isEndemics: false
}
const applicationPaymentRequest = {
  ...applicationPaymentRequestMissingFrn,
  frn: '123456789'
}

describe(('Save payment request'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    getBlob.mockReturnValue(JSON.stringify(pricesConfig))
    getPaymentData.mockReturnValue({ standardCode: 'AHWR-Beef', value: 522 })
  })

  test('Set creates record for payment', async () => {
    paymentRepository.get.mockResolvedValueOnce()
    await savePaymentRequest(applicationPaymentRequest)
    expect(paymentRepository.set).toHaveBeenCalledTimes(1)
  })

  test('Set creates record for payment without frm', async () => {
    paymentRepository.get.mockResolvedValueOnce()
    await savePaymentRequest(applicationPaymentRequestMissingFrn)
    expect(paymentRepository.set).toHaveBeenCalledTimes(1)
  })

  test('error thrown with payment request already existing', async () => {
    paymentRepository.get.mockResolvedValueOnce({ applicationReference: reference })
    await expect(savePaymentRequest(applicationPaymentRequest)).rejects.toEqual(new Error(`Payment request already exists for reference ${reference}`))
  })

  test('error thrown due to incorrect payment request schema', async () => {
    paymentRepository.get.mockResolvedValueOnce()
    await expect(savePaymentRequest({ reference })).rejects.toEqual(new Error('Application payment request schema not valid'))
  })
})
describe('Save payment request part 2', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    getBlob.mockReturnValue(JSON.stringify(pricesConfig))
    getPaymentData.mockReturnValue({ standardCode: 'AHWR-Beef', value: 522 })
  })
  test('throws error if payment request is undefined', async () => {
    await expect(savePaymentRequest(undefined)).rejects.toThrow()
  })

  test('throws error if payment request is empty object', async () => {
    await expect(savePaymentRequest({})).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if reference is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.reference

    await expect(savePaymentRequest(paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if sbi is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.sbi

    await expect(savePaymentRequest(paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if whichReview is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.whichReview

    await expect(savePaymentRequest(paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('saves payment request if valid', async () => {
    paymentRepository.get.mockResolvedValueOnce()

    await savePaymentRequest(applicationPaymentRequest)

    expect(paymentRepository.set).toHaveBeenCalledTimes(1)
    expect(paymentRepository.set).toHaveBeenCalledWith(
      'AA-123-456', { agreementNumber: 'AA-123-456', invoiceLines: [{ description: 'G00 - Gross value of claim', standardCode: 'AHWR-Beef', value: 522 }], marketingYear: 2024, paymentRequestNumber: 1, sbi: '123456789', sourceSystem: 'AHWR', value: 522 }
    )
  })
})
