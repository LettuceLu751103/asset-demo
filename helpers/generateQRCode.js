var QRCode = require('qrcode')

const genQR = (data) => {
    console.log('呼叫 generateQRCode function : ')
    // console.log(data)
    return QRCode.toDataURL(`http://10.4.100.241:3000/editAssets/${data}`, function (err, url) {
        return url
    })
}

module.exports = {
    genQR
}