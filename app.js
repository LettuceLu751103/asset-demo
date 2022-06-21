const express = require('express')
var cors = require('cors');
const exphbs = require('express-handlebars')
// load some helpers
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const { getOffset, getPagination } = require('./helpers/pagination-helper')
const { genQR } = require('./helpers/generateQRCode')
const methodOverride = require('method-override')
var logger = require('morgan');
const bcrypt = require('bcryptjs')
const session = require('express-session')
// 載入設定檔，要寫在 express-session 以後
const usePassport = require('./config/passport')
const passport = require('passport')
const app = express()
const PORT = 3000
const { Op, NUMBER } = require("sequelize");
// 引入 https
const https = require('https')
// 引入檔案處理
const fs = require('fs')
const privatekey = fs.readFileSync('./public/ssl/private.key', 'utf8')
const certificate = fs.readFileSync('./public/ssl/certificate.crt', 'utf8')
// https server options
const options = { key: privatekey, cert: certificate }

app.set('view engine', 'hbs')
app.engine('hbs', exphbs({ extname: '.hbs', helpers: handlebarsHelpers }))

// 圖片相關
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
app.use(logger('combined'));
app.use('/upload', express.static(__dirname + '/upload'))
app.use(express.static('public'))
app.use(express.static('node_modules'))
// 設定允許跨 site 訪問 API
const corsOptions = {
  origin: "*",
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(session({
  secret: 'mxnoc.local',
  resave: false,
  saveUninitialized: true
}))
app.use(passport.initialize()) // 增加這行，初始化 Passport
app.use(passport.session()) // 增加這行，啟動 session 功能
// 呼叫 Passport 函式並傳入 app，這條要寫在路由之前
usePassport(app)

app.use((req, res, next) => {
  // 你可以在這裡 console.log(req.user) 等資訊來觀察
  res.locals.isAuthenticated = req.isAuthenticated()
  res.locals.user = req.user
  next()
})

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
const Shiftpost = db.Shiftpost
const Shift = db.Shift
const Image = db.Image
const Grading = db.Grading
const Bulletincategory = db.Bulletincategory
const Bulletinsecondcategory = db.Bulletinsecondcategory
const Bulletin = db.Bulletin
// 這邊可以改成解構賦值的方式處理, const {xxxx} = db.xxxx


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
      QRCode.toDataURL(`https://10.4.100.241:3000/scanqrcode?package=0&assetId=${item.id}`, function (err, url) {
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
    console.log(assetId)
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
          a_office_id: 20,
          quantity: assetId.length,
          countquantity: assetId.length
        }
      ).then(gp => {
        // 利用 gatepass.id 產生 QRcode, 並寫入 Gatepass table
        console.log(gp.id)
        const qrcodeContent = `https://10.4.100.241:3000/scanqrcode?package=1&gatepassId=${gp.id}`
        const qrcode = `./images/qrcode/gatepasses/${gp.id}.png`
        // 針對 gatepass 產生專屬 QR code
        QRCode.toFile(`./public/images/qrcode/gatepasses/${gp.id}.png`, qrcodeContent, {
          color: {
            dark: '#00F',  // Blue dots
            light: '#0000' // Transparent background
          }
        }, function (err, success) {
          if (err) throw err
          console.log(success)
        })

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
      QRCode.toDataURL(`https://10.4.100.241:3000/scanqrcode?package=1&gatepassId=${item.id}`, function (err, url) {
        item.qrcode = url
      })
    })
    // return res.json({ gatepass })
    return res.render('gatepassApp', { gatepass })
  }).catch(err => {
    console.log(err)
  })

})



// 創建 gatepass 頁面
app.get('/gatepass/empty', (req, res) => {
  console.log('創建 gatepass 頁面')
  Office.findAll({ raw: true, nest: true })
    .then(offices => {
      console.log(offices)
      res.render('gatepassEmpty', { offices })
    })
    .catch(err => {
      console.log(err)
    })
})
// post gatepass 頁面
app.post('/gatepass/empty', (req, res) => {
  console.log('收到 post gatepass 頁面')
  // 這裡要判斷是否已經有撿貨中的相同 gatepass 單, 避免重複新增gatepass
  console.log(req.body)
  const OfficeId = req.body.toOfficeId
  const b_office_id = req.body.fromOfficeId
  Gatepass.create({
    OfficeId,
    b_office_id,
    username: '手機板產生GP測試',
    status: 5
  }).then(gp => {

    const qrcodeContent = `https://10.4.100.241:3000/scanqrcode?package=1&gatepassId=${gp.id}`
    const qrcode = `./images/qrcode/gatepasses/${gp.id}.png`
    // 針對 gatepass 產生專屬 QR code
    QRCode.toFile(`./public/images/qrcode/gatepasses/${gp.id}.png`, qrcodeContent, {
      color: {
        dark: '#00F',  // Blue dots
        light: '#0000' // Transparent background
      }
    }, function (err, success) {
      if (err) throw err
      console.log(success)
    })

    Gatepass.findByPk(gp.id)
      .then(gatepassData => {
        gatepassData.update({
          qrcode
        }).then(gpupdate => {

          return res.redirect(`/gatepass/edit?id=${gpupdate.dataValues.id}`)
        })

      })
      .catch(err => {
        console.log(err)
      })

  }).catch(err => {
    console.log(err)
  })
})

