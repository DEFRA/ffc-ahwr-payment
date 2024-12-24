import { get, set, updateByReference } from '../../../../app/repositories/payment-repository'
import data from '../../../../app/data'

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
    await set(reference, { agreementNumber: reference })
    expect(data.models.payment.create).toHaveBeenCalledTimes(1)
    expect(data.models.payment.create).toHaveBeenCalledWith({ applicationReference: reference, data: { agreementNumber: reference } })
  })

  test('Update record for data by reference', async () => {
    await updateByReference(reference, 'completed')

    expect(data.models.payment.update).toHaveBeenCalledTimes(1)
    expect(data.models.payment.update).toHaveBeenCalledWith({ status: 'completed' }, { where: { applicationReference: reference } })
  })

  test('get returns single data by reference', async () => {
    await get(reference)

    expect(data.models.payment.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.payment.findOne).toHaveBeenCalledWith({
      where: { applicationReference: reference }
    })
  })
})
