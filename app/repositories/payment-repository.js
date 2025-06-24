import dataModels from '../data/index.js'

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
    { status, paymentResponse },
    { where: { applicationReference: reference } }
  )
}
