import dataModels from '../data/index.js'
import { Op } from 'sequelize'

export async function get (reference) {
  const { models } = dataModels
  return models.payment.findOne(
    {
      where: { applicationReference: reference }
    })
}

export async function set (reference, data, frn) {
  const { models } = dataModels
  return models.payment.create({ applicationReference: reference, data, frn })
}

export async function updatePaymentResponse (reference, status, paymentResponse) {
  const { models } = dataModels
  return models.payment.update(
    { status, paymentResponse, frn: paymentResponse.frn },
    { where: { applicationReference: reference } }
  )
}

export async function getPendingPayments () {
  const { models } = dataModels
  return models.payment.findAll({
    where: {
      status: 'ack',
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
  const { models } = dataModels
  return models.payment.increment(
    { paymentCheckCount: 1 },
    { where: { applicationReference: claimReference } } // applicationReference is actually claimReference
  )
}

export async function updatePaymentStatusByClaimRef (status, claimReference) {
  const { models } = dataModels

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
