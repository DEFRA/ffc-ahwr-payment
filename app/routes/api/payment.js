import joi from 'joi'
import { get } from '../../repositories/payment-repository.js'
import { StatusCodes } from 'http-status-codes'

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
        return h.response(payment.dataValues).code(StatusCodes.OK)
      } else {
        return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
      }
    }
  }
}]
