'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bulletins', 'bulletinsecondcategory_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Bulletinsecondcategories',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bulletins', 'bulletinsecondcategory_id')
  }
};
