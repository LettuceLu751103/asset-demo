'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Assets', 'status_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Statuses',
        key: 'id'
      }
    })

  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Assets', 'status_id')

  }
};
