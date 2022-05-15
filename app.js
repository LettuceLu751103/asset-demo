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


app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// connect to db
const db = require('./models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office


// QR code
var QRCode = require('qrcode')

// Route 相關
const router = express.Router()
const { apis } = require('./routes')

app.use('/api', apis)



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
      include: [Category, Office],
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
      QRCode.toDataURL(`http://10.4.100.241:3000/editAssets/${item.id}`, function (err, url) {
        item.qrcode = url
      })
    })

    res.render('officeAsset', { assets: assets.rows, pagination: getPagination(limit, page, assets.count), category, office, categoryId, officeId, searchName })
  }).catch(err => {
    console.log(err)
  })

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
    })
  ])
    .then(([category, office]) => {
      res.render('createOfficeAsset', { category, office })
    })
    .catch(err => {
      console.log(err)
    })

})

app.post('/createOfficeAsset', (req, res) => {

  const { name, Vendor, Model, Quantity, Description } = req.body
  const categoryId = req.body.category_id
  const officeId = req.body.office_id
  Asset.create({
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