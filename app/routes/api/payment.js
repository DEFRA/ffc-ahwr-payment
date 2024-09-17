const Joi = require('joi')
const { v4: uuidv4 } = require('uuid')
const { get } = require('../../repositories/payment-repository')
const { savePaymentRequest } = require('../../messaging/save-payment-request')
const species = require('../../constants/species')
const sendPaymentRequest = require('../../messaging/send-payment-request')

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
      const payment = (await get(request.params.reference))
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
        isEndemics: Joi.boolean().default(false),
        reviewTestResults: Joi.string().allow(null).optional(),
        whichReview: Joi.string().valid(species.beef, species.dairy, species.pigs, species.sheep),
        frn: Joi.string().allow(null).optional(),
        claimType: Joi.string().default(''),
        optionalPiHuntValue: Joi.string().allow(null).optional()
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
}, {
  method: 'POST',
  path: '/api/payment/approve',
  options: {
    validate: {
      payload: Joi.object({
        reference: Joi.string().required()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const payment = (await get(request.payload.reference))
      if (!payment.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }
      await sendPaymentRequest(payment.dataValues.data, uuidv4())
      return h.response().code(200)
    }
  }
}]
