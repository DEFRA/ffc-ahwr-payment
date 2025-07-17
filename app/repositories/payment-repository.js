import { DAILY_RETRY_FROM_DAYS, DAILY_RETRY_LIMIT, FINAL_RETRY_DAYS, Status } from '../constants/constants.js'
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
            [Op.lt]: DAILY_RETRY_LIMIT
          },
          frn: {
            [Op.ne]: null
          },
          createdAt: {
            [Op.lte]: subDays(new Date(), DAILY_RETRY_FROM_DAYS)
          }
        },
        {
          status: Status.ACK,
          paymentCheckCount: DAILY_RETRY_LIMIT,
          updatedAt: {
            [Op.lte]: subDays(new Date(), FINAL_RETRY_DAYS)
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
