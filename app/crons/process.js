const checkPaymentStatusOfApplications = async () => {
  try {
    console.log('Running Check Payment Status:Pick Payment, Find FRN, Send message to data request topic & Wait for data response queue')
  } catch (error) {
    console.log(error)
  }
  return false
}

module.exports = checkPaymentStatusOfApplications
