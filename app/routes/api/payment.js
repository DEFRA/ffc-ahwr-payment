import joi from 'joi'
import { get } from '../../repositories/payment-repository.js'

export const paymentApiRoutes = [{
  method: 'GET',
  path: '/api/payment/{reference}',
  options: {
    validate: {
      params: joi.object({
        reference: joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const payment = (await get(request.params.reference))
      if (payment.dataValues) {
        return h.response(payment.dataValues).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}]
