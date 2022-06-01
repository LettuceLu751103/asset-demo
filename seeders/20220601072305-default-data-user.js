'use strict';
const userArray = [
  { name: 'superadmin', password: '1qazXSW@', enabled: 1, userstatus_id: 2 },
  { name: 'admin', password: '1qazXSW@', enabled: 1, userstatus_id: 1 },
  { name: 'user1', password: '1qazXSW@', enabled: 0, userstatus_id: 0 },
  { name: 'user2', password: '1qazXSW@', enabled: 1, userstatus_id: 0 },
]
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', userArray.map((item, index) => (
      {
        id: index + 1,
        name: item.name,
        password: item.password,
        enabled: item.enabled,
        userstatus_id: item.userstatus_id,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {})

  }
};
