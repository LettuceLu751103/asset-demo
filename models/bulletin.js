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
    grading_id: DataTypes.INTEGER,
  }, {
    underscored: true,
    modelName: 'Bulletin',
  });
  Bulletin.associate = function (models) {
    // associations can be defined here
    Bulletin.belongsTo(models.Bulletincategory, { foreignKey: 'bulletincategoryId' })
    Bulletin.belongsTo(models.Bulletinsecondcategory, { foreignKey: 'bulletinsecondcategoryId' })
    Bulletin.belongsTo(models.Grading, { foreignKey: 'gradingId' })
  };
  return Bulletin;
};