import appInsights from 'applicationinsights'

export function setup (logger) {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING && process.env.APPINSIGHTS_CLOUDROLE) {
    appInsights.setup().start()
    logger.info('App Insights Running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    appInsights.defaultClient.context.tags[cloudRoleTag] = process.env.APPINSIGHTS_CLOUDROLE.toString()
  } else {
    logger.info('App Insights Not Running!')
  }
}
