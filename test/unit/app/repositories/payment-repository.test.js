import { get, getPendingPayments, incrementPaymentCheckCount, set, updatePaymentResponse, updatePaymentStatusByClaimRef } from '../../../../app/repositories/payment-repository'
import data from '../../../../app/data'
import { Op } from 'sequelize'

jest.mock('../../../../app/data', () => {
  return {
    models: {
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn()
      }
    }
  }
})

beforeEach(() => {
  jest.clearAllMocks()
})

const reference = 'AHWR-1234-567'

describe('Payment Repository test', () => {
  test('Set creates record for data', async () => {
    await set(reference, { agreementNumber: reference }, '111343946890')

    expect(data.models.payment.create).toHaveBeenCalledTimes(1)
    expect(data.models.payment.create).toHaveBeenCalledWith({ applicationReference: reference, data: { agreementNumber: reference }, frn: '111343946890' })
  })

  test('Update record for data by reference', async () => {
    const paymentResponse = {
      agreementNumber: reference,
      value: 43600,
      invoiceLines: [{
        value: 43600
      }]
    }

    await updatePaymentResponse(reference, 'completed', paymentResponse)

    expect(data.models.payment.update).toHaveBeenCalledTimes(1)
    expect(data.models.payment.update).toHaveBeenCalledWith({ status: 'completed', paymentResponse }, { where: { applicationReference: reference } })
  })

  test('get returns single data by reference', async () => {
    await get(reference)

    expect(data.models.payment.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.payment.findOne).toHaveBeenCalledWith({
      where: { applicationReference: reference }
    })
  })

  test('getPendingPayments calls findAll with correct params', async () => {
    const mockFindAll = jest.fn().mockResolvedValue(['payment1', 'payment2'])
    data.models.payment.findAll = mockFindAll

    const result = await getPendingPayments()

    expect(mockFindAll).toHaveBeenCalledWith({
      where: {
        status: 'success',
        paymentCheckCount: { [Op.lt]: 3 },
        frn: { [Op.ne]: null }
      }
    })
    expect(result).toEqual(['payment1', 'payment2'])
  })

  test('incrementPaymentCheckCount calls increment with correct params', async () => {
    const mockIncrement = jest.fn().mockResolvedValue([1])
    data.models.payment.increment = mockIncrement

    const result = await incrementPaymentCheckCount('RESH-F99F-E09F')

    expect(mockIncrement).toHaveBeenCalledWith(
      { paymentCheckCount: 1 },
      { where: { applicationReference: 'RESH-F99F-E09F' } }
    )
    expect(result).toEqual([1])
  })

  test('updatePaymentStatusByClaimRef calls update with correct params', async () => {
    const mockUpdate = jest.fn().mockResolvedValue([1, [{ status: 'failed' }]])
    data.models.payment.update = mockUpdate

    const result = await updatePaymentStatusByClaimRef('failed', 'RESH-F99F-E09F')

    expect(mockUpdate).toHaveBeenCalledWith(
      { status: 'failed' },
      {
        where: { applicationReference: 'RESH-F99F-E09F' },
        returning: true
      }
    )
    expect(result).toEqual([1, [{ status: 'failed' }]])
  })
})
