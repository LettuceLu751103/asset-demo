'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bulletinsecondcategories', 'bulletincategory_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Bulletincategories',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bulletinsecondcategories', 'bulletincategory_id')
  }
};
