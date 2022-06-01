'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Users', 'userstatus_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      references: {
        model: 'Userstatuses',
        key: 'id'
      }
    })

  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('users', 'userstatus_id')

  }
};
