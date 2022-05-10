'use strict';

const officeName = [
  { name: 'ECO3F', Description: '位於 makati ECO building Office' },
  { name: 'SC', Description: '位於 SC island building Office' },
  { name: 'V', Description: '位於 makati V building Office' },
  { name: 'CL1405', Description: '位於 makati CL building Office' },
  { name: 'CL1504', Description: '位於 makati CL building Office' },
  { name: 'AVE', Description: '位於 makati AVE building Office' },
  { name: 'PB9F', Description: '位於 makati PBCOM building Office' },
  { name: 'PB21F', Description: '位於 makati PBCOM building Office' },
  { name: 'JD', Description: '位於 makati JD building Office' },
  { name: 'EB407', Description: '位於 makati EB building Office' },
  { name: 'PT22F', Description: '位於 makati PT building Office' },
  { name: 'ECO8F', Description: '位於 makati ECO building Office' },
  { name: 'SecretOffice', Description: '位於 xxxx building Office' },
]
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Offices', officeName.map((item, index) => (
      {
        id: index + 1,
        name: item.name,
        Description: item.Description,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Offices', null, {})
  }
};
