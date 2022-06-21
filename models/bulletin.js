'use strict';
module.exports = (sequelize, DataTypes) => {
  const Bulletin = sequelize.define('Bulletin', {
    posttitle: DataTypes.STRING,
    poster: DataTypes.STRING,
    postcontent: DataTypes.TEXT,
    isdeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bulletincategory_id: DataTypes.INTEGER,
    bulletinsecondcategory_id: DataTypes.INTEGER,
  }, {
    underscored: true,
  });
  Bulletin.associate = function (models) {
    // associations can be defined here
    Bulletin.hasMany(models.Bulletincategory, { foreignKey: 'bulletincategoryId' })
  };
  return Bulletin;
};