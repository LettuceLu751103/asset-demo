
const express = require('express')
const router = express.Router()

const { getOffset, getPagination } = require('../../helpers/pagination-helper')
// connect to db
const db = require('../../models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office
const Gatepass = db.Gatepass
const Status = db.Status



// QR code
var QRCode = require('qrcode')



router.get('/gatepassData/:id', (req, res) => {
    console.log('收到gatepassData: ')
    console.log(req.params)
    const id = Number(req.params.id)
    Promise.all([Asset.findByPk(id, {
        raw: true,
        nest: true,
        include: [Category, Office],
        // where: {

        // },
        order: [
            ['updated_at', 'DESC']
        ],
        // limit,
        // offset
    }),
    Category.findAll({ raw: true }),
    Office.findAll({ raw: true })
    ])
        .then(([asset, category, office]) => {
            res.json({ status: 'ok', data: asset })
        })

})



// 獲得所有類別 API
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

// 創建類別 API
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


// 獲得 office api
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

// create office aip
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

// 獲取所有 officeAssets 資產 API
router.get('/officeAssets', (req, res) => {
    console.log('收到 API 請求資產資料')
    // define default data limit
    const DEFAULT_LIMIT = 10
    const officeId = Number(req.query.officeId)
    const categoryId = Number(req.query.categoryId)
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
                ...name ? { name } : {},
                ...categoryId ? { categoryId } : {}
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
        // console.log(assets)
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


// 獲取所有 gatepass API 
router.get('/gatepass', (req, res) => {
    console.log('收到查詢 Gatepass API 請求')
    Gatepass.findAll({
        // raw: true,
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
                include: { model: Office, model: Status },
                // attributes: ['name', 'officeId']
            }
        ],
        order: [
            ['updated_at', 'DESC']
        ],
    }).then(gatepass => {
        // 整理資料, 這邊因為使用了 raw:true 會造成抓取不到資產資料

        gatepass = gatepass.map(gp => ({
            ...gp.dataValues,
        }))
        gatepass.forEach(item => {
            QRCode.toDataURL(`http://10.4.100.241:3000/scanqrcode?package=1&gatepassId=${item.id}`, function (err, url) {
                item.qrcode = url
            })
        })
        return res.json({ gatepass })
    }).catch(err => {
        console.log(err)
    })
})


// 創建空白 gatepass API 
router.post('/gatepass/empty', (req, res) => {
    console.log('收到 post gatepass 頁面')
    // 這裡要判斷是否已經有撿貨中的相同 gatepass 單, 避免重複新增gatepass
    console.log(req.body)
    const OfficeId = req.body.toOfficeId
    const b_office_id = req.body.fromOfficeId
    if (OfficeId === b_office_id) {
        res.json({ status: 'Failed', message: '創建空白gatepass失敗, 來源目的地不可相同' })
    } else {
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
                        // return res.redirect(`/gatepass/edit?id=${gpupdate.dataValues.id}`)
                        return res.json({ status: 'ok', message: '成功創建空白gatepass, 初始狀態為撿單中', data: gpupdate })
                    })
                })
                .catch(err => {
                    console.log(err)
                })
        }).catch(err => {
            console.log(err)
        })
    }
})


// 查詢特定 gatepass API
router.post('/gatepass/get', (req, res) => {
    console.log(req.body)
    const gatepassId = req.body.gatepassId
    console.log(gatepassId)
    Gatepass.findByPk(gatepassId, { raw: true })
        .then(gp => {
            console.log(gp)
            res.json({ status: 'ok', message: '成功獲得單筆 gatepass 資料', gatepass: gp })
        })
})


module.exports = router