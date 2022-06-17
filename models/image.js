'use strict';
module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define('Image', {
    filename: DataTypes.STRING,
    filepath: DataTypes.STRING,
    filesize: DataTypes.INTEGER,
    fileencoding: DataTypes.STRING,
    filemimetype: DataTypes.STRING
  }, {
    underscored: true,
  });
  Image.associate = function(models) {
    // associations can be defined here
  };
  return Image;
};