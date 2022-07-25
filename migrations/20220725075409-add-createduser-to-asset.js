'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      `Assets`,
      `createduser`,
      {
        type: Sequelize.STRING,
        allowNull: false
      })
  },
  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(`Assets`, `createduser`)
  }
};
