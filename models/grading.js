'use strict';
module.exports = (sequelize, DataTypes) => {
  const Grading = sequelize.define('Grading', {
    name: DataTypes.STRING,
    Description: DataTypes.STRING
  }, {
    underscored: true,
    modelName: 'Grading',
  });
  Grading.associate = function (models) {
    // associations can be defined here
    Grading.hasMany(models.Bulletin, { foreignKey: 'gradingId' })
  };
  return Grading;
};