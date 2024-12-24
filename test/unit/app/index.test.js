import * as server from '../../../app/server'

describe('Index test', () => {
  const mockMessaging = require('../../../app/messaging')
  const mockStartServerFunction = jest.fn().mockImplementation(() => 'running')
  jest.mock('../../../app/messaging')
  jest.mock('../../../app/insights')
  jest.mock('../../../app/config', () => ({
    storage: {
      storageAccount: 'mockStorageAccount',
      useConnectionString: false,
      endemicsSettingsContainer: 'endemics-settings',
      connectionString: 'connectionString'
    },
    messageQueueConfig: {
      submitPaymentRequestMsgType: jest.fn()
    }
  }))

  const serverCreateSpy = jest.spyOn(server, 'createServer')

  serverCreateSpy.mockResolvedValue({
    logger: {
      info: jest.fn()
    },
    info: {
      uri: 'http://localhost:3000'
    },
    start: mockStartServerFunction
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('is started when env var exists', async () => {
    await require('../../../app/index')
    expect(mockMessaging.start).toHaveBeenCalledTimes(1)
    expect(mockStartServerFunction).toHaveBeenCalledTimes(1)
  })
})
