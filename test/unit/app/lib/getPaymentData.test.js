const { getPaymentData } = require('../../../../app/lib/getPaymentData')
const pricesConfig = require('../../../data/claim-prices-config.json')

describe('getPaymentData', () => {
  test('returns correct payment data for beef with positive test result', () => {
    const typeOfLivestock = 'beef'
    const testResults = 'positive'
    const isEndemics = true

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Beef',
      value: 837
    })
  })

  test('returns correct payment data for dairy with negative test result', () => {
    const typeOfLivestock = 'dairy'
    const testResults = 'negative'
    const isEndemics = true

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Dairy',
      value: 215
    })
  })

  test('returns correct payment data for pigs without test result', () => {
    const typeOfLivestock = 'pigs'
    const testResults = null
    const isEndemics = true

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Pigs',
      value: 923
    })
  })

  test('returns correct payment data for sheep without test result', () => {
    const typeOfLivestock = 'sheep'
    const testResults = null
    const isEndemics = true

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Sheep',
      value: 639
    })
  })

  test('returns correct payment data for beef without endemics', () => {
    const typeOfLivestock = 'beef'
    const testResults = null
    const isEndemics = false

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Beef',
      value: 522
    })
  })

  test('returns correct payment data for dairy without endemics', () => {
    const typeOfLivestock = 'dairy'
    const testResults = null
    const isEndemics = false

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Dairy',
      value: 372
    })
  })

  test('returns correct payment data for pigs without endemics', () => {
    const typeOfLivestock = 'pigs'
    const testResults = null
    const isEndemics = false

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Pigs',
      value: 684
    })
  })

  test('returns correct payment data for sheep without endemics', () => {
    const typeOfLivestock = 'sheep'
    const testResults = null
    const isEndemics = false

    const paymentData = getPaymentData(typeOfLivestock, testResults, pricesConfig, isEndemics)

    expect(paymentData).toEqual({
      standardCode: 'AHWR-Sheep',
      value: 436
    })
  })
})
