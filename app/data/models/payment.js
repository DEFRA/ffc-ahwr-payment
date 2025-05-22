export default (sequelize, DataTypes) => {
  const payment = sequelize.define('payment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    applicationReference: DataTypes.STRING,
    data: DataTypes.JSONB,
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'on-hold' }
  }, {
    freezeTableName: true,
    tableName: 'payment'
  })

  return payment
}
