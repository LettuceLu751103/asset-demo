'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Shiftposts', 'isdeleted', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Shiftposts', 'isdeleted');
  }
};
