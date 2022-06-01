'use strict';
module.exports = (sequelize, DataTypes) => {
  const Userstatus = sequelize.define('Userstatus', {
    name: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Userstatus',
  });
  Userstatus.associate = function (models) {
    // associations can be defined here
    Userstatus.hasMany(models.User, { foreignKey: 'userstatusId' })
  };
  return Userstatus;
};