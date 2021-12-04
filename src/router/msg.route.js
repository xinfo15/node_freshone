const Router = require("koa-router");
const { getArticleCategory, getArticle, addArticle, getTheArticle } = require("../controller/article.controller");
const { getAteBlog, getMsgCnt, getCommMe, getUpvoteMe, readMsg, readAllMsg } = require("../controller/msg.controller");
const { hasLogin, forceLogin } = require("../middleware/token.middleware");

const router = new Router({ prefix: '/index/home' })

router.post('/get_ate_blog', forceLogin, getAteBlog)
router.post('/get_msg_cnt', forceLogin, getMsgCnt)
router.post('/get_comm_me', forceLogin, getCommMe)
router.post('/get_upvote_me', forceLogin, getUpvoteMe)
router.post('/read_msg', forceLogin, readMsg)
router.post('/read_all_msg', forceLogin, readAllMsg)

module.exports = router