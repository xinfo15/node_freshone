const { notDel, getColumns, order, relativeTime, mapColumns } = require('../util/sql')

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

const { findOneUser, handleFollowUsers } = require('../service/user.service')
const { findAllBlog, handleBlogRes } = require('../service/blog.service')
let { BLOG_LIMIT, ARTICLE_TYPE, BLOG_TYPE } = require('../config/config.runtime')

class SpaceController {
  async getSpaceUinfo(ctx, next) {
    const { user_info } = ctx
    let is_self = 0
    let is_follow = 0
    //别人的空间用户id
    let space_user_id = parseInt(ctx.request.body.user_id)
    try {
      let space_user_res = await findOneUser({ user_id: space_user_id })
      if (!space_user_res) {
        return (ctx.body = error(COMMEN_ERROR, '空间用户id不存在'))
      }

      let user_id
      if (user_info) {
        user_id = parseInt(user_info.user_id)

        is_follow = await Follow.count({
          where: notDel({
            user_id,
            followed_user_id: space_user_id,
          }),
        })

        if (user_id == space_user_id) is_self = 1
      }

      space_user_res['follow_count'] = await Follow.count({
        where: notDel({
          user_id: space_user_id,
        }),
      })
      space_user_res['fans_count'] = await Follow.count({
        where: notDel({
          followed_user_id: space_user_id,
        }),
      })
      const blog_ids = await getColumns(Blog, { user_id: space_user_id }, 'blog_id')

      space_user_res['colle_count'] = await Colle.count({
        where: notDel({
          blog_id: blog_ids,
        }),
      })

      space_user_res['is_self'] = is_self
      space_user_res['is_follow'] = is_follow

      ctx.body = success(space_user_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取空间用户信息失败' + err)
    }
  }

  async getSpaceInfo(ctx, next) {
    const { user_info } = ctx
    const query = phpUrlParams(ctx.request.url.replace('/index/home/get_space_info/', ''))
    const label_id = parseInt(query.label_id)
    //别人的空间用户id
    let { user_id: space_user_id, page } = ctx.request.body
    space_user_id = parseInt(space_user_id)

    if (!space_user_id) return (ctx.body = error(MISSING_PARAM, '缺少参数space_user_id'))
    if (!page) return (ctx.body = error(MISSING_PARAM, '缺少参数page'))
    if (!label_id) return (ctx.body = error(MISSING_PARAM, '缺少参数label_id'))

    const offset = (page - 1) * parseInt(BLOG_LIMIT)

    let space_user_res = await findOneUser({ user_id: space_user_id })

    if (!space_user_res) {
      return (ctx.body = error(COMMEN_ERROR, '空间用户id不存在'))
    }

    let user_id
    if (user_info) user_id = parseInt(user_info.user_id)

    // 用于区分收藏、点赞用到的模型
    let Model
    // 用于区分博客、文章
    let type
    // 用于区分关注还是粉丝
    let follow_where_column
    let follow_column

    switch (label_id) {
      // 空间文章
      case -1:
        type = ARTICLE_TYPE
      // 空间博客
      case 1:
        type = type || BLOG_TYPE
        try {
          const blog_res = await findAllBlog({ user_id: space_user_id, type }, offset)

          await handleBlogRes(blog_res, user_id)

          ctx.body = success(blog_res)
        } catch (err) {
          console.log(err)
          ctx.body = error(COMMEN_ERROR, '获取空间个人博客或文章失败' + err)
        }
        break
      // 空间关注
      case 2:
        // 查关注 要 user_id = space_user_id
        follow_where_column = 'user_id'
        follow_column = 'followed_user_id'
      // 空间粉丝
      case 3:
        // 查粉丝 要 followed_user_id = space_user_id
        follow_where_column = follow_where_column || 'followed_user_id'
        follow_column = follow_column || 'user_id'
        try {
          let followed_user_ids = await Follow.findAll(
            order({
              where: notDel({
                [follow_where_column]: space_user_id,
              }),
              attribute: [follow_column],
              offset,
              limit: BLOG_LIMIT,
            })
          )
          followed_user_ids = mapColumns(followed_user_ids, follow_column)

          const data = await handleFollowUsers(followed_user_ids, user_id)

          ctx.body = success(data)
        } catch (err) {
          console.log(err)
          ctx.body = error(COMMEN_ERROR, '获取空间关注用户失败' + err)
        }
        break
      // 收藏的博客
      case 4:
        Model = Colle
        type = BLOG_TYPE
      // 收藏的文章
      case 6:
        Model = Colle
        type = type === undefined ? ARTICLE_TYPE : type
      // 点赞的博客
      case 5:
        Model = Model || Upvote
        type = type === undefined ? BLOG_TYPE : type
      // 点赞的文章
      case 7:
        Model = Model || Upvote
        type = type === undefined ? ARTICLE_TYPE : type

        try {
          let blog_ids = await Model.findAll(
            order({
              where: notDel({
                user_id: space_user_id,
              }),
              attribute: ['blog_id'],
              offset,
              limit: BLOG_LIMIT,
            })
          )
          blog_ids = mapColumns(blog_ids, 'blog_id')

          const blog_res = await findAllBlog({ blog_id: blog_ids, type }, offset)

          await handleBlogRes(blog_res, user_id)

          ctx.body = success(blog_res)
        } catch (err) {
          console.log(err)
          ctx.body = error(COMMEN_ERROR, '获取空间点赞或收藏的博客文章失败' + err)
        }
        break
      default:
        ctx.body = error(COMMEN_ERROR, '错误的label_id')
    }
  }

  async toggleFollow(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    const { follow_user_id } = ctx.request.body
    if (!follow_user_id) return (ctx.body = error(MISSING_PARAM, '缺少参数follow_user_id'))

    try {
      const follow_res = await Follow.findOne({
        where: notDel({
          user_id,
          followed_user_id: follow_user_id,
        }),
      })
      let is_follow
      if (follow_res) {
        await Follow.destroy({
          where: { user_id, followed_user_id: follow_user_id },
        })
        is_follow = 0
      } else {
        await Follow.create({
          user_id: user_id,
          followed_user_id: follow_user_id,
        })
        is_follow = 1
      }
      const data = { is_follow: is_follow }

      ctx.body = success(data)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '切换关注失败')
    }
  }
}

module.exports = new SpaceController()
