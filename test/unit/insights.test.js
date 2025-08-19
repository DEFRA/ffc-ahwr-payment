import { setup } from '../../app/insights'

const mockStart = jest.fn()
const tags = {}
const cloudRoleTag = 'cloudRoleTag'
jest.mock('applicationinsights', () => {
  return {
    setup: jest.fn(() => {
      return {
        start: mockStart
      }
    }),
    defaultClient: {
      context: {
        keys: {
          cloudRole: cloudRoleTag
        },
        tags
      }
    }
  }
})

describe('Application Insights', () => {
  beforeEach(() => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    jest.clearAllMocks()
  })

  test('is started when env var exists', () => {
    const appName = 'test-app'
    process.env.APPINSIGHTS_CLOUDROLE = appName
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    const result = setup()

    expect(result).toBeTruthy()
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(tags[cloudRoleTag]).toEqual(appName)
  })

  test('logs out not running message when env var does not exist', () => {
    const result = setup()

    expect(result).toBeFalsy()
  })
})
