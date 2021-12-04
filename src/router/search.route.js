const Router = require('koa-router')
const { getArticleCategory, getArticle, addArticle, getTheArticle } = require('../controller/article.controller')
const { getAteBlog, getMsgCnt, getCommMe, getUpvoteMe, readMsg, readAllMsg } = require('../controller/msg.controller')
const { advancedSearch, advancedSearchCount } = require('../controller/search.controller')
const { hasLogin, forceLogin } = require('../middleware/token.middleware')

const router = new Router({ prefix: '/index/home' })

router.post('/advanced_search', hasLogin, advancedSearch)
router.post('/advanced_search_count', hasLogin, advancedSearchCount)

module.exports = router
