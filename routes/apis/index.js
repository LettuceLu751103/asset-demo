
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
const fs = require('fs')
const { getOffset, getPagination } = require('../../helpers/pagination-helper')
const { Op } = require('sequelize')
// connect to db
const db = require('../../models')
const Category = db.Category
const Secondcategory = db.Secondcategory
const Asset = db.Asset
const Office = db.Office
const Gatepass = db.Gatepass
const Status = db.Status
const User = db.User
const Transfer = db.Transfer
const Userstatus = db.Userstatus
const Shiftpost = db.Shiftpost
const Shift = db.Shift
const Image = db.Image
const Grading = db.Grading
const Bulletincategory = db.Bulletincategory
const Bulletinsecondcategory = db.Bulletinsecondcategory
const Bulletin = db.Bulletin
const userController = require('../../controllers/apis/user-controller')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth') // 新增這裡
const passport = require('passport')
const jwt = require('jsonwebtoken')
// QR code
var QRCode = require('qrcode')
const { ok } = require('assert')
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


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
    console.log(req.body)
    console.log(' ===== 呼叫創建辦公室 API ===== ')
    console.log('name: ' + name)
    console.log('Description: ' + Description)
    console.log(' ===== 呼叫創建辦公室 API ===== ')
    if (name) {
        Office.findOne({
            where: {
                name: req.body.name
            }
        })
            .then(val => {
                if (val) {  // 如果資料庫找到, 不新增辦公室
                    res.json({ status: 'error', data: '資料庫已有相同 name 的辦公室' })
                } else {  // 如果資料庫沒找到, 新增辦公室
                    return Office.create({
                        name,
                        Description
                    })
                        .then(office => {
                            // req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
                            res.json({ status: 'ok', data: `成功創建辦公室 ${office.name}` })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                }
            })
            .catch(err => {
                console.log(err)
            })
    } else {
        res.json({ status: 'error', data: '辦公室 name 異常' })
    }

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




// 修改特定 officeAssets 資產 API - 完成
router.post('/officeAssets/update', upload.single('image'), (req, res) => {
    console.log('======= 呼叫修改資產 officeAssets API =======')
    console.log(req.body)
    console.log(req.file)
    console.log('======= 呼叫修改資產 officeAssets API =======')
    const assetId = Number(req.body.assetId)
    const { file } = req
    const { name, Vendor, Model, Description, categoryId, officeId, statusId, secondcategoryId, sn, pn, updateduser } = req.body

    if (assetId && name && Vendor && Model && Description && categoryId && officeId && statusId && updateduser) {
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
                                secondcategoryId,
                                name,
                                Vendor,
                                sn,
                                pn,
                                Model,
                                officeId,
                                Description,
                                image: file ? `/upload/${file.originalname}` : null,
                                updateduser,
                            }).then(asset => {
                                console.log('==== 更改完的資料 ====')
                                console.log(assetId)
                                console.log(file.originalname)
                                fs.renameSync(`./upload/${file.originalname}`, `./upload/${assetId}-${file.originalname
                                    }`, function (err) {
                                        if (err) throw err;
                                        console.log('File Renamed.');
                                    });
                                asset.update({
                                    image: file ? `/upload/${assetId}-${file.originalname
                                        }` : null
                                })
                                console.log('==== 更改完的資料 ====')
                                res.json({ status: 'ok', message: '成功修改資產資料, 使用新的圖片', data: asset })
                            })
                        })
                })
            })
        } else {
            console.log('沒有收到圖片, 用舊有的圖片, 修改資料')
            return Asset.findByPk(assetId)
                .then(asset => {
                    return asset.update({
                        name,
                        Vendor,
                        sn,
                        pn,
                        Model,
                        Description,
                        categoryId: categoryId,
                        secondcategoryId,
                        status_id: statusId,
                        office_id: officeId,
                        updateduser,
                    })
                })
                .then((asset) => {
                    res.json({ status: 'ok', message: '成功修改資產資料, 使用原先的圖片', data: asset })
                })
                .catch(err => {
                    console.log(err)
                })
        }
    } else {
        res.json({ status: 'error', message: '資料不齊全, 請重新發送', data: req.body })
    }
})

