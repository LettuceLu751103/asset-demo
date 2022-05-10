'use strict';
module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    name: DataTypes.STRING,
    Vendor: DataTypes.STRING,
    Model: DataTypes.STRING,
    Quantity: DataTypes.INTEGER,
    Description: DataTypes.STRING,
    qrcode: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Asset',
  });
  Asset.associate = function (models) {
    // associations can be defined here
    Asset.belongsTo(models.Category, { foreignKey: 'categoryId' })
    Asset.belongsTo(models.Office, { foreignKey: 'officeId' })
  };
  return Asset;
};