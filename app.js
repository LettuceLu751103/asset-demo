const express = require('express')
const exphbs = require('express-handlebars')
// load some helpers
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const { getOffset, getPagination } = require('./helpers/pagination-helper')
const { genQR } = require('./helpers/generateQRCode')
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs')
const app = express()
const PORT = 3000
const { Op } = require("sequelize");

app.set('view engine', 'hbs')
app.engine('hbs', exphbs({ extname: '.hbs', helpers: handlebarsHelpers }))

// 圖片相關
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
app.use('/upload', express.static(__dirname + '/upload'))
app.use(express.static('public'))
// 引入檔案處理
const fs = require('fs')




app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// connect to db
const db = require('./models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office
const Status = db.Status
const Gatepass = db.Gatepass
const Transfer = db.Transfer

// QR code
var QRCode = require('qrcode')

// Route 相關
const router = express.Router()
const { apis } = require('./routes')

app.use('/api', apis)

// 接收前端 axios 需要使用.json()
const bodyParser = require('body-parser')
app.use(bodyParser.json())


app.get('/', (req, res) => {
  res.render('index')
})

app.get('/categories', (req, res) => {
  Category.findAll({ raw: true })
    .then(categories => {
      // console.log(categories)
      res.render('categories', { categories })
    })
    .catch(err => {
      console.log(err)
    })

})

// render create category page
app.get('/createCategories', (req, res) => {
  res.render('createCategory')
})

// create category
app.post('/createCategories', (req, res) => {

  console.log(req.body)
  Category.findOne({
    where: {
      name: req.body.name
    }
  })
    .then(val => {
      console.log(val)
      if (val) {
        console.log('有資料不重覆加入')
        res.redirect('/categories') //新增完成後導回後台首頁
      } else {
        Category.create({ name: req.body.name })
          .then(category => {
            // req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
            res.redirect('/categories') //新增完成後導回後台首頁
          })
          .catch(err => {
            console.log(err)
          })
      }
    })
    .catch(err => {
      console.log(err)
    })

})

// delete category
app.delete('/deleteCategory/:id', (req, res) => {
  console.log(req.params)
  return Category.findByPk(req.params.id)
    .then(category => {
      if (!category) throw new Error("category didn't exist!")
      return category.destroy()
    })
    .then(() => res.redirect('/categories'))
    .catch(err => next(err))
})

// render specific category page
app.get('/editCategories/:id', (req, res) => {
  console.log('render page by specific category')
  Category.findByPk(req.params.id, {
    raw: true
  })
    .then(category => {
      console.log(category)
      if (!category) throw new Error("category didn't exist!")
      res.render('editCategory', { category })
    })
    .catch(err => next(err))

})

// edit specific category page
app.put('/editCategories/:id', (req, res) => {
  console.log(req.params.id)
  console.log(req.body)
  Category.findByPk(req.params.id)
    .then(category => {
      if (!category) throw new Error("category didn't exist!")
      return category.update({
        name: req.body.name
      })
    })
    .then(() => {
      res.redirect('/categories')
    })
    .catch(err => next(err))

})

app.get('/officeAssets', (req, res) => {
  // define default data limit
  const DEFAULT_LIMIT = 10
  const officeId = Number(req.query.officeId)
  const categoryId = Number(req.query.categoryId)
  let searchName = req.query.searchString
  let name = ""
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || DEFAULT_LIMIT
  const offset = getOffset(limit, page)
  if (searchName) {
    name = { [Op.like]: '%' + searchName + '%' }
  }

  Promise.all([
    Asset.findAndCountAll({
      raw: true,
      nest: true,
      include: [Category, Office, Status],
      order: [
        ['updated_at', 'DESC']
      ],
      where: {

        ...officeId ? { officeId } : {},
        ...categoryId ? { categoryId } : {},
        ...name ? { name } : {},
      },
      limit,
      offset
    }),
    Category.findAll({ raw: true }),
    Office.findAll({ raw: true })
  ]).then(([assets, category, office]) => {
    assets.rows.forEach(item => {
      QRCode.toDataURL(`http://10.4.100.241:3000/scanqrcode?package=0&assetID=${item.id}`, function (err, url) {
        item.qrcode = url
      })
    })
    // console.log(assets.rows)
    res.render('officeAsset', { assets: assets.rows, pagination: getPagination(limit, page, assets.count), category, office, categoryId, officeId, searchName })
  }).catch(err => {
    console.log(err)
  })

})


// 測試 gatepass 表單關聯
app.get('/createGatepass', (req, res) => {
  console.log('收到gatepass頁面請求')
  console.log('params: ')
  console.log(req.query)
  console.log('params: ')
  const assetId = req.query.assetId
  const officeId = req.query.officeId
  console.log('=====================')
  // console.log(assetId)
  console.log(officeId)
  assetId.forEach(asset => {
    console.log(asset)
  })
  console.log('=====================')
  Office.findAll({ raw: true })
    .then(office => {
      // console.log(office)
      res.render('createGatepass', { office })
    }).catch(err => {
      console.log(err)
    })

})

// 測試 gatepass post 請求
app.post('/createGatepass', (req, res) => {
  console.log('收到 post gatepass 請求')
  console.log(req.body)
  const { assetId, officeId } = req.body
  if (officeId === '') {
    return res.json({ status: '404', message: 'officeId is null!!!' })
  }
  else if (assetId.length !== 0) {
    console.log('傳進來是有資產的')
    Asset.findByPk(assetId[0], {
      raw: true
    }).then(asset => {
      // 獲取資產 b_office_id
      const b_office_id = asset.officeId
      // 有了三個必填參數, officeId, AssetId, b_office_id, 寫入 gatepass table
      Gatepass.create(
        {
          username: '生菜測試',
          status: 0,
          OfficeId: officeId,
          b_office_id,
          quantity: assetId.length
        }
      ).then(gp => {
        // 利用 gatepass.id 產生 QRcode, 並寫入 Gatepass table
        const qrcode = `http://10.4.100.241:3000/scanqrcode?package=1&gatepassId=${gp.id}`
        Gatepass.findByPk(gp.id)
          .then(gatepassData => {
            return gatepassData.update({
              qrcode
            })
          })
          .catch(err => {
            console.log(err)
          })

        // 將資產寫入 Transfer table
        assetId.forEach(AssetId => {


          Transfer.create({
            AssetId,
            GatepassId: gp.id
          }, { raw: true }).then((tf) => {
            // 將資產狀態修改為移轉中
            Asset.findByPk(tf.dataValues.AssetId)
              .then(asset => {
                return asset.update({
                  status_id: 3
                })
              })
              .catch(err => {
                console.log(err)
              })
          }).catch(err => {
            console.log(err)
          })
        })

      })
        .catch(err => {
          console.log(err)
        })

    })
      .then(() => {
        return res.json({ status: 200, message: 'create gatepass succeed!!!' })
      })
      .catch(err => {
        console.log(err)
      })
  } else {
    return res.json({ status: '404', message: 'create gatepass failed!!!' })
  }


})

// 測試 gatepass render get 請求
app.get('/gatepass', (req, res) => {
  console.log('收到查詢 Gatepass 請求')


  Gatepass.findAll({
    // raw: true,
    nest: true,
    include: [
      { model: Office, attributes: ['name'] },
      {
        model: Asset,
        as: 'TransferAsset',
        nest: true,
        raw: true,
        include: { model: Office },
        // attributes: ['name', 'officeId']
      }
    ]
  }).then(gatepass => {

    gatepass = gatepass.map(gp => ({
      ...gp.dataValues,
      ...gp.Office.dataValues,

    }))
    console.log(gatepass)
    console.log('=====================================')


    gatepass.forEach(item => {
      QRCode.toDataURL(`http://10.4.100.241:3000/scanqrcode?package=1&gatepassID=${item.id}`, function (err, url) {
        item.qrcode = url
      })
    })
    // return res.json({ gatepass })
    return res.render('gatepass', { gatepass })
  }).catch(err => {
    console.log(err)
  })







  // Gatepass.findAll({
  //   raw: true,
  //   nest: true,
  //   include: [
  //     // 使用 attributes 可以過濾想要抓取的值
  //     { model: Office, attributes: ['name'] },
  //     { model: Asset, as: 'TransferAsset', include: { model: Office }, attributes: ['name', 'officeId'] }
  //   ],
  //   order: [
  //     ['updated_at', 'DESC']
  //   ],
  // })
  //   .then(gatepass => {
  //     console.log(gatepass)
  //     gatepass.forEach(item => {
  //       QRCode.toDataURL(`http://10.4.100.241:3000/scanqrcode?package=1&gatepassID=${item.id}`, function (err, url) {
  //         item.qrcode = url
  //       })
  //     })
  //     return res.render('gatepass', { gatepass })
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
})

// gatepass render get api 
app.get('/api/gatepass', (req, res) => {
  console.log('收到查詢 Gatepass 請求')


  Gatepass.findAll({
    nest: true,
    include: [
      { model: Office, attributes: ['name'] },
      {
        model: Asset,
        as: 'TransferAsset',
        nest: true,
        raw: true,
        include: { model: Office },
        // attributes: ['name', 'officeId']
      }
    ],
    order: [
      ['updated_at', 'DESC']
    ],
  }).then(gatepass => {

    gatepass = gatepass.map(gp => ({
      ...gp.dataValues,
      ...gp.Office.dataValues,

    }))
    console.log(gatepass)
    console.log('=====================================')


    gatepass.forEach(item => {
      QRCode.toDataURL(`http://10.4.100.241:3000/scanqrcode?package=1&gatepassID=${item.id}`, function (err, url) {
        item.qrcode = url
      })

    })
    // console.log(url)
    // console.log(gatepass)
    return res.json({ gatepass })

  }).catch(err => {
    console.log(err)
  })


})

// 掃描 QR code 入口
app.get('/scanqrcode', (req, res) => {
  console.log(req.query)
  // 根據 package 判斷0是否個別資產QR code 或 1為多個資產QR code
  if (req.query.package === '0') {
    console.log('辨別為單個資產qrcode')
    res.render('scanqrcode', { assetID: req.query.assetID, package: req.query.package })
  } else {
    console.log('辨別為整包資產')
    res.render('scanqrcode', {
      assetID: req.query.assetID, package: req.query.package
    })
  }

})

app.get('/api/officeAssets', (req, res) => {
  // define default data limit
  const DEFAULT_LIMIT = 10
  const officeId = Number(req.query.officeId)
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || DEFAULT_LIMIT
  const name = req.query.name
  const offset = getOffset(limit, page)
  console.log('傳送進來的 page : ')
  console.log(page)
  console.log('傳送進來的 limit : ')
  console.log(limit)
  console.log('傳送進來的 officeId : ')
  console.log(officeId)
  console.log('傳送進來的 name : ')
  console.log(name)
  Promise.all([
    Asset.findAndCountAll({
      raw: true,
      nest: true,
      include: [Category, Office],
      where: {
        ...officeId ? { officeId } : {},
        ...name ? { name } : {}
      },
      order: [
        ['updated_at', 'DESC']
      ],
      limit,
      offset
    }),
    Category.findAll({ raw: true }),
    Office.findAll({ raw: true })
  ]).then(([assets, category, office]) => {
    console.log(assets)
    assets.rows.forEach(item => {
      QRCode.toDataURL(`http://10.4.100.241:3000/editAssets/${item.id}`, function (err, url) {
        item.qrcode = url
      })
    })
    res.json({ assets: assets.rows, pagination: getPagination(limit, page, assets.count), category, office })
  }).catch(err => {
    console.log(err)
  })

})

// render edit Asset page
app.get('/editAssets/:id', (req, res) => {
  Promise.all([
    Asset.findByPk(req.params.id, { raw: true, }),
    Category.findAll({ raw: true }),
    Office.findAll({ raw: true })
  ])
    .then(([asset, category, office]) => {
      res.render('editAsset', { asset, category, office })
    })
    .catch(err => next(err))

})

app.put('/editAsset/:id', (req, res) => {
  console.log(req.params.id)
  console.log(req.body)
  Asset.findByPk(req.params.id)
    .then(asset => {
      if (!asset) throw new Error("asset didn't exist!")
      return asset.update({
        name: req.body.name,
        Vendor: req.body.Vendor,
        Model: req.body.Model,
        Quantity: req.body.Quantity,
        Description: req.body.Description
      })
    })
    .then(() => {
      res.redirect('/officeAssets')
    })
    .catch(err => next(err))

})

app.get('/createOfficeAsset', (req, res) => {
  Promise.all([
    Category.findAll({
      raw: true,
      nest: true
    }),
    Office.findAll({
      raw: true,
      nest: true
    }),
    Status.findAll({
      raw: true,
      nest: true
    })
  ])
    .then(([category, office, status]) => {
      res.render('createOfficeAsset', { category, office, status })
    })
    .catch(err => {
      console.log(err)
    })

})

app.post('/createOfficeAsset', upload.single('image'), (req, res) => {
  const { file } = req
  const { name, Vendor, Model, Quantity, Description } = req.body
  const categoryId = req.body.category_id
  const officeId = req.body.office_id
  const statusId = req.body.status_id
  if (file) {
    console.log('傳入的檔案有圖片, 需要進行檔案處理')
    fs.readFile(file.path, (err, data) => {
      if (err) console.log('Error: ', err)
      fs.writeFile(`upload/${file.originalname}`, data, () => {
        return Asset.create({
          statusId,
          categoryId,
          name,
          Vendor,
          Model,
          Quantity,
          officeId,
          Description,
          image: file ? `/upload/${file.originalname}` : null
        }).then((asset) => {
          // req.flash('success_messages', 'restaurant was successfully created')
          res.redirect('/officeAssets')
        })
      })
    })
  } else {
    console.log('傳入的檔案沒有圖片')
    console.log(req.body)


    Asset.create({
      statusId,
      categoryId,
      name,
      Vendor,
      Model,
      Quantity,
      officeId,
      Description
    }).then(() => {
      res.redirect('/officeAssets')
    })
      .catch(err => {
        console.log(err)
      })
  }

})


// render office page
app.get('/offices', (req, res) => {
  Office.findAll({
    raw: true,
  })
    .then(offices => {
      res.render('office', { offices })
    })
    .catch(err => {
      console.log(err)
    })

})

// render create office page
app.get('/createOffice', (req, res) => {
  res.render('createOffice')
})

// create office page
app.post('/createOffice', (req, res) => {
  const { name, Description } = req.body

  Office.findOne({
    where: {
      name: req.body.name
    }
  })
    .then(val => {
      if (val) {  // 如果資料庫找到, 不新增辦公室
        console.log('有資料不重覆加入')
        res.redirect('/offices')
      } else {  // 如果資料庫沒找到, 新增辦公室
        return Office.create({
          name,
          Description
        })
          .then(() => {
            // req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
            res.redirect('/offices')
          })
          .catch(err => {
            console.log(err)
          })
      }
    })
    .catch(err => {
      console.log(err)
    })
})

// delete office
app.delete('/deleteOffice/:id', (req, res) => {
  console.log(req.params)
  return Office.findByPk(req.params.id)
    .then(office => {
      if (!office) throw new Error("office didn't exist!")
      return office.destroy()
    })
    .then(() => res.redirect('/offices'))
    .catch(err => next(err))
})

// update office
app.get('/editOffices/:id', (req, res) => {
  console.log(req.params.id)
  Office.findByPk(req.params.id, {
    raw: true
  })
    .then(office => {

      console.log(office)
      if (!office) throw new Error("office didn't exist!")
      res.render('editOffice', { office })
    })
    .catch(err => next(err))

})

// edit specific office page
app.put('/editOffices/:id', (req, res) => {

  Office.findByPk(req.params.id)
    .then(office => {
      if (!office) throw new Error("office didn't exist!")
      return office.update({
        name: req.body.name,
        Description: req.body.Description
      })
    })
    .then(() => {
      res.redirect('/offices')
    })
    .catch(err => next(err))

})


// generate QR Code API


app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})