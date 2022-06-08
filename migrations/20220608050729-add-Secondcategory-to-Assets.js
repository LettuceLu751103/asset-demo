'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Assets', 'secondcategory_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Secondcategories',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Assets', 'secondcategory_id')

  }
};
