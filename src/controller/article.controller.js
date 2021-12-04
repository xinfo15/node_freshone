const { literal } = require('sequelize')
const { notDel, getColumns, order } = require('../util/sql')

const { success, error, COMMEN_ERROR, MISSING_PARAM, MISSING_TOKEN } = require('../util/response')
const { phpUrlParams } = require('../util/request')

const Cate = require('../model/category.model')
const Follow = require('../model/follow.model')
const Blog = require('../model/blog.model')
const User = require('../model/user.model')
const Image = require('../model/image.model')
const Comm = require('../model/comm.model')
const Upvote = require('../model/upvote.model')
const Colle = require('../model/colle.model')
const Reply = require('../model/reply.model')
const Topic = require('../model/topic.model')

const { findOneUser } = require('../service/user.service')
const { findAllBlog } = require('../service/blog.service')
const { BLOG_LIMIT, ARTICLE_TYPE } = require('../config/config.runtime')
const { getBlog, getCategory, getTheBlog, getReleaseBlogCate } = require('./blog.controller')

class ArticleController {
  async getArticleCategory(ctx, next) {
    await getCategory(ctx, next, ARTICLE_TYPE)
  }

  async getReleaseArtCate(ctx, next) {
    await getReleaseBlogCate(ctx, next, ARTICLE_TYPE)
  }

  async getArticle(ctx, next) {
    ctx.request.url = ctx.request.url.replace('/index/home/get_article/', '')

    await getBlog(ctx, next, ARTICLE_TYPE)
  }

  async addArticle(ctx, next) {
    const { user_info } = ctx
    let user_id
    user_id = user_info.user_id

    let { article_content, category_id, main_describe, cover, title } = ctx.request.body
    // 1 表示文章
    const type = 1

    if (!article_content) return (ctx.body = error(MISSING_PARAM, '缺少参数article_content'))
    if (!category_id) return (ctx.body = error(MISSING_PARAM, '缺少参数category_id'))
    if (!main_describe) return (ctx.body = error(MISSING_PARAM, '缺少参数main_describe'))
    if (!title) return (ctx.body = error(MISSING_PARAM, '缺少参数title'))

    cover = cover ? cover : null

    try {
      await User.update(
        { blog_count_limit: literal('blog_count_limit-1') },
        {
          where: {
            user_id,
          },
        }
      )
    } catch (err) {
      return (ctx.body = error(COMMEN_ERROR, '减少发布文章次数失败' + err))
    }

    try {
      const res = await Blog.create({
        user_id,
        char_content: article_content,
        category_id,
        main_describe,
        cover,
        title,
        type,
      })
      ctx.body = success(res, '发布文章成功')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '发布文章失败' + err)
    }
  }

  async getTheArticle(ctx, next) {
    ctx.request.url = ctx.request.url.replace('/index/home/get_the_article/', '')
    await getTheBlog(ctx, next, ARTICLE_TYPE)
  }
}

module.exports = new ArticleController()
