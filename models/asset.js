'use strict';
module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    name: DataTypes.STRING,
    Vendor: DataTypes.STRING,
    Model: DataTypes.STRING,
    Quantity: DataTypes.INTEGER,
    Description: DataTypes.STRING
  }, {
    underscored: true,
  });
  Asset.associate = function(models) {
    // associations can be defined here
  };
  return Asset;
};