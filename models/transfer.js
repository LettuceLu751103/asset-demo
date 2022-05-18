'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transfer = sequelize.define('Transfer', {
    AssetId: DataTypes.INTEGER,
    GatepassId: DataTypes.INTEGER,
    received: DataTypes.INTEGER
  }, {});
  Transfer.associate = function(models) {
    // associations can be defined here
  };
  return Transfer;
};