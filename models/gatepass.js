'use strict';
module.exports = (sequelize, DataTypes) => {
  const Gatepass = sequelize.define('Gatepass', {
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status:
    {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    OfficeId:
    {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    underscored: true,
    modelName: 'Gatepass',
  });
  Gatepass.associate = function (models) {
    // associations can be defined here
    Gatepass.belongsTo(models.Office)
    Gatepass.belongsToMany(models.Asset, {
      through: models.Transfer,
      foreignKey: 'GatepassId',
      as: 'TransferAsset'
    })
  };
  return Gatepass;
};