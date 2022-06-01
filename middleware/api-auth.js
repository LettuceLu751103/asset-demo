const passport = require('passport') // 引入 passport
console.log('呼叫api-auth.js')
const authenticated = passport.authenticate('jwt', { session: false })
const authenticatedAdmin = (req, res, next) => {
    if (req.user && (req.user.userstatus_id === 1 || req.user.userstatus_id === 2)) return next()
    return res.status(403).json({ status: 'error', message: 'permission denied' })
}
module.exports = {
    authenticated,
    authenticatedAdmin
}