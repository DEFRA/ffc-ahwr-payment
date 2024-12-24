import { models } from '../data'

export async function get (reference) {
  return models.payment.findOne(
    {
      where: { applicationReference: reference }
    })
}

export async function set (reference, data) {
  return models.payment.create({ applicationReference: reference, data })
}

export async function updateByReference (reference, status, data) {
  return models.payment.update({ status, data },
    { where: { applicationReference: reference } })
}