// 獲取特定 officeAssets 資產 API
router.get('/officeAssets/:id', (req, res) => {
    console.log('收到 qrcode 查詢單個資產')
    const assetId = req.params.id
    Asset.findByPk(assetId, {
        include: [
            Office,
            Category,
            Status,
            Secondcategory,
        ]
    }).then(asset => {
        console.log(asset.toJSON())
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

// 獲取所有 officeAssets 資產 API
router.get('/officeAssets', (req, res) => {
    console.log('收到 API 請求資產資料')
    // define default data limit
    const DEFAULT_LIMIT = 10
    const officeId = Number(req.query.officeId)
    const categoryId = Number(req.query.categoryId)
    let Vendor = req.query.Vendor
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    let name = req.query.name
    const offset = getOffset(limit, page)
    if (name) {
        name = { [Op.like]: '%' + name + '%' }
    }
    if (Vendor) {
        Vendor = { [Op.like]: '%' + Vendor + '%' }
    }
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
            include: [Category, Office, Status, Secondcategory],
            where: {
                ...officeId ? { officeId } : {},
                ...name ? { name } : {},
                ...Vendor ? { Vendor } : {},
                ...categoryId ? { categoryId } : {}
            },
            order: [
                ['updated_at', 'DESC']
            ],
            // limit,
            offset
        }),
        Category.findAll({ raw: true }),
        Office.findAll({ raw: true }),
        Status.findAll({ raw: true }),
    ]).then(([assets, category, office, status, secondcategory]) => {
        // console.log(assets)
        assets.rows.forEach(item => {
            QRCode.toDataURL(`https://mxitweb.lettucelu.com/editAssets/${item.id}`, function (err, url) {
                item.qrcode = url
            })
        })
        res.json({ assetsCount: assets.count, assets: assets.rows, pagination: getPagination(limit, page, assets.count), category, office, status, secondcategory })
    }).catch(err => {
        console.log(err)
    })

})

