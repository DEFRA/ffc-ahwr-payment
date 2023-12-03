const cron = require('node-cron')
const config = require('../../config')
const processOnHoldApplications = require('./process')

module.exports = {
  plugin: {
    name: 'CheckPaymentStatusScheduler',
    register: async () => {
      console.log(`${new Date().toISOString()} checking payment Status of applications:Running scheduler... ${JSON.stringify(
        config.CheckPaymentStatusScheduler
      )}`)
      cron.schedule(config.onHoldAppScheduler.schedule, async () => {
        console.log(`${new Date().toISOString()} checking payment Status of applications:Schedule is starting`)
        try {
          await processOnHoldApplications()
          console.log(`${new Date().toISOString()} checking payment Status of applications:Schedule finished`)
        } catch (error) {
          console.error(`${new Date().toISOString()} checking payment Status of applications: Error while processing schedule task`, error)
        }
      }, {
        scheduled: config.CheckPaymentStatusScheduler.enabled
      })
    }
  }
}
