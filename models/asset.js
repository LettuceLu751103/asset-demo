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
    }
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