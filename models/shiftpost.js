'use strict';
module.exports = (sequelize, DataTypes) => {
  const Shiftpost = sequelize.define('Shiftpost', {
    posttitle: DataTypes.STRING,
    poster: DataTypes.STRING,
    postcontent: DataTypes.TEXT('long'),
    shift_id: DataTypes.INTEGER,
    isdeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
  }, {
    underscored: true,
    modelName: 'Shiftpost',
  });
  Shiftpost.associate = function (models) {
    // associations can be defined here
    Shiftpost.belongsTo(models.Shift, { foreignKey: 'shiftId' })
  };
  return Shiftpost;
};