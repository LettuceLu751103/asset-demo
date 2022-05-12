var QRCode = require('qrcode')
// connect to db
const db = require('./models')
const Category = db.Category
const Asset = db.Asset
const Office = db.Office

let returnCode = []
async function genQR(data) {

    Promise.all([
        Asset.findAndCountAll({ raw: true })
    ]).then(([assets]) => {
        // console.log(assets.rows)
    }).catch(err => {

    })
    await QRCode.toDataURL(`http://10.4.100.241:3000/editAssets/${data}`)
        .then(url => {
            // console.log(url)
            returnCode.push(url)
        }).catch(err => {
            console.log(err)
        })
    return returnCode
}

console.log(genQR(1))