// 創建新的 officeAssets 資產 API - 完成
router.post('/officeAssets/create', upload.single('image'), (req, res) => {
    console.log('======= 呼叫創建新資產 officeAssets API =======')
    // console.log(req.user.dataValues.name)
    console.log(req.body)
    console.log(req.file)
    console.log('======= 呼叫創建新資產 officeAssets API =======')
    const { file } = req
    const { name, Vendor, Model, Description, sn, pn } = req.body
    const Quantity = 1
    const categoryId = req.body.categoryId
    const secondcategoryId = req.body.secondcategoryId
    const officeId = req.body.officeId
    const statusId = req.body.statusId
    const createduser = req.body.createduser || 'null'
    // const createduser = req.user.dataValues.name || 'null'

    if (createduser === 'null') {
        res.json({ status: 'error', message: '請進行登入後, 再輸入資產資料' })
    }
    if (file) {
        console.log('傳入的檔案有圖片, 需要進行檔案處理')
        fs.readFile(file.path, (err, data) => {
            if (err) console.log('Error: ', err)
            fs.writeFile(`./upload/${file.originalname}`, data, () => {
                return Asset.create({
                    statusId,
                    categoryId,
                    secondcategoryId,
                    name,
                    Vendor,
                    sn,
                    pn,
                    Model,
                    Quantity,
                    officeId,
                    Description,
                    image: file ? `/upload/${file.originalname}` : null,
                    createduser
                }).then((asset) => {
                    console.log('==== 產生 asset qrcode 並存入 DB ====')

                    const assetId = asset.dataValues.id
                    console.log('assetId: ' + assetId)
                    console.log('file.originalname: ' + file.originalname)
                    const newImageName = assetId + '-' + file.originalname
                    fs.renameSync(`./upload/${file.originalname}`, `./upload/${newImageName}`, function (err) {
                        if (err) throw err;
                        console.log('File Renamed.');
                    });
                    const qrcodeContent = `https://mxitweb.lettucelu.com/scanqrcode?package=0&assetId=${assetId}`
                    const qrcode = `/images/qrcode/assets/${assetId}.png`
                    // 針對 asset 產生專屬 QR code
                    QRCode.toFile(`./public/images/qrcode/assets/${assetId}.png`, qrcodeContent, {
                        color: {
                            dark: '#00F',  // Blue dots
                            light: '#0000' // Transparent background
                        }
                    }, function (err, success) {
                        if (err) throw err
                        // console.log(success)
                    })
                    // 將 asset qrcode path 存入 DB
                    Asset.findByPk(assetId)
                        .then(asset => {
                            return asset.update({
                                qrcode,
                                image: file ? `/upload/${newImageName}` : null
                            })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                    console.log('==== 產生 asset qrcode 並存入 DB ====')
                    // req.flash('success_messages', 'restaurant was successfully created')
                    res.json({ status: 'ok', message: '新增有圖片的資產, 成功創建', data: asset })
                })
            })
        })
    } else {
        console.log('傳入的檔案沒有圖片')
        console.log(req.body)
        if (!createduser) {
            console.log('without username')
        }

        Asset.create({
            statusId,
            categoryId,
            secondcategoryId,
            name,
            Vendor,
            sn,
            pn,
            Model,
            Quantity,
            officeId,
            Description,
            createduser,
        }).then((asset) => {
            console.log('==== 產生 asset qrcode 並存入 DB ====')
            const assetId = asset.dataValues.id
            const qrcodeContent = `https://mxitweb.lettucelu.com/scanqrcode?package=0&assetId=${assetId}`
            const qrcode = `/images/qrcode/assets/${assetId}.png`
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
            res.json({ status: 'ok', message: '新增使用預設圖片的資產, 成功創建', data: asset })
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
            QRCode.toDataURL(`https://mxitweb.lettucelu.com/scanqrcode?package=1&gatepassId=${item.id}`, function (err, url) {
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

            const qrcodeContent = `https://mxitweb.lettucelu.com/scanqrcode?package=1&gatepassId=${gp.id}`
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


// 查詢資產所有狀態訊息 Status API - 完成
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

// get current login user
router.get('/users/currentuser', authenticated, (req, res) => {
    User.findByPk(req.user.id)
        .then(user => {
            console.log(user)
            res.json({ status: 'ok', message: '成功獲得current使用者列表', data: user })
        })
        .catch(err => {
            console.log(err)
        })
})


// 獲取個別使用者訊息 user API - 完成
router.get('/users/:id', authenticated, (req, res) => {
    console.log('呼叫獲取個別使用者訊息 user API')
    console.log(typeof req.user.id)
    console.log(typeof req.params.id)

    User.findByPk(req.params.id)
        .then(user => {
            // console.log(user)
            res.json({ status: 'ok', message: '成功獲得個別使用者列表', data: user })
        })
        .catch(err => {
            console.log(err)
        })


})



// 修改個別使用者訊息 user API - 完成
router.post('/users/edit', (req, res) => {
    console.log('呼叫修改個別使用者訊息 user API')
    const { id, name, password, enabled, userstatus_id } = req.body
    User.findByPk(id)
        .then(user => {
            // console.log(user)
            if (user) {
                console.log('有找到使用者, 準備修改資料')
                return bcrypt
                    .genSalt(10)
                    .then(salt => bcrypt.hash(password, salt))
                    .then(hash => user.update({
                        name,
                        enabled,
                        userstatus_id,
                        password: hash
                    }))
                    .then((userUpdate) => {
                        return res.json({ status: 'ok', message: '成功修改使用者資料', data: userUpdate })
                    })

            } else {
                return res.json({ status: 'error', message: '沒有當前使用者, 無法進行修改' })
            }

        })
        .catch(err => {
            console.log(err)
        })
})

// 獲取所有使用者訊息 users API - 完成
router.get('/users', authenticated, (req, res) => {
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

// 使用者驗證 user API - 完成
router.post('/users/login', passport.authenticate('local', { session: false }), userController.login)



// 獲取使用者狀態列表 API - 完成
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

// 整包 gatepass 到貨 API
router.post('/api/gatepass/received', (req, res) => {
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


router.get('/secondcategories', (req, res) => {
    console.log('請求獲取次類別資料')
    Secondcategory.findAll({ raw: true, nest: true })
        .then(secondcategory => {
            if (secondcategory.length > 0) {
                res.json({ status: 'ok', message: '成功抓取所有次類別資料', data: secondcategory })
            } else {
                res.json({ status: 'error', message: '當前次類別沒有資料', data: secondcategory })
            }
        })
        .catch(err => {
            console.log(err)
        })
})

router.get('/secondcategories/:id', (req, res) => {
    console.log('請求獲取次類別資料')
    const id = req.params.id
    Secondcategory.findByPk(id, { raw: true, nest: true })
        .then(secondcategory => {
            console.log(secondcategory)
            if (secondcategory) {
                res.json({ status: 'ok', message: '成功獲取次類別資料', data: secondcategory })
            } else {
                res.json({ status: 'error', message: '資料庫查詢不到該id之次類別名稱' })
            }
        })
        .catch(err => {
            console.log(err)
        })
})

router.post('/secondcategories', (req, res) => {
    const { name, Description } = req.body
    if (name) {
        Secondcategory.findOne({ where: { name } })
            .then(secondcategory => {
                if (secondcategory) {
                    res.json({ status: 'error', message: '資料庫已有相同次類別名稱' })
                } else {
                    return Secondcategory.create({
                        name,
                        Description
                    }).then(secondcategory => {
                        res.json({ status: 'ok', message: '成功寫入次類別資料', data: secondcategory })
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })

    } else {
        console.log('收到寫入次類別資料不齊全')
        res.json({ status: 'error', message: '寫入次類別資料不齊全' })
    }

})

// 修改特定 offices 資產 API - 未完成
router.post('/secondcategories/update', (req, res) => {
    const secondcategoryId = req.body.id
    const name = req.body.name
    const Description = req.body.Description
    Secondcategory.findByPk(secondcategoryId)
        .then(secondcategory => {
            if (secondcategory) {
                return secondcategory.update({
                    name: name,
                    Description: Description
                }).then((secondcategory) => {
                    res.json({ status: 'ok', message: '已成功修改', data: secondcategory })
                })

            } else {
                res.json({ status: 'Fail', message: '沒有查詢到次類別' })
            }
        })
        .catch(err => {
            console.log(err)
        })
})




// 獲取所有值班日誌 API  - 尚有分頁待完成
router.get('/shiftpost', (req, res) => {
    Shiftpost.findAll({
        raw: true,
        nest: true,
        include: [Shift],
        attributes: ['id', 'posttitle', 'poster', 'postcontent', 'createdAt', 'updatedAt', 'isdeleted'],
        order: [['createdAt', 'DESC'],]
    })
        .then(shiftpost => {
            console.log(shiftpost)
            res.json({ status: 'ok', message: '成功獲得所有值班日誌', data: shiftpost })
        })
        .catch(err => {
            console.log(err)
        })
})


// 上傳值班日誌圖片 API - 完成
router.post('/shiftpost/images/upload', upload.single('image'), (req, res) => {
    const { file } = req
    if (file) {
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
                    return res.json({ status: 'ok', message: '成功上傳圖片', url: image.filepath })
                })
            })
        })
    }
})

// 獲取特定值班日誌 API - 完成
router.get('/shiftpost/:id', (req, res) => {
    const id = req.params.id
    Shiftpost.findByPk(id, { nest: true, raw: true, include: [Shift] })
        .then(shiftpost => {
            console.log(shiftpost)
            res.json({ status: 'ok', message: '成功獲得單篇值班日誌資料', data: shiftpost })
        })
        .catch(err => {
            console.log(err)
        })
})

// 新增值班日誌 API - 完成
router.post('/shiftpost', upload.single('image'), (req, res) => {
    const { posttitle, poster, postcontent, shift_id } = req.body
    Shiftpost.create({
        posttitle,
        poster,
        postcontent,
        shift_id
    })
        .then(shiftpost => {
            res.json({ status: 'ok', message: '成功新增值班日誌', data: shiftpost })
        })
        .catch(err => {
            console.log(err)
        })
})


// 更新值班日誌 API 
router.post('/shiftpost/:id/update', upload.single('image'), (req, res) => {
    console.log('進到修改日誌API')
    const id = req.params.id
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
                    res.json({ status: 'ok', message: '成功更改值班日誌內容', data: updateShiftpost })
                })
        })
        .catch(err => {
            console.log(err)
        })
})


// 刪除值班日誌 API - 完成
router.post('/shiftpost/:id/delete', upload.single('image'), (req, res) => {
    console.log('進到刪除日誌API')
    const id = req.params.id
    Shiftpost.findByPk(id)
        .then(shiftpost => {
            return shiftpost.update({
                isdeleted: true
            })
                .then(updateShiftpost => {
                    res.json({ status: 'ok', message: '成功刪除值班日誌', data: updateShiftpost })
                })
        })
        .catch(err => {
            console.log(err)
        })
})


// 查詢公告欄 API - 完成
router.get('/bulletin', authenticated, (req, res) => {
    Bulletin.findAll({
        raw: true, nest: true, include: [
            Bulletincategory,
            Bulletinsecondcategory,
            Grading,
        ],
        order: [['updatedAt', 'DESC'],]
    })
        .then(bulletin => {
            res.json({ status: 'ok', message: '成功查詢所有公告欄資料', data: bulletin })
        })
        .catch(err => {
            res.json({ status: 'error', message: '查詢所有公告欄失敗', error_reson: err })
        })
})

// 查詢公告等級 API - 完成
router.get('/grading', (req, res) => {
    Grading.findAll({ raw: true, nest: true })
        .then(grading => {
            if (grading) {
                return res.json({ status: 'ok', message: '成功查詢所有公告等級', data: grading })
            } else {
                return res.json({ status: 'error', message: '沒有查詢到公告等級' })
            }
        })
        .catch(err => {
            res.json({ status: 'error', message: '查詢公告等級錯誤', error_reason: err })
        })
})

// 查詢公告類別 API - 完成
router.get('/bulletincategory', (req, res) => {
    Bulletincategory.findAll({ nest: true, include: [Bulletinsecondcategory] })
        .then(bulletincategory => {
            if (bulletincategory) {
                res.json({ status: 'ok', message: '成功查詢到所有公告類別', data: bulletincategory })
            } else {
                res.json({ status: 'error', message: '查詢所有公告類別失敗' })
            }
        })
        .catch(err => {
            res.json({ sttus: 'error', message: '查詢所有公告類別錯誤', error_reason: err })
        })
})

// 查詢公告次類別 API - 完成
router.get('/bulletinsecondcategory', (req, res) => {
    Bulletinsecondcategory.findAll({ raw: true, nest: true })
        .then(bulletinsecondcategory => {
            if (bulletinsecondcategory) {
                return res.json({ status: 'ok', message: '成功查詢所有公告次類別', data: bulletinsecondcategory })
            } else {
                return res.json({ status: 'error', message: '查詢所有公告次類別失敗' })
            }
        })
        .catch(err => {
            res.json({ status: 'err', message: '查詢所有公告次類別失敗', error_reson: err })
        })
})

// 創建公告等級 API - 完成
router.post('/grading/create', (req, res) => {
    console.log(req.body)
    const { name, Description } = req.body
    if (!name) {
        return res.json({ status: 'error', message: '公告等級不可為空' })
    }
    if (!name.trim()) {
        return res.json({ status: 'error', message: '公告等級不可為空' })
    }
    Grading.findOne({ where: { name: name } })
        .then(grading => {
            if (grading) {
                return res.json({ status: 'error', message: '創建失敗, 已有相同名稱的公告等級' })
            }
            return Grading.create({
                name,
                Description
            }).then(grading => {
                return res.json({ status: 'ok', message: '創建公告等級成功', data: grading })
            }).catch(err => {
                return res.json({ status: 'error', message: '創建公告等級錯誤', error_reason: err })
            })
        })
})

// 創建公告類別 - 完成
router.post('/bulletincategory/create', (req, res) => {
    console.log(req.body)
    const { name, Description } = req.body
    if (!name) {
        return res.json({ status: 'error', message: '公告類別不可為空' })
    }
    if (!name.trim()) {
        return res.json({ status: 'error', message: '公告類別不可為空' })
    }
    Bulletincategory.findOne({ where: { name: name } })
        .then(bulletincategory => {
            if (bulletincategory) {
                return res.json({ status: 'error', message: '公告類別名稱相同, 創建失敗' })
            }
            return Bulletincategory.create({
                name,
                Description
            }).then(bc => {
                console.log('創建公告類別成功')
                return res.json({ status: 'ok', message: '創建公告類別成功', data: bc })
            }).catch(err => {
                return res.json({ status: 'error', message: '創建公告類別失敗', error_reason: err })
            })
        })

})

// 創建公告次類別 - 完成
router.post('/bulletinsecondcategory/create', (req, res) => {
    const { bulletincategory_id, name, Description } = req.body
    if (!bulletincategory_id || !name) {
        return res.json({ status: 'error', message: '公告主類別或公告次類別為空' })
    }

    if (!bulletincategory_id.trim() || !name.trim()) {
        return res.json({ status: 'error', message: '公告主類別或公告次類別為空' })
    }

    if (typeof Number(bulletincategory_id) !== 'number') {
        return res.json({ status: 'error', message: '公告主類別需為整數' })
    }
    Bulletinsecondcategory.findOne({ where: { name: name } })
        .then(bulletinsecondcategory => {
            if (bulletinsecondcategory) {
                return res.json({ status: 'error', message: '次類別名稱重複, 新增失敗' })
            }
            Bulletinsecondcategory.create({
                name,
                Description,
                bulletincategory_id: Number(bulletincategory_id)
            }).then(bulletinsecondcategory => {
                return res.json({
                    status: 'ok', message: '新增公告次類別成功', data: bulletinsecondcategory
                })
            }).catch(err => {
                return res.json({ status: 'error', message: '新增次類別失敗', error_reason: err })
            })
        })
        .catch(err => {
            console.log(err)
        })
})

// 創建公告欄公告 - 完成
router.post('/bulletin/create', upload.single('image'), (req, res) => {
    console.log(req.body)
    const { posttitle, bulletincategoryId, bulletinsecondcategoryId, gradingId, poster, postcontent } = req.body
    if (!posttitle) {
        return res.json({ status: 'error', message: 'posttitle 不可為空' })
    } else if (!bulletincategoryId) {
        return res.json({ status: 'error', message: 'bulletincategoryId 不可為空' })
    } else if (!bulletinsecondcategoryId) {
        return res.json({ status: 'error', message: 'bulletinsecondcategoryId 不可為空' })
    } else if (!gradingId) {
        return res.json({ status: 'error', message: 'gradingId 不可為空' })
    } else if (!poster) {
        return res.json({ status: 'error', message: 'poster 不可為空' })
    } else if (!postcontent) {
        return res.json({ status: 'error', message: 'postcontent 不可為空' })
    }

    if (!posttitle.trim()) {
        return res.json({ status: 'error', message: 'posttitle 不可為空' })
    } else if (!bulletincategoryId.trim() || bulletincategoryId === '0') {
        return res.json({ status: 'error', message: 'bulletincategoryId 數值不正確' })
    } else if (!bulletinsecondcategoryId.trim()) {
        return res.json({ status: 'error', message: 'bulletinsecondcategoryId 數值不正確' })
    } else if (!gradingId.trim() || gradingId === '0') {
        return res.json({ status: 'error', message: 'gradingId 數值不正確' })
    } else if (!poster.trim()) {
        return res.json({ status: 'error', message: 'poster 不可為空' })
    } else if (!postcontent.trim()) {
        return res.json({ status: 'error', message: 'postcontent 不可為空' })
    } else {
        Bulletin.create({
            posttitle: posttitle.trim(),
            bulletincategory_id: Number(bulletincategoryId.trim()),
            bulletinsecondcategory_id: Number(bulletinsecondcategoryId.trim()),
            grading_id: Number(gradingId.trim()),
            poster: poster.trim(),
            postcontent: postcontent.trim()
        }).then(bulletin => {
            res.json({ status: 'ok', message: '成功建立公告', data: bulletin })
        }).catch(err => {
            res.json({ status: 'error', message: '建立公告錯誤', error_reason: err })
        })
    }

})

// 更改公告等級 API - 完成
router.put('/grading/:id/update', (req, res) => {
    let name = req.body.name
    const Description = req.body.Description
    const id = req.params.id
    if (!name) {
        return res.json({ status: 'error', messge: '公告等級名稱不可為空' })
    }
    name = name.trim()
    if (!name) {
        return res.json({ status: 'error', messge: '公告等級名稱不可為空' })
    }
    Grading.findByPk(id)
        .then(grading => {
            if (grading) {
                return grading.update({
                    name: name,
                    Description: Description
                }).then(gradingupdate => {
                    return res.json({ status: 'ok', message: '成功修改公告等級', data: gradingupdate })
                }).catch(err => {
                    return res.json({ status: 'error', message: '成功修改公告等級錯誤', error_reason: err })
                })
            } else {
                res.json({ status: 'error', message: '查詢不到, 無法修改此公告等級' })
            }

        })
        .catch(err => {
            console.log(err)
        })
})

// 更改公告類別 API - 完成
router.put('/bulletincategory/:id/update', (req, res) => {
    let name = req.body.name
    const Description = req.body.Description
    const id = req.params.id
    if (!name) {
        return res.json({ status: 'error', message: '公告類別不可以為空' })
    }
    name = name.trim()
    if (!name) {
        return res.json({ status: 'error', message: '公告類別不可以為空' })
    }

    Bulletincategory.findByPk(id)
        .then(bulletincategory => {
            if (bulletincategory) {
                return bulletincategory.update({
                    name,
                    Description
                }).then(bc => {
                    return res.json({ status: 'ok', message: '已成功修改公告類別', data: bc })
                })
            }
            return res.json({ status: 'error', message: '查詢不到, 無法修改此公告類別' })
        })
        .catch(err => {
            console.log(err)
        })
})

// 更改公告次類別 API - 完成
router.put('/bulletinsecondcategory/:id/update', (req, res) => {
    const Description = req.body.Description
    let name = req.body.name
    const id = req.params.id
    let bulletincategoryId = req.body.bulletincategoryId

    if (name === undefined) {
        return res.json({ status: 'error', message: '公告次類別 不可以為空' })
    } else if (bulletincategoryId === undefined) {
        return res.json({ status: 'error', message: '公告類別 id 不可為空' })
    }

    name = name.trim()
    bulletincategoryId = bulletincategoryId.trim()

    if (!name) {
        return res.json({ status: 'error', message: '公告次類別 不可以為空' })
    } else if (!bulletincategoryId) {
        return res.json({ status: 'error', message: '公告類別 id 不可為空' })
    }

    Bulletinsecondcategory.findByPk(id)
        .then(bulletinsecondcategory => {
            if (bulletinsecondcategory) {
                return bulletinsecondcategory.update({
                    name,
                    Description,
                    bulletincategoryId
                }).then(bsc => {
                    res.json({ status: 'ok', message: '成功修改公告次類別', data: bsc })
                }).catch(err => {
                    return res.json({ status: 'error', message: '修改公告次類別錯誤', error_reason: err })
                })
            }
            return res.json({ status: 'error', message: '查詢不到公告次類別, 無法修改' })
        })
        .catch(err => {
            return res.json({ status: 'error', message: '修改公告次類別錯誤', error_reason: err })
        })
})


// 更改公告 API - 完成
router.put('/bulletin/:id/update', upload.single('image'), (req, res) => {
    const id = req.params.id
    let posttitle = req.body.posttitle
    let bulletincategoryId = req.body.bulletincategoryId
    let bulletinsecondcategoryId = req.body.bulletinsecondcategoryId
    let gradingId = req.body.gradingId
    let poster = req.body.poster
    let postcontent = req.body.postcontent
    let isdeleted = req.body.isdeleted

    console.log(req.body)
    console.log(id)
    if (posttitle === undefined) {
        return res.json({ status: 'error', message: 'posttitle 標題不可為空' })
    } else if (bulletincategoryId === undefined) {
        return res.json({ status: 'error', message: 'bulletincategoryId 不可為空' })
    } else if (bulletinsecondcategoryId === undefined) {
        return res.json({ status: 'error', message: 'bulletinsecondcategoryId 不可為空' })
    } else if (gradingId === undefined) {
        return res.json({ status: 'error', message: 'gradingId 不可為空' })
    } else if (poster === undefined) {
        return res.json({ status: 'error', message: 'poster 不可為空' })
    } else if (postcontent === undefined) {
        return res.json({ status: 'error', message: 'postcontent 不可為空' })
    }

    posttitle = posttitle.trim()
    bulletincategoryId = bulletincategoryId.trim()
    bulletinsecondcategoryId = bulletinsecondcategoryId.trim()
    gradingId = gradingId.trim()
    poster = poster.trim()
    postcontent = postcontent.trim()

    if (!posttitle) {
        return res.json({ status: 'error', message: 'posttitle 標題不可為空' })
    } else if (!bulletincategoryId) {
        return res.json({ status: 'error', message: 'bulletincategoryId 不可為空' })
    } else if (!bulletinsecondcategoryId) {
        return res.json({ status: 'error', message: 'bulletinsecondcategoryId 不可為空' })
    } else if (!gradingId) {
        return res.json({ status: 'error', message: 'gradingId 不可為空' })
    } else if (!poster) {
        return res.json({ status: 'error', message: 'poster 不可為空' })
    } else if (!postcontent) {
        return res.json({ status: 'error', message: 'postcontent 不可為空' })
    } else {
        Bulletin.findByPk(id)
            .then(bulletin => {
                if (bulletin) {
                    return bulletin.update({
                        posttitle,
                        bulletincategoryId,
                        bulletinsecondcategoryId,
                        gradingId,
                        poster,
                        postcontent,
                        isdeleted
                    }).then(bulletin => {
                        return res.json({ status: 'ok', message: '修改 bulletin 資料成功', data: bulletin })
                    }).catch(err => {
                        return res.json({ status: 'error', message: '修改公告失敗', error_reason: err })
                    })
                }
                return res.json({ status: 'error', message: '查詢不到 bulletin 資料, 修改失敗' })
            })
            .catch(err => {
                return res.json({ status: 'error', message: '修改公告失敗', error_reason: err })
            })
    }

})


// 查詢單個公告等級 API - 未完成
router.get('/grading/:id', (req, res) => {

})
// 查詢單個公告類別 API - 未完成
router.get('/bulletincategory/:id', (req, res) => {

})
// 查詢單個公告次類別 API - 未完成
router.get('/bulletinsecondcategory/:id', (req, res) => {

})
// 查詢單個公告資料 API - 未完成
router.get('/bulletin/:id', (req, res) => {

})

module.exports = router