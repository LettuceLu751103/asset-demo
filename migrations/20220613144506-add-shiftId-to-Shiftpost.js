'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Shiftposts', 'shift_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Shiftposts', 'shift_id');
  }
};
