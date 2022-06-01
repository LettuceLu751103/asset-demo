'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    enabled: DataTypes.INTEGER,
    userstatus_id: DataTypes.INTEGER
  }, {
    underscored: true,
    modelName: 'User',
  });
  User.associate = function (models) {
    // associations can be defined here
    console.log(models.Userstatus)
    User.belongsTo(models.Userstatus, { foreignKey: 'userstatusId' })
  };
  return User;
};