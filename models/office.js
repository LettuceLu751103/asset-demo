'use strict';
module.exports = (sequelize, DataTypes) => {
  const Office = sequelize.define('Office', {
    name: DataTypes.STRING,
    Description: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Office',
  });
  Office.associate = function (models) {
    // associations can be defined here
    Office.hasMany(models.Asset, { foreignKey: 'officeId' })
    Office.hasMany(models.Gatepass)


  };
  return Office;
};