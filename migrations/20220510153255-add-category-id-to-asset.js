'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Assets', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    })

  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Assets', 'category_id')

  }
};
