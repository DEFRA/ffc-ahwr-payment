const { beef, dairy } = require('../constants/species')
const speciesData = require('../messaging/species')
const { endemics } = require('../constants/claimTypes')
const { review, followUp } = require('../constants/endemicsPaymentTypes')
const getPaymentData = (typeOfLivestock, testResults, pricesConfig, isEndemics, claimType) => {
  if (isEndemics) {
    const isFollowUp = claimType === endemics
    const endemicsPaymentType = isFollowUp ? followUp : review
    if ((typeOfLivestock === beef || typeOfLivestock === dairy) && testResults && isFollowUp) {
      return {
        standardCode: pricesConfig[endemicsPaymentType][typeOfLivestock].code,
        value: pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults]
      }
    } else {
      return {
        standardCode: pricesConfig[endemicsPaymentType][typeOfLivestock].code,
        value: pricesConfig[endemicsPaymentType][typeOfLivestock].value
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
