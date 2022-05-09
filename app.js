const express = require('express')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs')
const app = express()
const PORT = 3000
app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// connect to db
const db = require('./models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office
const fakeData = [{ name: "主機", Vendor: "Generic", Model: "Generic", Quantity: 95 }
  , { name: "螢幕", Vendor: "Asus", Model: "VZ249", Quantity: 29 }
  , { name: "螢幕", Vendor: "Asus", Model: "VZ247", Quantity: 70 }
  , { name: "螢幕", Vendor: "Asus", Model: "VZ239", Quantity: 19 }
  , { name: "螢幕", Vendor: "Asus", Model: "VC239", Quantity: 2 }
  , { name: "螢幕", Vendor: "Philips", Model: "Philips", Quantity: 43 }
  , { name: "螢幕", Vendor: "Benq", Model: "Benq", Quantity: 6 }
  , { name: "螢幕", Vendor: "AOC", Model: "AOC", Quantity: 6 }
  , { name: "螢幕", Vendor: "LG", Model: "LG 24MK600", Quantity: 11 }
  , { name: "鍵盤", Vendor: "Logitech", Model: "K120", Quantity: 94 }
  , { name: "滑鼠", Vendor: "Logitech", Model: "Logitech", Quantity: 95 }
  , { name: "印表機 Printer HP 315", Vendor: "HP", Model: "HP 315", Quantity: 3 }
  , { name: "UPS APC-1400", Vendor: "UPS", Model: "APC", Quantity: 92 }
  , { name: "CCTV攝像頭 180度", Vendor: "Hkvision", Model: "180 angle", Quantity: 5 }
  , { name: "CCTV攝像頭 360度", Vendor: "Hkvision", Model: "360 angle", Quantity: 55 }]



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
  Asset.findAll({ raw: true })
    .then(assets => {
      res.render('officeAsset', { assets })
    })
    .catch(err => {
      console.log(err)
    })

})

app.get('/createOfficeAsset', (req, res) => {
  res.render('createOfficeAsset')
})

app.post('/createOfficeAsset', (req, res) => {
  console.log(req.body)
  const { name, Vendor, Model, Quantity, Description } = req.body
  Asset.create({
    name,
    Vendor,
    Model,
    Quantity,
    Description
  })
    .then(() => {
      console.log("資料插入成功")
      res.redirect('/officeAssets')
    })
    .catch(err => {
      console.log(err)
    })
})


// render office page
app.get('/offices', (req, res) => {
  Office.findAll({ raw: true })
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

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})