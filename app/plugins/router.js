const routes = [].concat(
  require('../routes/api/payment'),
  require('../routes/healthy'),
  require('../routes/healthz'),
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
