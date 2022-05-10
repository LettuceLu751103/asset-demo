'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Assets', 'office_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Offices',
        key: 'id'
      }
    })

  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Assets', 'office_id')

  }
};
