'use strict';
module.exports = (sequelize, DataTypes) => {
  const Office = sequelize.define('Office', {
    name: DataTypes.STRING,
    Description: DataTypes.STRING
  }, {
    underscored: true,
  });
  Office.associate = function(models) {
    // associations can be defined here
  };
  return Office;
};