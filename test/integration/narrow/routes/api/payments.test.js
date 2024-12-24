import * as paymentRepository from '../../../../../app/repositories/payment-repository'
import * as savePayment from '../../../../../app/messaging/save-payment-request'
import { sendPaymentRequest } from '../../../../../app/messaging/send-payment-request'
import { createServer } from '../../../../../app/server'
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const reference = 'ABC-1234'

jest.mock('../../../../../app/repositories/payment-repository')

jest.mock('../../../../../app/messaging/send-payment-request')
const savePaymentSpy = jest.spyOn(savePayment, 'savePaymentRequest')
const paymentRepoSpy = jest.spyOn(paymentRepository, 'get')

describe('Payment API test', () => {
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
    test('returns 200 when a record exists for reference', async () => {
      paymentRepoSpy.mockResolvedValueOnce({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data: {} } })
      const options = {
        method,
        url
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(paymentRepository.get).toHaveBeenCalledTimes(1)
    })
    test('returns 404 when no record exists for reference', async () => {
      paymentRepoSpy.mockResolvedValueOnce({ dataValues: null })
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
      savePaymentSpy.mockResolvedValueOnce()
      const options = {
        method: 'POST',
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(savePaymentSpy).toHaveBeenCalledTimes(1)
    })
    test('returns 500 for error', async () => {
      savePaymentSpy.mockRejectedValueOnce(new Error('Something went wrong'))
      const options = {
        method,
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(500)
      expect(savePaymentSpy).toHaveBeenCalledTimes(1)
    })
    test('returns 400 for wrong request payload', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { reference: 'ABC-1234', sbi: 234234, whichReview: 'cow' }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(savePaymentSpy).toHaveBeenCalledTimes(0)
    })
  })

  describe('POST Payment approve route', () => {
    const payment = { reference: 'ABC-1234' }
    const url = '/api/payment/approve'
    const method = 'POST'
    test('returns 200 for success', async () => {
      paymentRepoSpy.mockResolvedValueOnce({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data: {} } })

      const options = {
        method: 'POST',
        url,
        payload: payment
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(sendPaymentRequest).toHaveBeenCalledTimes(1)
    })
    test('returns 404 for payment not found', async () => {
      paymentRepoSpy.mockResolvedValueOnce({ dataValues: null })

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
