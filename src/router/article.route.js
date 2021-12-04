const Router = require("koa-router");
const { getArticleCategory, getArticle, addArticle, getTheArticle, getReleaseArtCate } = require("../controller/article.controller");
const { hasLogin, forceLogin } = require("../middleware/token.middleware");

const router = new Router({ prefix: '/index/home' })

router.post('/get_article_category', hasLogin, getArticleCategory)
router.get('/get_article_categories', hasLogin, getReleaseArtCate)
router.post('/get_article/:name/:val', hasLogin, getArticle)
router.post('/add_article', forceLogin, addArticle)
router.post('/get_the_article/:name/:val', hasLogin, getTheArticle)

module.exports = router