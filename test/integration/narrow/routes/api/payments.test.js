import * as paymentRepository from '../../../../../app/repositories/payment-repository'
import { createServer } from '../../../../../app/server'
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const reference = 'ABC-1234'

jest.mock('../../../../../app/repositories/payment-repository')

jest.mock('../../../../../app/messaging/send-payment-request')
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
})
