const savePaymentRequest = require('../../../../app/messaging/save-payment-request')
jest.mock('../../../../app/repositories/payment-repository')
const paymentRepository = require('../../../../app/repositories/payment-repository')
jest.mock('../../../../app/messaging/send-message')

const reference = 'AA-123-456'
const applicationPaymentRequestMissingFrn = {
  reference,
  sbi: '123456789',
  whichReview: 'beef'
}
const applicationPaymentRequest = {
  ...applicationPaymentRequestMissingFrn,
  frn: '123456789'
}

describe(('Save payment request'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
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
