const Router = require('koa-router')
const { getCategory, getBlog, getComm, getReply, getTopics, addComm, toggleUpvote, toggleColle, removeBlog, removeComm, removeReply } = require('../controller/blog.controller')
const { hasLogin, forceLogin } = require('../middleware/token.middleware')
const { hasToken } = require('../util/token')

const router = new Router({ prefix: '/index/home' })

router.post('/get_category', hasLogin, getCategory)
router.post('/get_blog/:name/:val', hasLogin, getBlog)
router.post('/get_comm/:name/:val', hasLogin, getComm)
router.post('/get_reply/:name/:val', hasLogin, getReply)
router.get('/get_topics', hasLogin, getTopics)
router.post('/add_comm', forceLogin, addComm)
router.post('/toggle_upvote/:name/:val', forceLogin, toggleUpvote)
router.post('/toggle_colle/:name/:val', forceLogin, toggleColle)
router.post('/remove_blog/:name/:val', forceLogin, removeBlog)
router.post('/remove_comm/:name/:val', forceLogin, removeComm)
router.post('/remove_reply/:name/:val', forceLogin, removeReply)

module.exports = router
