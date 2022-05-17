'use strict';
const statusName = [
  { name: '閒置中' },
  { name: '使用中' },
  { name: '移轉中' },
  { name: '待報廢' }
]


module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('Statuses', statusName.map((item, index) => (
      {
        id: index + 1,
        name: item.name,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})

  },

  down: (queryInterface, Sequelize) => {

    return queryInterface.bulkDelete('Statuses', null, {})

  }
};
