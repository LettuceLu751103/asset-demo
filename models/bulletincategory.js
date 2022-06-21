'use strict';
module.exports = (sequelize, DataTypes) => {
  const Bulletincategory = sequelize.define('Bulletincategory', {
    name: DataTypes.STRING,
    Description: {
      allowNull: true,
      type: DataTypes.STRING
    },

  }, {
    underscored: true,
    modelName: 'Bulletincategory',
  });
  Bulletincategory.associate = function (models) {
    // associations can be defined here
    Bulletincategory.hasMany(models.Bulletinsecondcategory, { foreignKey: 'bulletincategoryId' })
    Bulletincategory.hasMany(models.Bulletin, { foreignKey: 'bulletincategoryId' })
  };
  return Bulletincategory;
};