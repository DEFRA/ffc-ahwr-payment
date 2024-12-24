import joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { get } from '../../repositories/payment-repository'
import { savePaymentRequest } from '../../messaging/save-payment-request'
import { species } from '../../constants/constants'
import { sendPaymentRequest } from '../../messaging/send-payment-request'

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
}, {
  method: 'POST',
  path: '/api/payment',
  options: {
    validate: {
      payload: joi.object({
        reference: joi.string().required(),
        sbi: joi.string().required(),
        isEndemics: joi.boolean().default(false),
        reviewTestResults: joi.string().allow(null).optional(),
        whichReview: joi.string().valid(species.beef, species.dairy, species.pigs, species.sheep),
        frn: joi.string().allow(null).optional(),
        claimType: joi.string().default(''),
        optionalPiHuntValue: joi.string().allow(null).optional()
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
      payload: joi.object({
        reference: joi.string().required()
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
