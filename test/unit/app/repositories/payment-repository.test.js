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
      }],
      frn: 1102354669
    }

    await updatePaymentResponse(reference, 'completed', paymentResponse)

    expect(data.models.payment.update).toHaveBeenCalledTimes(1)
    expect(data.models.payment.update).toHaveBeenCalledWith({ status: 'completed', paymentResponse, frn: 1102354669 }, { where: { applicationReference: reference } })
  })

  test('get returns single data by reference', async () => {
    await get(reference)

    expect(data.models.payment.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.payment.findOne).toHaveBeenCalledWith({
      where: { applicationReference: reference }
    })
  })

  test('getPendingPayments calls findAll with correct params', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-04-15T00:00:00Z'))

    const mockFindAll = jest.fn().mockResolvedValue(['payment1', 'payment2'])
    data.models.payment.findAll = mockFindAll

    const result = await getPendingPayments()

    expect(mockFindAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            status: 'ack',
            paymentCheckCount: { [Op.lt]: 3 },
            frn: { [Op.ne]: null },
            createdAt: { [Op.lte]: new Date('2025-04-14T00:00:00Z') }
          },
          {
            status: 'ack',
            paymentCheckCount: 3,
            updatedAt: {
              [Op.lte]: new Date('2025-04-05T00:00:00Z')
            }
          }
        ]
      }
    })
    expect(result).toEqual(['payment1', 'payment2'])
  })

  test('incrementPaymentCheckCount calls increment with correct params', async () => {
    const payment = {
      id: '32742adb-f37d-4bc8-8927-7f7d7cfc685e',
      applicationReference: 'RESH-F99F-E09F',
      data: { sbi: '234234', value: 436, invoiceLines: [{ value: 436, description: 'G00 - Gross value of claim', standardCode: 'AHWR-Sheep' }], sourceSystem: 'AHWR', marketingYear: 2025, agreementNumber: 'ABC-1234', paymentRequestNumber: 1 },
      createdAt: '2025-06-25T08:24:56.309Z',
      updatedAt: '2025-07-11T15:49:20.297Z',
      status: 'ack',
      paymentResponse: [{}],
      paymentCheckCount: '4',
      frn: '12345'
    }
    const mockIncrement = jest.fn().mockResolvedValue([[[payment]]])
    data.models.payment.increment = mockIncrement

    const result = await incrementPaymentCheckCount('RESH-F99F-E09F')

    expect(mockIncrement).toHaveBeenCalledWith(
      { paymentCheckCount: 1 },
      { where: { applicationReference: 'RESH-F99F-E09F' }, returning: true }
    )
    expect(result).toEqual(payment)
  })

  test('updatePaymentStatusByClaimRef calls update with correct params', async () => {
    const mockUpdate = jest.fn().mockResolvedValue([1, [{ status: 'failed' }]])
    data.models.payment.update = mockUpdate

    const result = await updatePaymentStatusByClaimRef('RESH-F99F-E09F', 'failed')

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
