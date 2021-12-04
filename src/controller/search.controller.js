const { notDel, getColumns, order, mapColumns } = require('../util/sql')

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

const { findOneUser, userAttr } = require('../service/user.service')
const { findAllBlog, handleBlogRes, handleCommRes } = require('../service/blog.service')
const { BLOG_LIMIT, BLOG_TYPE, ARTICLE_TYPE } = require('../config/config.runtime')
const { Op } = require('sequelize')

class SearchController {
  async advancedSearchCount(ctx, next) {
    const { search_value } = ctx.request.body
    if (!search_value) return (ctx.body = error(MISSING_PARAM, '缺少参数search_value'))

    try {
      let category_ids = await Cate.findAll({
        where: notDel({
          name: {
            [Op.like]: '%' + search_value + '%',
          },
        }),
        attributes: ['category_id'],
      })
      category_ids = mapColumns(category_ids, 'category_id')
      category_ids = category_ids || []

      const where = notDel({
        [Op.or]: [
          {
            char_content: {
              [Op.like]: '%' + search_value + '%',
            },
          },
          { category_id: category_ids },
        ],
      })

      Object.assign(where, { type: ARTICLE_TYPE })
      const article_count = await Blog.count({
        where,
      })

      Object.assign(where, { type: BLOG_TYPE })
      const blog_count = await Blog.count({
        where,
      })

      const user_count = await User.count({
        where: notDel({
          nickname: {
            [Op.like]: '%' + search_value + '%',
          },
        }),
      })

      const data = {
        article_count,
        blog_count,
        user_count,
      }

      ctx.body = success(data)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取搜索数量失败' + err)
    }
  }

  async advancedSearch(ctx, next) {
    const { user_info } = ctx
    let user_id
    if (user_info) user_id = user_info.user_id

    const { search_value, idx, page } = ctx.request.body
    if (!search_value) return (ctx.body = error(MISSING_PARAM, '缺少参数search_value'))
    if (typeof idx !== 'number' || idx < 0 || idx >= 3) return (ctx.body = error(MISSING_PARAM, '缺少参数idx或参数错误'))
    if (!page) return (ctx.body = error(MISSING_PARAM, '缺少参数page'))
    const offset = (page - 1) * BLOG_LIMIT

    // 区分博客和文章
    let type
    switch (idx) {
      // 文章
      case 0:
        type = ARTICLE_TYPE
      // 博客
      case 1:
        type = type === undefined ? BLOG_TYPE : type

        try {
          //博客 和 文章
          let category_ids = await Cate.findAll({
            where: notDel({
              name: {
                [Op.like]: '%' + search_value + '%',
              },
            }),
            attributes: ['category_id'],
          })
          category_ids = mapColumns(category_ids, 'category_id')
          category_ids = category_ids || []

          const blog_res = await Blog.findAll(
            order({
              where: notDel({
                [Op.or]: [
                  {
                    char_content: {
                      [Op.like]: '%' + search_value + '%',
                    },
                  },
                  { category_id: category_ids },
                ],
                type,
              }),
            })
          )

          //        print_r(this.blog_model.getLastSql());
          await handleBlogRes(blog_res, user_id)

          ctx.body = success(blog_res)
        } catch (err) {
          console.log(err)
          ctx.body = error(COMMEN_ERROR, '获取搜索文章或博客失败' + err)
        }
        break
      //用户
      case 2:
        try {
          const user_res = await User.findAll({
            where: notDel({
              nickname: {
                [Op.like]: '%' + search_value + '%',
              },
            }),
            attributes: userAttr(),
            offset,
            limit: BLOG_LIMIT,
          })

          for (let user_idx = 0; user_id < user_res.length; user_idx++) {
            let user_va = user_res[user_idx]
            if (!user_va) continue
            user_va = user_res[user_idx] = user_va.dataValues
            user_va['is_follow'] = 0
            user_va['is_self'] = 0
            if (user_id) {
              user_va['is_follow'] = await Follow.count({
                where: notDel({
                  user_id,
                  followed_user_id: user_va['user_id'],
                }),
              })
              user_va['is_self'] = user_id == user_va['user_id'] ? 1 : 0
            }
          }

          ctx.body = success(user_res)
        } catch (err) {
          console.log(err)
          ctx.body = error(COMMEN_ERROR, '获取搜索用户失败' + err)
        }
        break
      default:
        ctx.body = error(COMMEN_ERROR, '参数idx超出范围')
    }
  }
}

module.exports = new SearchController()
