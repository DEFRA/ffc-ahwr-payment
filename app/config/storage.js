const Joi = require('joi')

const schema = Joi.object({
  connectionString: Joi.string().required(),
  endemicsSettingsContainer: Joi.string().default('endemics-settings'),
  endemicsPricesFile: Joi.string().default('endemics-prices-config.json'),
  storageAccount: Joi.string().required(),
  useConnectionString: Joi.bool().default(false)
})

const config = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  endemicsSettingsContainer: process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
