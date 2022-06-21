'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bulletins', 'bulletincategory_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Bulletincategories',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bulletins', 'bulletincategory_id')
  }
};
