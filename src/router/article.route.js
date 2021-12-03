const Router = require("koa-router");
const { getArticleCategory, getArticle, addArticle } = require("../controller/article.controller");
const { hasLogin, forceLogin } = require("../middleware/token.middleware");

const router = new Router({ prefix: '/index/home' })

router.post('/get_article_category', hasLogin, getArticleCategory)
router.post('/get_article/:name/:val', hasLogin, getArticle)
router.post('/add_article', forceLogin, addArticle)

module.exports = router