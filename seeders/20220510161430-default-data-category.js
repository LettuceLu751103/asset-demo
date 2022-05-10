'use strict';
const categoryName = [
  { name: '機房設備' },
  { name: '辦公室設備' },
  { name: '備品設備' },
  { name: '其他' }
]
module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('Categories', categoryName.map((item, index) => (
      {
        id: index + 1,
        name: item.name,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})

  },

  down: (queryInterface, Sequelize) => {

    return queryInterface.bulkDelete('Categories', null, {})

  }
};
