describe('Config Validation', () => {
  const originalProcessEnv = process.env

  beforeEach(() => {
    process.env = {}
    jest.resetModules()
  })

  afterAll(() => {
    process.env = originalProcessEnv
  })

  test('should throw an error if the config object is invalid', () => {
    // Mock environment variables
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'connection-string'
    process.env.AZURE_STORAGE_ACCOUNT_NAME = '' // Invalid: required field is missing

    // Validate config
    expect(() => {
      jest.requireActual('../../../../app/config/storage.js')
    }).toThrow('The blob storage config is invalid.')
  })

  test('should validate the config object successfully', () => {
    // Mock environment variables
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'connection-string'
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'storage-account'
    process.env.AZURE_STORAGE_USE_CONNECTION_STRING = 'true'
    process.env.AZURE_STORAGE_CREATE_CONTAINERS = 'false'
    process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER = 'endemics-settings'

    const storageConfig = jest.requireActual('../../../../app/config/storage.js')

    expect(storageConfig).toEqual({
      config: {
        connectionString: 'connection-string',
        endemicsSettingsContainer: 'endemics-settings',
        endemicsPricesFile: 'endemics-prices-config.json',
        storageAccount: 'storage-account',
        useConnectionString: true
      }
    })
  })
})
