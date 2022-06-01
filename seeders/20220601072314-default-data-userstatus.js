'use strict';
const userstatusArray = [
  { id: 2, name: 'superadmin' },
  { id: 1, name: 'admin' },
  { id: 0, name: 'user' },
]
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Userstatuses', userstatusArray.map((item, index) => (
      {
        id: item.id,
        name: item.name,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Userstatuses', null, {})

  }
};

