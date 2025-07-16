import { Status } from '../constants/constants.js'
import dataModels from '../data/index.js'
import { Op } from 'sequelize'
import { subDays } from 'date-fns'

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
      [Op.or]: [
        {
          status: Status.ACK,
          paymentCheckCount: {
            [Op.lt]: 3
          },
          frn: {
            [Op.ne]: null
          }
        },
        {
          status: Status.ACK,
          paymentCheckCount: 3,
          updatedAt: {
            [Op.lt]: subDays(new Date(), 9)
          }
        }
      ]
    }
  })
}

export async function incrementPaymentCheckCount (claimReference) {
  const [[affectedRows]] = await models.payment.increment(
    { paymentCheckCount: 1 },
    {
      where: { applicationReference: claimReference },
      returning: true
    }
  )
  return affectedRows[0]
}

export async function updatePaymentStatusByClaimRef (claimReference, status) {
  return models.payment.update(
    { status },
    {
      where: {
        applicationReference: claimReference
      },
      returning: true
    }
  )
}
