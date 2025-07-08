import { Status } from '../constants/constants.js'
import dataModels from '../data/index.js'
import { Op } from 'sequelize'

const { models } = dataModels

export async function get (reference) {
  return models.payment.findOne(
    {
      where: { applicationReference: reference }
    })
}

export async function set (reference, data, frn) {
  return models.payment.create({ applicationReference: reference, data, frn })
}

export async function updatePaymentResponse (reference, status, paymentResponse) {
  return models.payment.update(
    { status, paymentResponse, frn: paymentResponse.frn },
    { where: { applicationReference: reference } }
  )
}

export async function getPendingPayments () {
  return models.payment.findAll({
    where: {
      status: Status.ACK,
      paymentCheckCount: {
        [Op.lt]: 3
      },
      frn: {
        [Op.ne]: null
      }
    }
  })
}

export async function incrementPaymentCheckCount (claimReference) {
  return models.payment.increment(
    { paymentCheckCount: 1 },
    { where: { applicationReference: claimReference } } // applicationReference is actually claimReference
  )
}

export async function updatePaymentStatusByClaimRef (claimReference, status) {
  return models.payment.update(
    { status },
    {
      where: {
        applicationReference: claimReference // applicationReference is actually claimReferences
      },
      returning: true
    }
  )
}
