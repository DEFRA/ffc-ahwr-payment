const Joi = require('joi')
const { get, set } = require('../../repositories/payment-repository')
module.exports = [{
  method: 'GET',
  path: '/api/payment/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const payment = (await get(request.params.ref))
      if (payment.dataValues) {
        return h.response(payment.dataValues).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/payment',
  options: {
    validate: {
      payload: Joi.object({
        ref: Joi.string().valid()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const payment = await set(request.payload.reference, request.payload)
      return h.response(payment).code(200)
    }
  }
}]
