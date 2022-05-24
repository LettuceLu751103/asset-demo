'use strict';

const AssetName = [
  { image: 'https://loremflickr.com/320/240/cisco/?random=${Math.random()%20*%20100}', office_id: 1, category_id: 4, name: "主機", Vendor: "Generic", Model: "Generic", Quantity: 1, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/router/?random=${Math.random()%20*%20100}', office_id: 3, category_id: 1, name: "螢幕", Vendor: "Asus", Model: "VZ249", Quantity: 1, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/server/?random=${Math.random()%20*%20100}', office_id: 5, category_id: 2, name: "螢幕", Vendor: "Asus", Model: "VZ247", Quantity: 1, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/fly/?random=${Math.random()%20*%20100}', office_id: 7, category_id: 3, name: "螢幕", Vendor: "Asus", Model: "VZ239", Quantity: 1, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/car/?random=${Math.random()%20*%20100}', office_id: 9, category_id: 4, name: "螢幕", Vendor: "Asus", Model: "VC239", Quantity: 1, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/tiger/?random=${Math.random()%20*%20100}', office_id: 2, category_id: 1, name: "螢幕", Vendor: "Philips", Model: "Philips", Quantity: 1, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/pig/?random=${Math.random()%20*%20100}', office_id: 4, category_id: 2, name: "螢幕", Vendor: "Benq", Model: "Benq", Quantity: 1, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/mouse/?random=${Math.random()%20*%20100}', office_id: 6, category_id: 3, name: "螢幕", Vendor: "AOC", Model: "AOC", Quantity: 1, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/keyboard/?random=${Math.random()%20*%20100}', office_id: 8, category_id: 1, name: "螢幕", Vendor: "LG", Model: "LG 24MK600", Quantity: 1, status_id: 4 }
  , { image: 'https://loremflickr.com/320/240/computer/?random=${Math.random()%20*%20100}', office_id: 10, category_id: 1, name: "鍵盤", Vendor: "Logitech", Model: "K120", Quantity: 1, status_id: 3 }
  , { image: 'https://loremflickr.com/320/240/fortinet/?random=${Math.random()%20*%20100}', office_id: 11, category_id: 2, name: "滑鼠", Vendor: "Logitech", Model: "Logitech", Quantity: 1, status_id: 2 }
  , { image: 'https://loremflickr.com/320/240/cisco/?random=${Math.random()%20*%20100}', office_id: 12, category_id: 4, name: "印表機 Printer HP 315", Vendor: "HP", Model: "HP 315", Quantity: 1, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/animal/?random=${Math.random()%20*%20100}', office_id: 13, category_id: 3, name: "UPS APC-1400", Vendor: "UPS", Model: "APC", Quantity: 1, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/cat/?random=${Math.random()%20*%20100}', office_id: 2, category_id: 2, name: "CCTV攝像頭 180度", Vendor: "Hkvision", Model: "180 angle", Quantity: 1, status_id: 1 }
  , { image: 'https://loremflickr.com/320/240/dog/?random=${Math.random()%20*%20100}', office_id: 4, category_id: 2, name: "CCTV攝像頭 360度", Vendor: "Hkvision", Model: "360 angle", Quantity: 1, status_id: 1 }
]
function generateQRcode(id) {
  const assetId = id
  const qrcodeContent = `http://10.4.100.241:3000/scanqrcode?package=0&assetId=${assetId}`
  const qrcode = `./images/qrcode/assets/${assetId}.png`
  // 針對 asset 產生專屬 QR code
  QRCode.toFile(`./public/images/qrcode/assets/${assetId}.png`, qrcodeContent, {
    color: {
      dark: '#00F',  // Blue dots
      light: '#0000' // Transparent background
    }
  }, function (err, success) {
    if (err) throw err
    console.log(success)
  })
  // 將 asset qrcode path 存入 DB
  Asset.findByPk(assetId)
    .then(asset => {
      return asset.update({
        qrcode
      })
    })
    .catch(err => {
      console.log(err)
    })
}

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
