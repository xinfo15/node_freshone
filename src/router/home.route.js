const Router = require('koa-router')
const { verifyToken } = require('../middleware/token.middleware')

const router = new Router({ prefix: '/index/home' })

module.exports = router
