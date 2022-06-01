const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const passportJWT = require('passport-jwt') //新增這行，引入 passport-jwt
const db = require('../models')
const User = db.User
const Userstatus = db.Userstatus
const bcrypt = require('bcryptjs')
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
console.log('呼叫 passport')

module.exports = app => {

    // 設定本地登入策略
    passport.use(new LocalStrategy({ usernameField: 'name', passwordField: 'password', passReqToCallback: true }, (req, name, password, cb) => {
        User.findOne({ where: { name: name } })
            .then(user => {
                console.log('進行 passport authentication')
                // console.log(password)
                // console.log(user.password)
                if (!user) return cb(null, false)
                bcrypt.compare(password, user.password).then(res => {
                    if (!res) return cb(null, false)
                    return cb(null, user)
                })
            })
            .catch(err => {
                console.log(err)
            })

    }))

    // 設定 JWT 登入策略
    const jwtOptions = {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    }
    passport.use(new JWTStrategy(jwtOptions, (jwtPayload, cb) => {
        console.log('呼叫 passport-jwt')
        User.findByPk(jwtPayload.id, {
            include: [
                { model: Userstatus }
            ]
        })
            .then(user => cb(null, user))
            .catch(err => cb(err))
    }))


    // 設定序列化與反序列化
    passport.serializeUser((user, cb) => {
        cb(null, user.id)
    })
    passport.deserializeUser((id, cb) => {
        User.findByPk(id)
            .then(user => {
                console.log(user)
                return cb(null, user)
            })
            .catch(err => cb(err, null))
    })


}