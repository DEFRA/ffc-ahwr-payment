const processApplicationPaymentRequest = async (message, receiver) => {
  try {
    const messageBody = message.body
    console.log('received process claim request', messageBody)
  } catch (err) {
    await receiver.deadLetterMessage(message)
    console.error('Unable to process claim request:', err)
  }
}

module.exports = processApplicationPaymentRequest