// 渲染添加掃描資產到 gatepass 的頁面
app.get('/gatepass/edit', (req, res) => {
  console.log(req.query)
  const gatepassId = req.query.id
  Gatepass.findByPk(gatepassId, {
    raw: true,
    nest: true,
    include: [
      { model: Office, as: 'bofficeId' },
      { model: Office },
      // { model: Office, as: 'aofficeId' },
      {
        model: Asset,
        as: 'TransferAsset',
        nest: true,
        raw: true,
        include: { model: Office },
        // attributes: ['name', 'officeId']
      }
    ]
  })
    .then(gatepass => {
      console.log(gatepass)
      res.render('gatepassEdit', { gatepass })
    })

})



// Asset 加入 gatepass & modify Asset status & create Transfer V3
app.post('/api/qrcode/asset/to/transfer3', (req, res) => {
  console.log('收到修改撿貨狀態 => 移轉狀態請求')
  console.log(req.body)
  const gatepassId = req.body.gatepassId
  Gatepass.findByPk(gatepassId, {
    nest: true,
    include: [
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
    console.log(gatepass)
    if (gatepass.dataValues.quantity > 0) {
      return gatepass.update({
        status: 0
      }).then(gatepassUpdate => {
        console.log(gatepassUpdate)
        let assetArray = gatepassUpdate.dataValues.TransferAsset
        // console.log(assetArray)
        assetArray.forEach(item => {
          // console.log(item.dataValues.id)
          const assetId = item.dataValues.id
          console.log('assetId: ' + assetId)
          console.log('gatepassId: ' + gatepassUpdate.dataValues.id)
          const gatepassId = gatepassUpdate.dataValues.id
          Asset.findByPk(assetId)
            .then(asset => {
              return asset.update({
                status_id: 3
              }).then(assetUpdate => {
                Transfer.findOne({
                  where: {
                    AssetId: assetId,
                    GatepassId: gatepassId
                  }
                }).then(transfer => {
                  return transfer.update({
                    received: 0
                  })
                })
              })
            })
        })
        res.json({ status: 'ok', message: '修改狀態為移轉中' })
      })
    } else {
      res.json({ status: 'error', message: '空單不修改狀態' })
    }

  })
})

// Asset 加入 gatepass & modify Asset status & create Transfer V2
app.post('/api/qrcode/asset/to/transfer2', (req, res) => {
  console.log('收到修改撿貨狀態請求')
  console.log(req.body.assetId)
  console.log(req.body.gatepassId)
  const assetId = req.body.assetId
  const gatepassId = req.body.gatepassId
  Asset.findByPk(assetId)
    .then(asset => {
      return asset.update({
        status_id: 5
      }).then(assetUpdate => {
        console.log(assetUpdate)
        Gatepass.findByPk(gatepassId)
          .then(gatepass => {
            return gatepass.update({
              status: 5,
              quantity: gatepass.dataValues.quantity + 1,
              countquantity: gatepass.dataValues.countquantity + 1
            }).then(gatepassUpdate => {
              console.log(gatepassUpdate)
              return Transfer.create({
                AssetId: assetId,
                GatepassId: gatepassId,
                received: 5
              }).then(transfer => {
                res.json({ transfer, assetUpdate, gatepassUpdate })
              })
            })
          })
      })
    })
})


// 渲染掃描 QR code 入口
app.get('/scanqrcode', (req, res) => {
  console.log(req.query)
  const assetId = req.query.assetId | 0
  const package = req.query.package | 0
  const gatepassId = req.query.gatepassId
  // 根據 package 判斷0是否個別資產QR code 或 1為多個資產QR code

  if (req.query.package === '0') {
    console.log('辨別為單個資產qrcode')
    console.log('package: ' + package)
    console.log('assetId: ' + assetId)
    res.render('scanqrcode', { assetId: assetId, package: package, gatepassStatus: 0, gatepassId: 0, })
  } else {
    console.log('辨別為整包資產')
    console.log(req.query.gatepassId)
    Gatepass.findByPk(req.query.gatepassId)
      .then(gp => {
        // console.log(gp.status)
        console.log(gp)
        res.render('scanqrcode', {
          gatepassId: req.query.gatepassId, gatepassStatus: gp.status, package: package, assetId: 0
        })
      })
      .catch(err => {
        console.log(err)
      })

  }



})



// Asset 加入 gatepass & modify Asset status & create Transfer
app.post('/api/qrcode/asset/to/transfer', (req, res) => {
  console.log('準備將資產加入 gatepass')
  console.log(req.body)
  const assetArray = req.body.asset
  const gatepassId = req.body.gatepassId
  if (assetArray.length > 0) {
    Gatepass.findByPk(gatepassId, {})
      .then(gp => {
        console.log('GP 資產數量+')
        console.log(assetArray.length)
        console.log('GP 資產數量+')
        gp.update({
          quantity: gp.dataValues.quantity + Number(assetArray.length),
          countquantity: gp.dataValues.countquantity + Number(assetArray.length),
        })
      })
    console.log(`傳入要加入資產數量 > 0`)
    assetArray.forEach((item, index) => {
      console.log(`第 ` + index + ` 趟修改資料`)
      console.log(item.id)
      Transfer.findAll({
        raw: true,
        where: {
          AssetId: item.id,
          GatepassId: gatepassId,
          received: 0
        }
      }).then(result => {
        console.log(result.length)
        if (result.length === 0) {
          console.log('沒有找到的話就進行 create transfer')
          Transfer.create({
            AssetId: item.id,
            GatepassId: gatepassId,
            received: 0
          }).then(tf => {
            console.log(tf)
            Asset.findByPk(item.id, {})
              .then(as => {
                // console.log(as)
                as.update({
                  status_id: 3
                })




              })
              .catch(err => {
                console.log(err)
              })
            console.log('創建 transfer ')
          })
        }
        console.log('已有移轉紀錄, 不新增  transfer')

      }).catch(err => {
        console.log(err)
      })
    })

  }
  res.json({ status: 200, message: '成功加入資產到 gatepass' })
})



// 確認單個 Asset 是否已在移轉中 API - 移轉完成
app.post('/api/qrcode/asset/transfer', (req, res) => {
  console.log('確認資產是否已在移轉中?')
  console.log(req.body)
  // 判斷是否資產不為移轉中
  // 判斷是否有移轉紀錄 gpId:xxx, assetId:xxx, received:0
  Asset.findByPk(req.body.assetId, { raw: true })
    .then(asset => {
      console.log(asset.status_id)
      if (asset.status_id === 3) {
        return res.json({ status: 200, message: '該資產已在移轉中, 無法加入 gatepass', inTransfer: true })
      } else if (asset.status_id === 5) {
        return res.json({ status: 200, message: '該資產在撿貨中, 無法加入 gatepass', inTransfer: true })
      } else {
        return res.json({ status: 200, message: '可以加入 gatepass', inTransfer: false, data: asset })
      }
    })
    .catch(err => {
      console.log(err)
    })
})

// 單個 Asset 查詢 API - 移轉完成
app.post('/api/qrcode/asset', (req, res) => {
  console.log('收到 qrcode 查詢單個資產')
  const assetId = req.body.assetId
  Asset.findByPk(assetId, {
    raw: true,
    nest: true,
    include: [
      Office,
      Category,
      Status
    ]
  }).then(asset => {
    // console.log(asset)

    res.json({ status: 200, message: 'get single Asset', response: asset })
  }).catch(err => {
    console.log(err)
  })
})

// 單個 Asset 修改 API 
app.post('/api/qrcode/asset/edit', upload.single('image'), (req, res) => {
  console.log('收到 qrcode 修改單個資產')
  console.log(req.body)
  const assetId = req.body.assetId
  console.log(assetId)

  const { file } = req
  const { name, Vendor, Model, Quantity, Description } = req.body
  const categoryId = req.body.category_id
  const officeId = req.body.office_id
  const statusId = req.body.status_id
  if (file) {
    console.log('有收到圖片要另外處理')
    fs.readFile(file.path, (err, data) => {
      if (err) console.log('Error: ', err)
      console.log(file)
      fs.writeFile(`upload/${file.originalname}`, data, () => {
        return Asset.findByPk(assetId)
          .then(asset => {
            return asset.update({
              statusId,
              categoryId,
              name,
              Vendor,
              Model,
              Quantity,
              officeId,
              Description,
              image: file ? `/upload/${file.originalname}` : null
            }).then(asset => {
              res.redirect(`/scanqrcode?package=0&assetId=${assetId}`)
            })
          })
      })
    })
  } else {
    console.log('沒有收到圖片, 用舊有的圖片, 修改資料')
    Asset.findByPk(assetId)
      .then(asset => {
        return asset.update({
          name,
          Vendor,
          Model,
          Quantity,
          Description,
          categoryId: categoryId,
          status_id: statusId,
          office_id: officeId
        })
      })
      .then(() => {
        res.redirect(`/scanqrcode?package=0&assetId=${assetId}`)
      })
      .catch(err => {
        console.log(err)
      })
  }
})

// qrcode Category 查詢 API
app.post('/api/qrcode/category', (req, res) => {
  Category.findAll({ raw: true })
    .then(categories => {
      // console.log('收到查詢category 請求')
      res.json({ status: 200, message: 'get category list', response: categories })
    })
    .catch(err => {
      console.log(err)
    })
})

// qrcode Office 查詢 API
app.post('/api/qrcode/office', (req, res) => {
  Office.findAll({ raw: true })
    .then(offices => {
      // console.log('收到查詢office 請求')
      res.json({ status: 200, message: 'get office list', response: offices })
    })
    .catch(err => {
      console.log(err)
    })
})

// qrcode Status 查詢 API - 已有對應的在新路徑
app.post('/api/qrcode/status', (req, res) => {
  Status.findAll({ raw: true })
    .then(statuses => {
      // console.log('收到查詢category 請求')
      res.json({ status: 200, message: 'get status list', response: statuses })
    })
    .catch(err => {
      console.log(err)
    })
})

// 整包 gatepass 查詢 API
app.post('/api/gatepass/package', (req, res) => {
  console.log('收到查詢整包 gatepass 請求')
  const { gatepassId } = req.body
  console.log(gatepassId)
  Promise.all([
    Transfer.findAll(
      {
        raw: true,
        nest: true,
        where: {
          GatepassId: gatepassId
        }
      }),
    Asset.findAll({
      raw: true, nest: true, include: [Status]
    })
  ])
    .then(([transfer, assets]) => {
      // console.log(transfer)
      const b = transfer.map(function (tf) {
        const a = assets.find(at => (
          at.id === tf.AssetId
        ))
        return a

      })
      res.json({ status: 200, message: '返回數據', response: b })
    })
})



// 整包 gatepass 到貨 API
app.post('/api/gatepass/package/received', (req, res) => {
  console.log('收到整包 gatepass 到貨請求')
  const { gatepassId } = req.body
  console.log(gatepassId)
  Promise.all([
    Transfer.findAll(
      {
        raw: true,
        nest: true,
        where: {
          GatepassId: gatepassId
        }
      }),
    Asset.findAll({
      raw: true, nest: true
    }),
    Gatepass.findAll({
      raw: true, nest: true
    })
  ])
    .then(([transfer, assets, gatepass]) => {
      // console.log(transfer)
      const b = transfer.map(function (tf) {
        const a = assets.find(at => (
          at.id === tf.AssetId
        ))
        return a

      })
      // 查到當前 gatepass 所有資產 b, 進入 Asset table 修改該資產狀態
      // console.log(b)
      // 修改 gatepass status = 1, 狀態移轉完成
      Gatepass.findByPk(gatepassId)
        .then(gp => {
          console.log('修改 => 移轉完成')
          return gp.update({
            status: 1
          })
        })
      // 修改 Transfer table 中個別資產移轉狀態為 已接收 received = 1, Asset table 中個別資產狀態為 閒置中 status_id = 1

      b.forEach(asset => {
        console.log(asset.id)
        Promise.all([Transfer.findOne({ where: { AssetId: asset.id } }), Asset.findByPk(asset.id), Gatepass.findByPk(gatepassId, {})])
          .then(([transfer, asset, gatepass]) => {
            console.log('修改tf狀態')
            console.log(transfer.dataValues.received)
            transfer.update({
              received: 1
            })
            console.log('修改at狀態')
            console.log(gatepass.dataValues.OfficeId)
            asset.update({
              status_id: 1,
              office_id: gatepass.dataValues.OfficeId
            })

            gatepass.update({
              countquantity: gatepass.dataValues.countquantity - 1
            })
          })
      })
      res.json({ status: 200, message: '返回數據', response: b, gatepassStatus: 1 })
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
          console.log('==== 產生 asset qrcode 並存入 DB ====')
          console.log(asset)
          const assetId = asset.dataValues.id
          const qrcodeContent = `https://10.4.100.241:3000/scanqrcode?package=0&assetId=${assetId}`
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
          console.log('==== 產生 asset qrcode 並存入 DB ====')
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
    }).then((asset) => {
      console.log('==== 產生 asset qrcode 並存入 DB ====')
      const assetId = asset.dataValues.id
      const qrcodeContent = `https://10.4.100.241:3000/scanqrcode?package=0&assetId=${assetId}`
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
      console.log('==== 產生 asset qrcode 並存入 DB ====')
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

// create office page - 已移轉
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

// delete office - 未完成, 會有跟 Asset, gatepass 進行關聯, 要一起刪除
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

// 查詢特定辦公室資料　- 已移轉
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

// 使用者登入頁面 請求
app.get('/users/login', (req, res) => {
  console.log('收到登入頁面請求')
  res.render('login')
})

// 使用者登出 user 
app.get('/users/logout', (req, res) => {
  req.logout()
  res.redirect('/users/login')
})


// 使用者驗證 user 請求
app.post('/users/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/users/login'
}), (req, res) => {
  console.log(req.body)
})


// 掃描 qrcode , 單個資產到貨 API - 已移轉
app.post('/api/qrcode/asset/received', (req, res) => {
  // console.log(req.body.content.hostname)
  console.log(req.body)
  const AssetId = req.body.assetId
  const GatepassId = req.body.gatepassId
  if (AssetId) {
    console.log('掃描進來的qrcode為Asset')
    // 判斷資產是否已接收狀態
    Promise.all([Asset.findByPk(AssetId, { where: { statusId: 3 } }), Transfer.findOne({ where: { AssetId, received: 0 } })])
      .then(([asset, transfer]) => {
        // console.log(asset.dataValues)
        // console.log(transfer)
        if (asset && transfer) {
          console.log('資產以及transfer狀態都是移轉狀態')
          // console.log('GatepassId: ' + transfer.dataValues.GatepassId)
          // 1. 修改 transfer 到貨狀態, received : 1 
          transfer.update({
            received: 1
          }).then(tf => {
            console.log('資產移轉狀態已改為 已接收!!!')
          }).catch(err => {
            console.log(err)
          })

          Gatepass.findByPk(transfer.dataValues.GatepassId, {})
            .then(gatepass => {
              if (gatepass.dataValues.countquantity - 1 > 0) {
                gatepass.update({
                  countquantity: gatepass.dataValues.countquantity - 1,
                  status: 2
                }).then(gatepass => {
                  console.log('gatepass 狀態已改為 到貨部分資產!!!')
                  asset.update({
                    statusId: 1,
                    office_id: gatepass.dataValues.OfficeId
                  })
                  return res.json({
                    status: 200,
                    message: `GP-${gatepass.dataValues.id} 到貨[ 部分資產 ] , 尚有 ${gatepass.dataValues.countquantity} 件物品`
                  })
                }).catch(err => {
                  console.log(err)
                })
              } else {
                console.log(`該 gatepass 到貨全部資產`)
                gatepass.update({
                  countquantity: 0,
                  status: 1
                }).then(gatepass => {
                  console.log('gatepass 狀態已改為 移轉完成!!!')
                  asset.update({
                    statusId: 1,
                    office_id: gatepass.dataValues.OfficeId
                  })
                  return res.json({
                    status: 200,
                    message: `GP-${gatepass.dataValues.id} 到貨 [ 全部資產 ], 狀態改為 [ 移轉完成 ]`
                  })
                }).catch(err => {
                  console.log(err)
                })

              }
            })
            .catch(err => {
              console.log(err)
            })
        } else {
          res.json({ status: 200, message: '已到貨, 不需要再掃描' })
        }
      })
    // 如果已接收, 不做動作返回前端
    // 如果未接收, 更改動作, 修改所有數值
  } else if (GatepassId) {
    console.log('掃描進來的qrcode為Gatepass')
    res.json({ status: 200, message: '請單個進行掃描QR code到貨' })
  }


})



app.get('/shiftpost', (req, res) => {
  Shiftpost.findAll({
    raw: true,
    nest: true,
    include: [Shift],
    attributes: ['id', 'posttitle', 'poster', 'createdAt', 'updatedAt', 'isdeleted'],
    order: [['createdAt', 'DESC'],]
  })
    .then(shiftpost => {
      console.log(shiftpost)
      res.render('shiftpostview', { shiftpost })
    })
    .catch(err => {
      console.log(err)
    })
})

app.get('/shiftpost/create', (req, res) => {
  Shift.findAll({ raw: true, nest: true })
    .then(shift => {
      // console.log(shift)
      res.render('shiftpost', { shift })
    })
    .catch(err => {
      console.log(err)
    })

})

app.post('/shiftpost/images/upload', upload.single('image'), (req, res) => {


  const { file } = req

  if (file) {
    console.log('prepare to save the img.')
    fs.readFile(file.path, (err, data) => {
      if (err) console.log('Error: ', err)
      const filename = Date.now() + '-' + file.originalname
      const filepath = `/images/shiftpost/` + filename
      const fileencoding = file.encoding
      const filemimetype = file.mimetype
      const filesize = file.size

      fs.writeFile(`public/` + filepath, data, () => {
        return Image.create({
          filename,
          filepath,
          filesize,
          fileencoding,
          filemimetype
        }).then(image => {
          return res.json({ url: image.filepath })
        })
      })
    })
    console.log(req.file)
    console.log(Date.now())

  }

})

app.get('/shiftpost/:id', (req, res) => {
  const id = req.params.id
  Shiftpost.findByPk(id, { nest: true, raw: true, include: [Shift] })
    .then(shiftpost => {
      console.log(shiftpost)
      res.render('shiftpostviewdetail', { shiftpost })
    })
    .catch(err => {
      console.log(err)
    })
})

app.get('/shiftpost/:id/update', (req, res) => {
  const id = req.params.id
  Promise.all([Shiftpost.findByPk(id, { nest: true, raw: true, include: [Shift] }), Shift.findAll({ nest: true, raw: true })])
    .then(([shiftpost, shift]) => {
      console.log(shiftpost)
      res.render('shiftpostupdate', { shiftpost, shift })
    })
    .catch(err => {
      console.log(err)
    })
})

app.post('/shiftpost/:id/update', upload.single('image'), (req, res) => {
  console.log('進到修改日誌API')
  const id = req.params.id
  console.log(id)
  console.log(req.body)
  const { posttitle, shift_id, poster, postcontent } = req.body
  Shiftpost.findByPk(id)
    .then(shiftpost => {
      return shiftpost.update({
        posttitle,
        shift_id,
        poster,
        postcontent
      })
        .then(updateShiftpost => {
          res.redirect('/shiftpost')
        })

    })
    .catch(err => {
      console.log(err)
    })
})

app.post('/shiftpost', upload.single('image'), (req, res) => {
  const { posttitle, poster, postcontent, shift_id } = req.body
  Shiftpost.create({
    posttitle,
    poster,
    postcontent,
    shift_id
  })
    .then(shiftpost => {
      console.log(shiftpost)
      console.log(req.body)
      res.redirect('/shiftpost')
    })
    .catch(err => {
      console.log(err)
    })
})


app.get('/bulletin', (req, res) => {
  console.log('這是布告欄頁面')
  Bulletin.findAll({
    raw: true, nest: true, include: [
      Bulletincategory,
      Bulletinsecondcategory,
      Grading,
    ],
    order: [['updatedAt', 'DESC'],]
  })
    .then(bulletin => {
      // console.log(bulletin)
      res.render('bulletinview', { bulletin })
    })
    .catch(err => {
      console.log(err)
    })

})



app.get('/bulletin/create', (req, res) => {
  console.log('這是新增布告欄頁面')
  Promise.all([Grading.findAll({ raw: true, nest: true }), Bulletincategory.findAll({ raw: true, nest: true })])
    .then(([grading, bulletincategory]) => {
      // console.log(grading)
      res.render('bulletin', { grading, bulletincategory })
    })
    .catch(err => {
      console.log(err)
    })

})

app.post('/bulletin/create', upload.single('image'), (req, res) => {
  console.log(req.body)
  const { posttitle, bulletincategoryId, bulletinsecondcategoryId, gradingId, poster, postcontent } = req.body
  if (!posttitle.trim()) {
    console.log('標題不可為空')
    return res.redirect('/bulletin')
  } else if (!bulletincategoryId.trim() || bulletincategoryId === '0') {
    console.log('公告類別數值不正確')
    return res.redirect('/bulletin')
  } else if (!bulletinsecondcategoryId.trim()) {
    console.log('公告次類別數值不正確')
    return res.redirect('/bulletin')
  } else if (!gradingId.trim() || gradingId === '0') {
    console.log('公告等級數值不正確')
    return res.redirect('/bulletin')
  } else if (!poster.trim()) {
    console.log('發佈者不可為空')
    return res.redirect('/bulletin')
  } else if (!postcontent.trim()) {
    console.log('發佈內容不可為空')
    return res.redirect('/bulletin')
  } else {

    Bulletin.create({
      posttitle,
      bulletincategory_id: Number(bulletincategoryId),
      bulletinsecondcategory_id: Number(bulletinsecondcategoryId),
      grading_id: Number(gradingId),
      poster,
      postcontent
    }).then(bulletin => {
      console.log('資料寫入成功')
      res.redirect('/bulletin')
    }).catch(err => {
      console.log(err)
    })
  }

})

app.get('/grading/create', (req, res) => {
  console.log('進入新增公告等級頁面')
  Grading.findAll({ raw: true, nest: true })
    .then(grading => {
      console.log(grading)
      res.render('grading', { grading })
    })
    .catch(err => {
      console.log(err)
    })

})

// 創建公告等級
app.post('/grading/create', (req, res) => {
  console.log(req.body)
  const { name, Description } = req.body
  if (!name) {
    console.log('公告等級不可為空')
    return res.redirect('/bulletin')
  }
  Grading.findOne({ where: { name: name } })
    .then(grading => {
      if (grading) {
        console.log('創建失敗, 已有相同名稱的公告等級')
        return res.redirect('/bulletin')
      }
      return Grading.create({
        name,
        Description
      }).then(grading => {
        console.log('創建 graing 成功')
        res.redirect('/bulletin')
      }).catch(err => {
        console.log(err)
      })
    })
})

// 創建公告類別頁面
app.get('/bulletincategory/create', (req, res) => {
  console.log('進入新增公告類別頁面')
  Bulletincategory.findAll({ raw: true, nest: true })
    .then(bulletincategory => {
      res.render('bulletincategory', { bulletincategory })
    })
    .catch(err => {
      console.log(err)
    })

})

// 創建公告類別
app.post('/bulletincategory/create', (req, res) => {
  console.log(req.body)
  const { name, Description } = req.body
  if (!name) {
    console.log('缺少公告類別名稱')
    res.redirect('back')
  }
  Bulletincategory.findOne({ where: { name: name } })
    .then(bulletincategory => {
      if (bulletincategory) {
        console.log('相同公告類別名稱, 創建失敗')
        res.redirect('back')
      }
      return Bulletincategory.create({
        name,
        Description
      }).then(bc => {
        console.log('創建公告類別成功')
        res.redirect('/bulletin')
      })
    })

})

// 創建公告次類別頁面
app.get('/bulletinsecondcategory/create', (req, res) => {
  console.log('進入新增公告次類別頁面')
  Bulletincategory.findAll({ nest: true, include: Bulletinsecondcategory })
    .then(bulletincategory => {

      console.log(bulletincategory)
      res.render('bulletinsecondcategory', { bulletincategory })
    })
    .catch(err => {
      console.log(err)
    })
})
// 創建公告次類別
app.post('/bulletinsecondcategory/create', (req, res) => {
  console.log('準備新增次類別')
  const { bulletincategory_id, name, Description } = req.body
  console.log(req.body)
  if (!bulletincategory_id) {
    console.log('沒有公告主類別')
    return res.redirect('back')
  }
  if (!name) {
    console.log('缺少次類別名稱')
    return res.redirect('back')
  }
  Bulletinsecondcategory.findOne({ where: { name: name } })
    .then(bulletinsecondcategory => {
      if (bulletinsecondcategory) {
        console.log('次類別名稱重複, 新增失敗')
        return res.redirect('back')
      }
      Bulletinsecondcategory.create({
        name,
        Description,
        bulletincategory_id: Number(bulletincategory_id)
      }).then(bulletinsecondcategory => {
        console.log('新增次類別成功')
        res.redirect('/bulletin')
      }).catch(err => {
        console.log(err)
      })
    })
    .catch(err => {
      console.log(err)
    })
})

app.get('/bulletinsecondcategory/:id', (req, res) => {
  const id = req.params.id
  Bulletinsecondcategory.findAll({ where: { bulletincategory_id: id } })
    .then(bulletinsecondcategory => {
      console.log(bulletinsecondcategory)
      res.json({ status: 'ok', message: '查詢到次類別', data: bulletinsecondcategory })
    })
    .catch(err => {
      console.log(err)
    })
})

// 佈告欄上傳圖片 API
app.post('/bulletin/images/upload', upload.single('image'), (req, res) => {


  const { file } = req

  if (file) {
    console.log('prepare to save the img.')
    fs.readFile(file.path, (err, data) => {
      if (err) console.log('Error: ', err)
      const filename = Date.now() + '-' + file.originalname
      const filepath = `/images/bulletin/` + filename
      const fileencoding = file.encoding
      const filemimetype = file.mimetype
      const filesize = file.size

      fs.writeFile(`public/` + filepath, data, () => {
        return Image.create({
          filename,
          filepath,
          filesize,
          fileencoding,
          filemimetype
        }).then(image => {
          return res.json({ url: image.filepath })
        })
      })
    })
    console.log(req.file)
    console.log(Date.now())

  }

})



app.get('/bulletin/:id', (req, res) => {
  const id = req.params.id
  Promise.all([
    Bulletin.findByPk(id, {
      nest: true, raw: true, include: [
        Bulletincategory,
        Bulletinsecondcategory,
        Grading,
      ]
    }),
  ])
    .then(([bulletin,]) => {
      // console.log(bulletin)
      res.render('bulletinviewdetail', { bulletin, })
    })
    .catch(err => {
      console.log(err)
    })
})


app.get('/bulletin/:id/update', (req, res) => {
  const id = req.params.id
  Promise.all([
    Bulletin.findByPk(id, {
      raw: true, nest: true, include: [
        Bulletincategory,
        Bulletinsecondcategory,
        Grading,
      ]
    }),
    Bulletincategory.findAll({ raw: true, nest: true }),
    Bulletinsecondcategory.findAll({ raw: true, nest: true }),
    Grading.findAll({ raw: true, nest: true })
  ]).then(([bulletin, bulletincategory, bulletinsecondcategory, grading]) => {
    console.log(bulletin)
    console.log('===================')
    console.log(bulletincategory)
    console.log('===================')
    console.log(bulletinsecondcategory)
    console.log('===================')
    console.log(grading)
    console.log('===================')
    res.render('bulletinupdate', {
      bulletin,
      bulletincategory,
      bulletinsecondcategory,
      grading
    })
  }).catch(err => {
    console.log(err)
  })

})

app.post('/bulletin/:id/update', upload.single('image'), (req, res) => {
  console.log(req.body)
  const id = req.params.id
  console.log(req.params)
  const { posttitle, bulletincategoryId, bulletinsecondcategoryId, gradingId, poster, postcontent } = req.body
  if (!posttitle.trim()) {
    console.log('標題不可為空')
    return res.redirect('/bulletin')
  } else if (!bulletincategoryId.trim() || bulletincategoryId === '0') {
    console.log('公告類別數值不正確')
    return res.redirect('/bulletin')
  } else if (!bulletinsecondcategoryId.trim()) {
    console.log('公告次類別數值不正確')
    return res.redirect('/bulletin')
  } else if (!gradingId.trim() || gradingId === '0') {
    console.log('公告等級數值不正確')
    return res.redirect('/bulletin')
  } else if (!poster.trim()) {
    console.log('發佈者不可為空')
    return res.redirect('/bulletin')
  } else if (!postcontent.trim()) {
    console.log('發佈內容不可為空')
    return res.redirect('/bulletin')
  } else {
    console.log('資料確認無誤, 寫入 DB')
    console.log(id)
    Bulletin.findByPk(id)
      .then(bulletin => {
        console.log('有茶道資料')
        console.log(bulletin)
        if (bulletin) {
          console.log('有茶道資料')
          console.log('有茶道資料')
          return bulletin.update({
            posttitle,
            bulletincategory_id: Number(bulletincategoryId),
            bulletinsecondcategory_id: Number(bulletinsecondcategoryId),
            grading_id: Number(gradingId),
            poster,
            postcontent
          }).then(bulletin => {
            console.log('資料修改成功')
            res.redirect(`/bulletin/${id}`)
          }).catch(err => {
            console.log(err)
          })

        }
      })

  }
})
// app.listen(PORT, () => {
//   console.log(`App is running on http://localhost:${PORT}`)
// })

const server = https.createServer(options, app)
server.listen(PORT, () => {
  console.log(`App is running on https://localhost:${PORT}`)
})