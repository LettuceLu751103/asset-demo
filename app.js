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

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})