

console.log('呼叫 auth.js ')

module.exports = {
    authenticator: (req, res, next) => {
        // console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            return next()
        }
        res.json({ status: 'error', message: '登入失敗, 請重新認證' })
    }
}