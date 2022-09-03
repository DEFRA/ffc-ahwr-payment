const Joi = require('joi')
const { get } = require('../../repositories/payment-repository')
const { savePaymentRequest } = require('../../messaging/save-payment-request')
const species = require('../../constants/species')

module.exports = [{
  method: 'GET',
  path: '/api/payment/{reference}',
  options: {
    validate: {
      params: Joi.object({
        reference: Joi.string().valid()
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
        reference: Joi.string().required(),
        sbi: Joi.string().required(),
        whichReview: Joi.string().valid(species.beef, species.dairy, species.pigs, species.sheep)
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await savePaymentRequest(request.payload)
      return h.response().code(200)
    }
  }
}]
