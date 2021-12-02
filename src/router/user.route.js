const Router = require('koa-router')
const { forceLogin } = require('../middleware/token.middleware')

const { getUserInfo, login, register, getFollowedUsers } = require('../controller/user.controller')
const { userExisted } = require('../middleware/user.middleware')

const router = new Router({ prefix: '/index/home' })

router.post('/get_uinfo', forceLogin, getUserInfo)
router.post('/login', login)
router.post('/register', userExisted, register)
router.post('/get_followed_users', forceLogin, getFollowedUsers)

module.exports = router
