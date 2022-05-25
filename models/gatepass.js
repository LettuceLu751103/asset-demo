'use strict';
module.exports = (sequelize, DataTypes) => {
  const Gatepass = sequelize.define('Gatepass', {
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status:
    {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    OfficeId:
    {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    b_office_id:
    {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity:
    {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    countquantity:
    {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    qrcode:
    {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    underscored: true,
    modelName: 'Gatepass',
  });
  Gatepass.associate = function (models) {
    // associations can be defined here
    Gatepass.belongsTo(models.Office, {
      as: 'bofficeId',
      foreignKey: 'b_office_id',
    })
    Gatepass.belongsTo(models.Office, {
      // as: 'aofficeId',
      foreignKey: 'office_id',
    })
    // Gatepass.belongsTo(models.Office, {
    //   as: 'bofficeId',
    //   foreignKey: 'b_office_id',
    // })

    Gatepass.belongsToMany(models.Asset, {
      through: models.Transfer,
      foreignKey: 'GatepassId',
      as: 'TransferAsset'
    })
  };
  return Gatepass;
};