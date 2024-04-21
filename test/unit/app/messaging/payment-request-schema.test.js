const validatePaymentRequest = require('../../../../app/messaging/payment-request-schema')

describe('validatePaymentRequest', () => {
  test('returns true for valid payment request', () => {
    const validPaymentRequest = {
      sourceSystem: 'test',
      sbi: '123',
      marketingYear: 2022,
      paymentRequestNumber: 1,
      agreementNumber: 'XYZ',
      value: 100,
      invoiceLines: [
        {
          standardCode: 'abc',
          description: 'line 1',
          value: 50
        }
      ]
    }

    expect(validatePaymentRequest(validPaymentRequest)).toBe(true)
  })

  test('returns false for invalid payment request', () => {
    const invalidPaymentRequest = {
      // missing required sourceSystem
    }

    expect(validatePaymentRequest(invalidPaymentRequest)).toBe(false)
  })
})
