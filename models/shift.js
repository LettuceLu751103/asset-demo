'use strict';
module.exports = (sequelize, DataTypes) => {
  const Shift = sequelize.define('Shift', {
    name: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Shift',
  });
  Shift.associate = function (models) {
    // associations can be defined here
    Shift.hasMany(models.Shiftpost, { foreignKey: 'shiftId' })
  };
  return Shift;
};