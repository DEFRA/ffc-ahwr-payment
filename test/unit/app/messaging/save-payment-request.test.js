import { savePaymentRequest } from '../../../../app/messaging/save-payment-request'
import { validatePaymentRequest } from '../../../../app/messaging/payment-request-schema.js'
import * as getPayment from '../../../../app/lib/getPaymentData'
import * as paymentRepo from '../../../../app/repositories/payment-repository'

jest.mock('../../../../app/repositories/payment-repository')
jest.mock('../../../../app/lib/getPaymentData')
jest.mock('../../../../app/storage')
jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/payment-request-schema')

jest.mock('../../../../app/config', () => ({
  storage: {
    storageAccount: 'mockStorageAccount',
    useConnectionString: false,
    endemicsSettingsContainer: 'endemics-settings',
    connectionString: 'connectionString'
  }
}))

const paymentRepoGetSpy = jest.spyOn(paymentRepo, 'get')
const paymentRepoSetSpy = jest.spyOn(paymentRepo, 'set')
const getPaymentDataSpy = jest.spyOn(getPayment, 'getPaymentData')

const mockErrorLogger = jest.fn()

const mockedLogger = {
  error: mockErrorLogger
}

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
  frn: '923456789'
}

describe(('Save payment request'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    getPaymentDataSpy.mockReturnValue({ standardCode: 'AHWR-Beef', value: 522 })
  })

  test('Set creates record for payment', async () => {
    validatePaymentRequest.mockReturnValueOnce(true)
    paymentRepoGetSpy.mockResolvedValueOnce()
    await savePaymentRequest(mockedLogger, applicationPaymentRequest)
    expect(paymentRepoSetSpy).toHaveBeenCalledTimes(1)
  })

  test('Set creates record for payment without frm', async () => {
    validatePaymentRequest.mockReturnValueOnce(true)
    paymentRepoGetSpy.mockResolvedValueOnce()
    await savePaymentRequest(mockedLogger, applicationPaymentRequestMissingFrn)
    expect(paymentRepoSetSpy).toHaveBeenCalledTimes(1)
  })

  test('error thrown with payment request already existing', async () => {
    paymentRepoGetSpy.mockResolvedValueOnce({ applicationReference: reference })
    await expect(savePaymentRequest(mockedLogger, applicationPaymentRequest)).rejects.toEqual(new Error(`Payment request already exists for reference ${reference}`))
  })

  test('error thrown due to incorrect payment request schema', async () => {
    paymentRepoGetSpy.mockResolvedValueOnce()
    await expect(savePaymentRequest(mockedLogger, { reference })).rejects.toEqual(new Error('Application payment request schema not valid'))
  })
})

describe('Save payment request part 2', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    getPaymentDataSpy.mockReturnValue({ standardCode: 'AHWR-Beef', value: 522 })
  })
  test('throws error if payment request is undefined', async () => {
    await expect(savePaymentRequest(mockedLogger, undefined)).rejects.toThrow()
  })

  test('throws error if payment request is empty object', async () => {
    await expect(savePaymentRequest(mockedLogger, {})).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if reference is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.reference

    await expect(savePaymentRequest(mockedLogger, paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if sbi is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.sbi

    await expect(savePaymentRequest(mockedLogger, paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if whichReview is missing', async () => {
    const paymentRequest = { ...applicationPaymentRequest }
    delete paymentRequest.whichReview

    await expect(savePaymentRequest(mockedLogger, paymentRequest)).rejects.toThrow(
      'Application payment request schema not valid'
    )
  })

  test('throws error if built payment request is invalid', async () => {
    validatePaymentRequest.mockReturnValueOnce(false)

    await expect(savePaymentRequest(mockedLogger, applicationPaymentRequest)).rejects.toThrow(
      'Payment request schema not valid'
    )
  })

  test('saves payment request if valid', async () => {
    paymentRepoGetSpy.mockResolvedValueOnce()
    validatePaymentRequest.mockReturnValueOnce(true)
    const expectedYear = new Date().getFullYear()

    await savePaymentRequest(mockedLogger, applicationPaymentRequest)

    expect(paymentRepoSetSpy).toHaveBeenCalledTimes(1)
    expect(paymentRepoSetSpy).toHaveBeenCalledWith(
      'AA-123-456', {
        agreementNumber: 'AA-123-456',
        invoiceLines: [{ description: 'G00 - Gross value of claim', standardCode: 'AHWR-Beef', value: 522 }],
        marketingYear: expectedYear,
        paymentRequestNumber: 1,
        sbi: '123456789',
        sourceSystem: 'AHWR',
        value: 522,
        frn: '923456789'
      }
    )
  })
})
