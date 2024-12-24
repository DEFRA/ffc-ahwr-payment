import { species, speciesAmounts, claimTypes, endemicsPaymentTypes } from '../constants/constants'
export const getPaymentData = (typeOfLivestock, testResults, pricesConfig, isEndemics, claimType, yesOrNoPiHunt) => {
  if (isEndemics) {
    const isFollowUp = claimType === claimTypes.endemics
    const endemicsPaymentType = isFollowUp ? endemicsPaymentTypes.followUp : endemicsPaymentTypes.review
    const standardCode = pricesConfig[endemicsPaymentType][typeOfLivestock].code
    if ((typeOfLivestock === species.beef || typeOfLivestock === species.dairy) && testResults && isFollowUp) {
      const isNegative = testResults === 'negative'

      if (isNegative) {
        return {
          standardCode,
          value: yesOrNoPiHunt
            ? pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults][yesOrNoPiHunt]
            : pricesConfig[endemicsPaymentType][typeOfLivestock].value[testResults].noPiHunt
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
  const standardCode = speciesAmounts[typeOfLivestock]?.code
  const value = speciesAmounts[typeOfLivestock]?.value
  return {
    standardCode,
    value
  }
}
