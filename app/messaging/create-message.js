const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ffc-ahwr-payment',
    ...options
  }
}

module.exports = createMessage
