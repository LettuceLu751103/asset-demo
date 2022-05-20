'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        `Gatepasses`,
        `quantity`,
        {
          type: Sequelize.INTEGER,
          allowNull: false
        }),
      queryInterface.addColumn(
        `Gatepasses`,
        `b_office_id`,
        {
          type: Sequelize.INTEGER,
          allowNull: false
        }),
    ])

  },

  down: (queryInterface, Sequelize) => {

    return Promise.all([
      queryInterface.removeColumn('Gatepasses', 'quantity'),
      queryInterface.removeColumn('Gatepasses', 'b_office_id'),
    ])

  }
};
