const Router = require('koa-router')
const { getCategory, getBlog, getComm, getReply, getTopics, addComm, toggleUpvote, toggleColle, removeBlog, removeComm, removeReply } = require('../controller/blog.controller')
const { updateUinfo } = require('../controller/profile.controller')
const { getSpaceUinfo, getSpaceInfo, toggleFollow } = require('../controller/space.controller')
const { hasLogin, forceLogin } = require('../middleware/token.middleware')
const { hasToken } = require('../util/token')

const router = new Router({ prefix: '/index/home' })

router.post('/get_space_uinfo', hasLogin, getSpaceUinfo)
router.post('/get_space_info/:name/:val', hasLogin, getSpaceInfo)
router.post('/toggle_follow', forceLogin, toggleFollow)

module.exports = router
