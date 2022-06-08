'use strict';
module.exports = (sequelize, DataTypes) => {
  const Secondcategory = sequelize.define('Secondcategory', {
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    Description: {
      allowNull: true,
      type: DataTypes.STRING
    }
  }, {
    underscored: true,
    modelName: 'Secondcategory',
  });
  Secondcategory.associate = function (models) {
    // associations can be defined here
    Secondcategory.hasMany(models.Asset, { foreignKey: 'secondcategoryId' })
  };
  return Secondcategory;
};