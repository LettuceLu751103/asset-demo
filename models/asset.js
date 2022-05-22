'use strict';
module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    name: DataTypes.STRING,
    Vendor: DataTypes.STRING,
    Model: DataTypes.STRING,
    Quantity: DataTypes.INTEGER,
    Description: DataTypes.STRING,
    qrcode: DataTypes.TEXT('long'),
    image: {
      type: DataTypes.STRING,
      defaultValue: "https://ewr9gftwh9h.exactdn.com/wp-content/uploads/2018/01/Question-Mark.png?strip=all&lossy=1&resize=195%2C195",
    },
    status_id: DataTypes.INTEGER,
    office_id: DataTypes.INTEGER,
  }, {
    underscored: true,
    modelName: 'Asset',
  });
  Asset.associate = function (models) {
    // associations can be defined here
    Asset.belongsTo(models.Category, { foreignKey: 'categoryId' })
    Asset.belongsTo(models.Office, { foreignKey: 'officeId' })
    Asset.belongsTo(models.Status, { foreignKey: 'statusId' })
    Asset.belongsToMany(models.Gatepass, {
      through: models.Transfer,
      foreignKey: 'AssetId',
      as: 'TransferGatepass'
    })
  };
  return Asset;
};