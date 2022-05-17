'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Assets', 'image', {
      type: Sequelize.STRING,

    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Assets', 'image');
  }
};
