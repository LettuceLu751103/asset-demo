'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('Gatepasses', 'office_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Offices',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('Gatepasses', 'office_id')
  }
};
