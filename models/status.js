'use strict';
module.exports = (sequelize, DataTypes) => {
  const Status = sequelize.define('Status', {
    name: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Status',
  });
  Status.associate = function (models) {
    // associations can be defined here
    Status.hasMany(models.Asset, { foreignKey: 'statusId' })
  };
  return Status;
};