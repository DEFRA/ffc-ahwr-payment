const { beef, dairy } = require('../constants/species')
const speciesData = require('../messaging/species')
const { endemics } = require('../constants/claimTypes')
const { review, followUp } = require('../constants/endemicsPaymentTypes')
const getPaymentData = (typeOfLivestock, testResults, pricesConfig, isEndemics, claimType, yesOrNoPiHunt) => {
  if (isEndemics) {
    const isFollowUp = claimType === endemics
    const endemicsPaymentType = isFollowUp ? followUp : review
    const standardCode = pricesConfig[endemicsPaymentType][typeOfLivestock].code
    if ((typeOfLivestock === beef || typeOfLivestock === dairy) && testResults && isFollowUp) {
      const isNegative = testResults === 'negative'

      if (isNegative) {
        return {
          standardCode,
          value: yesOrNoPiHunt
            ? pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults][yesOrNoPiHunt]
            : pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults]['noPiHunt']
        }
      }

      return {
        standardCode,
        value: pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults]
      }

    } else {
      return {
        standardCode,
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
