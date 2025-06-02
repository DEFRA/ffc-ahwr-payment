import joi from 'joi'

const schema = joi.object({
  connectionString: joi.string().required(),
  endemicsSettingsContainer: joi.string().required(),
  endemicsPricesFile: joi.string().required(),
  storageAccount: joi.string().required(),
  useConnectionString: joi.bool().default(false),
  paymentDataStorageConnectionString: joi.string().optional(),
  paymentDataStorageContainer: joi.string().default('data-requests'),
})

const storageConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING === 'true',
  endemicsSettingsContainer: process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER ?? 'endemics-settings',
  endemicsPricesFile: 'endemics-prices-config.json', // no current provision to override this
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  paymentDataStorageConnectionString: process.env.PAYMENT_AZURE_STORAGE_CONNECTION_STRING,
  paymentDataStorageContainer: process.env.PAYMENT_AZURE_STORAGE_DATA_CONTAINER ?? 'data-requests',
}

const { error } = schema.validate(storageConfig, {
  abortEarly: false
})

if (error) {
  throw new Error(`The blob storage config is invalid. ${error.message}`)
}

export const config = storageConfig
