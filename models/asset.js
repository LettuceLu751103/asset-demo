'use strict';
module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    name: DataTypes.STRING,
    Vendor: DataTypes.STRING,
    Model: DataTypes.STRING,
    Quantity: DataTypes.INTEGER,
    Description: DataTypes.STRING,
    sn: DataTypes.STRING,
    pn: DataTypes.STRING,
    qrcode: DataTypes.TEXT('long'),
    image: {
      type: DataTypes.STRING,
      defaultValue: "/upload/defaultImage.png",
    },
    status_id: DataTypes.INTEGER,
    office_id: DataTypes.INTEGER,
    createduser: DataTypes.STRING,
  }, {
    underscored: true,
    modelName: 'Asset',
  });
  Asset.associate = function (models) {
    // associations can be defined here
    Asset.belongsTo(models.Secondcategory, { foreignKey: 'secondcategoryId' })
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