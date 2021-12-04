const Router = require('koa-router')
const { getCategory, getBlog, getComm, getReply, getTopics, addComm, toggleUpvote, toggleColle, removeBlog, removeComm, removeReply } = require('../controller/blog.controller')
const { updateUinfo, addAvatar } = require('../controller/profile.controller')
const { getSpaceUinfo, getSpaceInfo, toggleFollow } = require('../controller/space.controller')
const { hasLogin, forceLogin } = require('../middleware/token.middleware')
const { hasToken } = require('../util/token')

const router = new Router({ prefix: '/index/home' })


router.post('/update_uinfo', forceLogin, updateUinfo)
router.post('/add_avatar', forceLogin, addAvatar)

module.exports = router