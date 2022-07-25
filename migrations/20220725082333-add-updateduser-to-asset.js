'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      `Assets`,
      `updateduser`,
      {
        type: Sequelize.STRING,
        allowNull: true
      })
  },
  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(`Assets`, `updateduser`)
  }
};
