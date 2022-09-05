const paymentRepository = require('../../../../../app/repositories/payment-repository')
const reference = 'ABC-1234'
paymentRepository.get = jest.fn()
  .mockResolvedValueOnce({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data: {} } })
  .mockResolvedValueOnce({ dataValues: null })
  .mockResolvedValueOnce({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data: {} } })
  .mockResolvedValueOnce({ dataValues: null })
jest.mock('../../../../../app/repositories/payment-repository')
const savePaymentRequest = require('../../../../../app/messaging/save-payment-request')
savePaymentRequest.savePaymentRequest = jest.fn().mockResolvedValueOnce().mockRejectedValueOnce(new Error('payment failed'))

jest.mock('../../../../../app/messaging/send-payment-request')
const sendPaymentRequest = require('../../../../../app/messaging/send-payment-request')

describe('Payment API test', () => {
  const createServer = require('../../../../../app/server')
  let server

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET Payment route', () => {
    const url = `/api/payment/${reference}`
    const method = 'GET'
    test('returns 200', async () => {
      const options = {
        method,
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(paymentRepository.get).toHaveBeenCalledTimes(1)
    })
    test('returns 404', async () => {
      const options = {
        method,
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(paymentRepository.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('POST Payment route', () => {
    const payment = { reference: 'ABC-1234', sbi: '234234', whichReview: 'sheep' }
    const url = '/api/payment'
    const method = 'POST'
    test('returns 200', async () => {
      const options = {
        method: 'POST',
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(savePaymentRequest.savePaymentRequest).toHaveBeenCalledTimes(1)
    })
    test('returns 500 for error', async () => {
      const options = {
        method,
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(500)
      expect(savePaymentRequest.savePaymentRequest).toHaveBeenCalledTimes(1)
    })
    test('returns 400 for wrong request payload', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { reference: 'ABC-1234', sbi: 234234, whichReview: 'cow' }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(savePaymentRequest.savePaymentRequest).toHaveBeenCalledTimes(0)
    })
  })

  describe('POST Payment approve route', () => {
    const payment = { reference: 'ABC-1234' }
    const url = '/api/payment/approve'
    const method = 'POST'
    test('returns 200', async () => {
      const options = {
        method: 'POST',
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(sendPaymentRequest).toHaveBeenCalledTimes(1)
    })
    test('returns 404 for error', async () => {
      const options = {
        method,
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(paymentRepository.get).toHaveBeenCalledTimes(1)
      expect(sendPaymentRequest).toHaveBeenCalledTimes(0)
    })
    test('returns 400 for wrong request payload', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { reference: null }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(sendPaymentRequest).toHaveBeenCalledTimes(0)
    })

    test('returns 500 for error', async () => {
      const options = {
        method: 'POST',
        url,
        payload: payment
      }
      sendPaymentRequest.mockRejectedValueOnce(new Error('payment failed'))
      const res = await server.inject(options)
      expect(res.statusCode).toBe(500)
      expect(sendPaymentRequest).toHaveBeenCalledTimes(0)
    })
  })
})
