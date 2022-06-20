'use strict';
module.exports = (sequelize, DataTypes) => {
  const Grading = sequelize.define('Grading', {
    name: DataTypes.STRING,
    Description: DataTypes.STRING
  }, {
    underscored: true,
  });
  Grading.associate = function(models) {
    // associations can be defined here
  };
  return Grading;
};