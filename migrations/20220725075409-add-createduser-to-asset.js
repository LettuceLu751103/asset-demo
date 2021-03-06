'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      `Assets`,
      `createduser`,
      {
        type: Sequelize.STRING,
        allowNull: true
      })
  },
  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(`Assets`, `createduser`)
  }
};
