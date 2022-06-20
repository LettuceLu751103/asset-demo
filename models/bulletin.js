'use strict';
module.exports = (sequelize, DataTypes) => {
  const Bulletin = sequelize.define('Bulletin', {
    posttitle: DataTypes.STRING,
    poster: DataTypes.STRING,
    postcontent: DataTypes.TEXT,
    isdeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    underscored: true,
  });
  Bulletin.associate = function (models) {
    // associations can be defined here
  };
  return Bulletin;
};