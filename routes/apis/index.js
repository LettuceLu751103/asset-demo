
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
const { getOffset, getPagination } = require('../../helpers/pagination-helper')
// connect to db
const db = require('../../models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office
const Gatepass = db.Gatepass
const Status = db.Status
const User = db.User
const Userstatus = db.Userstatus
const passport = require('passport')
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

// create office API
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

// 獲取特定 offices 資料 API
router.get('/offices/:id', (req, res) => {
    console.log('收到 qrcode 查詢單個資產')
    Office.findByPk(req.params.id, {
        raw: true
    })
        .then(office => {
            if (office) {
                message = `有查到辦公室資料`
            } else {
                message = `沒有查到辦公室資料`
            }
            res.json({ status: 'ok', message: message, response: office })
        })
        .catch(err => {
            console.log(err)

        })
})

// 修改特定 offices 資產 API - 未完成
router.post('/offices/edit', (req, res) => {
    const officeId = req.body.id
    const name = req.body.name
    const Description = req.body.Description
    Office.findByPk(officeId)
        .then(office => {
            if (office) {
                return office.update({
                    name: name,
                    Description: Description
                }).then(() => {
                    res.json(res.json({ status: 'ok', message: '已成功修改' }))
                })

            } else {
                res.json(res.json({ status: 'Fail', message: '沒有查詢到辦公室' }))
            }
        })
        .catch(err => {
            console.log(err)
        })

})


// 獲取特定 officeAssets 資產 API
router.get('/officeAssets/:id', (req, res) => {
    console.log('收到 qrcode 查詢單個資產')
    const assetId = req.params.id
    Asset.findByPk(assetId, {
        include: [
            Office,
            Category,
            Status
        ]
    }).then(asset => {
        console.log(asset)
        if (asset) {
            message = `有查到資產資料`
        } else {

            message = `沒有查到資產資料`
        }
        res.json({ status: 200, message: message, response: asset })
    }).catch(err => {
        console.log(err)
    })
})

// 修改特定 officeAssets 資產 API - 未完成
router.post('/officeAssets/edit', upload.single('image'), (req, res) => {
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

// 創建新的 officeAssets 資產 API - 未完成
router.post('/officeAssets/create', upload.single('image'), (req, res) => {
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

// 判斷 officeAsset 是否已在移轉中 API 
router.get('/officeAssets/isTransfer', (req, res) => {
    console.log('確認資產是否已在移轉中?')
    console.log(req.body)
    const assetId = req.body.assetId
    // 判斷是否資產不為移轉中
    // 判斷是否有移轉紀錄 gpId:xxx, assetId:xxx, received:0
    Asset.findByPk(assetId, { raw: true })
        .then(asset => {
            console.log(asset.status_id)
            if (asset.status_id === 3) {
                return res.json({ status: 'Fail', message: '該資產已在移轉中, 無法加入 gatepass', isTransfer: true })
            } else if (asset.status_id === 5) {
                return res.json({ status: 'Fail', message: '該資產在撿貨中, 無法加入 gatepass', isTransfer: true })
            } else {
                return res.json({ status: 'ok', message: '可以加入 gatepass', isTransfer: false, data: asset })
            }
        })
        .catch(err => {
            console.log(err)
        })
})

// 將 officeAsset & transfer & gatepass 狀態修改為撿貨中
router.post('/officeAssets/to/pickup', (req, res) => {
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

// 將 officeAsset & transfer & gatepass 狀態修改為移轉中
// Asset 加入 gatepass & modify Asset status & create Transfer V3
router.post('/officeAssets/to/transfer', (req, res) => {
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

// 掃描 qrcode , 單個資產到貨 API
router.post('/officeAssets/received', (req, res) => {
    console.log('呼叫單個資產到貨 API')
    console.log(req.body)
    const AssetId = req.body.assetId
    const GatepassId = req.body.gatepassId
    if (AssetId) {
        console.log('掃描進來的qrcode為Asset')
        // 判斷資產是否已接收狀態
        Promise.all([Asset.findByPk(AssetId, { where: { statusId: 3 } }), Transfer.findOne({ where: { AssetId, received: 0 } })])
            .then(([asset, transfer]) => {
                if (asset && transfer) {
                    console.log('資產以及transfer狀態都是移轉狀態')
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
                                        status: 'ok',
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
                                        status: 'ok',
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
                    res.json({ status: 'ok', message: '已到貨, 不需要再掃描' })
                }
            })
        // 如果已接收, 不做動作返回前端
        // 如果未接收, 更改動作, 修改所有數值
    } else if (GatepassId) {
        console.log('掃描進來的qrcode為Gatepass')
        res.json({ status: 'ok', message: '請單個進行掃描QR code到貨' })
    }
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


// 查詢資產所有狀態訊息 Status API
router.get('/status', (req, res) => {
    Status.findAll({ raw: true })
        .then(statuses => {
            // console.log('收到查詢category 請求')
            res.json({ status: 'ok', message: '獲得資產狀態列表', response: statuses })
        })
        .catch(err => {
            console.log(err)
        })
})

// 獲取個別使用者訊息 user API
router.get('/users/:id', (req, res) => {
    console.log('呼叫獲取個別使用者訊息 user API')
    User.findByPk(req.params.id)
        .then(user => {
            console.log(user)
            res.json({ status: 'ok', message: '成功獲得個別使用者列表', data: user })
        })
        .catch(err => {
            console.log(err)
        })
})

// 修改個別使用者訊息 user API - 未完成
router.post('/users/edit', (req, res) => {
    console.log('呼叫修改個別使用者訊息 user API')
    User.findByPk(req.body.id)
        .then(user => {
            console.log(user)
            res.json({ status: 'ok', message: '成功獲得個別使用者列表', data: user })
        })
        .catch(err => {
            console.log(err)
        })
})

// 獲取所有使用者訊息 users API - 完成
router.get('/users', (req, res) => {
    console.log('呼叫獲取所有使用者訊息 users API')
    User.findAll({
        raw: true,
        nest: true,
        include: [
            { model: Userstatus }
        ]
    })
        .then(users => {
            res.json({ status: 'ok', message: '成功獲得使用者列表', data: users })
        })
        .catch(err => {
            console.log(err)
        })
})

// 註冊使用者 user API - 完成
router.post('/users/register', (req, res) => {
    let { name, password, enabled, userstatus_id } = req.body
    User.findAll({ where: { name } })
        .then(user => {
            if (user.length > 0) {
                return res.json({ status: 'error', message: `${name} 已經註冊過, 使用者建立失敗`, data: user })
            }
            password = password.trim()
            if (password.length < 8) {
                return res.json({ status: 'error', message: `密碼小於8碼, 使用者建立失敗` })
            }
            return bcrypt
                .genSalt(10) // 產生「鹽」，並設定複雜度係數為 10
                .then(salt => bcrypt.hash(password, salt)) // 為使用者密碼「加鹽」，產生雜湊值
                .then(hash => User.create({
                    name,
                    enabled,
                    userstatus_id,
                    password: hash // 用雜湊值取代原本的使用者密碼
                }))
                .then((createdUser) => res.json({ status: 'ok', message: '成功建立使用者', data: createdUser }))
                .catch(err => console.log(err))
        })
})

// 使用者驗證 user API - 未完成
router.post('/users/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login'
}), (req, res) => {
    console.log(req.body)
})

// 使用者登出 user API
router.get('/users/logout', (req, res) => {
    req.logout()
    res.redirect('/users/login')
})

// 獲取使用者狀態列表 API
router.get('/userstatus', (req, res) => {
    Userstatus.findAll({
        raw: true,
    })
        .then(userstatus => {
            res.json({ status: 'ok', message: '成功獲得使用者狀態列表', data: userstatus })
        })
        .catch(err => {
            console.log(err)
        })
})




module.exports = router