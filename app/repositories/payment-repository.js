import dataModels from '../data/index.js'
import { Op } from 'sequelize'

export async function get (reference) {
  const { models } = dataModels
  return models.payment.findOne(
    {
      where: { applicationReference: reference }
    })
}

export async function set (reference, data) {
  const { models } = dataModels
  return models.payment.create({ applicationReference: reference, data })
}

export async function updateByReference (reference, status, data) {
  const { models } = dataModels
  return models.payment.update({ status, data },
    { where: { applicationReference: reference } })
}

export async function getAllSuccessfulPayments () {
  const { models } = dataModels
  return models.payment.findAll(
    {
      where: { status: 'success', 'data.frn': { [Op.ne]: null } }
    })
}