'use strict';
module.exports = (sequelize, DataTypes) => {
  const Bulletinsecondcategory = sequelize.define('Bulletinsecondcategory', {
    name: DataTypes.STRING,
    Description: DataTypes.STRING,
    bulletincategory_id: DataTypes.INTEGER
  }, {
    underscored: true,
    modelName: 'Bulletinsecondcategory',
  });
  Bulletinsecondcategory.associate = function (models) {
    // associations can be defined here
    Bulletinsecondcategory.belongsTo(models.Bulletincategory, { foreignKey: 'bulletincategoryId' })
    Bulletinsecondcategory.hasMany(models.Bulletin, { foreignKey: 'bulletinsecondcategoryId' })
  };
  return Bulletinsecondcategory;
};