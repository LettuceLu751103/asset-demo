
const express = require('express')
const router = express.Router()

const { getOffset, getPagination } = require('../../helpers/pagination-helper')
// connect to db
const db = require('../../models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office


// QR code
var QRCode = require('qrcode')


router.get('/officeAssets', (req, res) => {
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


// category 相關 api

router.get('/categories', (req, res) => {
    Category.findAll({ raw: true })
        .then(categories => {
            // console.log(categories)
            res.json({ categories })
        })
        .catch(err => {
            console.log(err)
        })

})

// create category
router.post('/Categories/create', (req, res) => {

    console.log(req.body)
    Category.findOne({
        where: {
            name: req.body.name
        }
    })
        .then(val => {
            if (val) {
                res.json({ status: 200, data: 'Failed create category' })
            } else {
                Category.create({ name: req.body.name })
                    .then(category => {
                        // req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
                        res.json({ status: 200, data: 'Succeed create category' })
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
// 會有關聯問題, Assets 表內有使用到資料, 需要連同Assets刪除
router.delete('/Categories/delete/:id', (req, res) => {
    console.log(req.params)
    return Category.findByPk(req.params.id)
        .then(category => {
            if (!category) {
                res.json({ status: 200, data: 'Failed delete category' })
            } else {
                category.destroy()
                res.json({ status: 200, data: 'Succeed delete category' })
            }
        })
})


// office 相關 api
router.get('/offices', (req, res) => {
    Office.findAll({
        raw: true,
    })
        .then(offices => {
            res.json({ offices })
        })
        .catch(err => {
            console.log(err)
        })

})

// create office
router.post('/offices/create', (req, res) => {
    const { name, Description } = req.body

    Office.findOne({
        where: {
            name: req.body.name
        }
    })
        .then(val => {
            if (val) {  // 如果資料庫找到, 不新增辦公室
                res.json({ status: 200, data: 'Failed create office' })
            } else {  // 如果資料庫沒找到, 新增辦公室
                return Office.create({
                    name,
                    Description
                })
                    .then(office => {
                        // req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
                        res.json({ status: 200, data: 'Succeed create office' })
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

module.exports = router