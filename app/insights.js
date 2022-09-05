const appInsights = require('applicationinsights')

function setup () {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup().start()
    console.log('App Insights Running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    console.log('App Insights Running - cloudrole', cloudRoleTag)
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    console.log('App Insights Running - appName', appName)
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName
  } else {
    console.log('App Insights Not Running!')
  }
}

module.exports = { setup }
