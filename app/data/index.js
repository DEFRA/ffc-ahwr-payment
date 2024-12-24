import { Sequelize, DataTypes } from 'sequelize'
import { config } from '../config/db.js'
import paymentFn from './models/payment.js'

const dbConfig = config[process.env.NODE_ENV]

export default (() => {
  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

  // If any new models are added then they will need to be added here
  const payment = paymentFn(sequelize, DataTypes)

  if (payment.associate) {
    payment.associate(sequelize.models)
  }

  return {
    models: sequelize.models,
    sequelize
  }
})()
