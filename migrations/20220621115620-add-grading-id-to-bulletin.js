'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bulletins', 'grading_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Gradings',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bulletins', 'grading_id')
  }
};
