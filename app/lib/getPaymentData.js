const { beef, dairy } = require('../constants/species')
const speciesData = require('../messaging/species')

const getPaymentData = (typeOfLivestock, testResults, pricesConfig, isEndemics) => {
  if (isEndemics) {
    if ((typeOfLivestock === beef || typeOfLivestock === dairy) && testResults) {
      return {
        standardCode: pricesConfig[typeOfLivestock].code,
        value: pricesConfig[typeOfLivestock].value[testResults]
      }
    } else {
      return {
        standardCode: pricesConfig[typeOfLivestock].code,
        value: pricesConfig[typeOfLivestock].value
      }
    }
  }
  const standardCode = speciesData[typeOfLivestock]?.code
  const value = speciesData[typeOfLivestock]?.value
  return {
    standardCode,
    value
  }
}

module.exports = {
  getPaymentData
}
