'use strict';

const AssetName = [
  { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "主機", Vendor: "Generic", Model: "Generic", Quantity: 95, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ249", Quantity: 29, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ247", Quantity: 70, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ239", Quantity: 19, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VC239", Quantity: 2, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Philips", Model: "Philips", Quantity: 43, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "Benq", Model: "Benq", Quantity: 6, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "AOC", Model: "AOC", Quantity: 6, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "螢幕", Vendor: "LG", Model: "LG 24MK600", Quantity: 11, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "鍵盤", Vendor: "Logitech", Model: "K120", Quantity: 94, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "滑鼠", Vendor: "Logitech", Model: "Logitech", Quantity: 95, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "印表機 Printer HP 315", Vendor: "HP", Model: "HP 315", Quantity: 3, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "UPS APC-1400", Vendor: "UPS", Model: "APC", Quantity: 92, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "CCTV攝像頭 180度", Vendor: "Hkvision", Model: "180 angle", Quantity: 5, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/utility/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 4, name: "CCTV攝像頭 360度", Vendor: "Hkvision", Model: "360 angle", Quantity: 55, status_id: 1 }
]
const fakeData = [
  { office_id: 13, category_id: 4, name: "主機", Vendor: "Generic", Model: "Generic", Quantity: 95 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ249", Quantity: 29 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ247", Quantity: 70 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VZ239", Quantity: 19 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VC239", Quantity: 2 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Philips", Model: "Philips", Quantity: 43 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "Benq", Model: "Benq", Quantity: 6 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "AOC", Model: "AOC", Quantity: 6 }
  , { office_id: 13, category_id: 4, name: "螢幕", Vendor: "LG", Model: "LG 24MK600", Quantity: 11 }
  , { office_id: 13, category_id: 4, name: "鍵盤", Vendor: "Logitech", Model: "K120", Quantity: 94 }
  , { office_id: 13, category_id: 4, name: "滑鼠", Vendor: "Logitech", Model: "Logitech", Quantity: 95 }
  , { office_id: 13, category_id: 4, name: "印表機 Printer HP 315", Vendor: "HP", Model: "HP 315", Quantity: 3 }
  , { office_id: 13, category_id: 4, name: "UPS APC-1400", Vendor: "UPS", Model: "APC", Quantity: 92 }
  , { office_id: 13, category_id: 4, name: "CCTV攝像頭 180度", Vendor: "Hkvision", Model: "180 angle", Quantity: 5 }
  , { office_id: 13, category_id: 4, name: "CCTV攝像頭 360度", Vendor: "Hkvision", Model: "360 angle", Quantity: 55 }
]
module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('Assets', AssetName.map((item, index) => (
      {
        id: index + 1,
        office_id: item.office_id,
        category_id: item.category_id,
        status_id: item.status_id,
        name: item.name,
        Vendor: item.Vendor,
        Model: item.Model,
        Quantity: item.Quantity,
        image: item.image,
        created_at: new Date(),
        updated_at: new Date()
      }
    )), {})

  },

  down: (queryInterface, Sequelize) => {

    return queryInterface.bulkDelete('Assets', null, {})

  }
};
