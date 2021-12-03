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
const { findAllBlog, handleBlogRes } = require('../service/blog.service')
const { BLOG_LIMIT, BLOG_TYPE } = require('../config/config.default')

class BlogController {
  async getCategory(ctx, next, type = BLOG_TYPE) {
    const { user_info } = ctx

    let data = [{ category_id: -2, name: '全部' }]

    if (user_info) {
      data.push({
        category_id: -1,
        name: '关注',
      })
    }

    try {
      const cate_res = await Cate.findAll({
        where: notDel({ type }),
        attributes: ['category_id', 'name'],
      })

      data = data.concat(cate_res)
      ctx.body = success(data)
    } catch (err) {
      ctx.body = error(COMMEN_ERROR, '获取category失败' + err)
    }
  }

  async getBlog(ctx, next, type = BLOG_TYPE) {
    const params = phpUrlParams(ctx.request.url.replace('/index/home/get_blog/', ''))
    const id = parseInt(params.id)
    const { page } = ctx.request.body
    const { user_info } = ctx

    if (!id) return (ctx.body = error(MISSING_PARAM, '缺少博客id'))
    if (!page) return (ctx.body = error(MISSING_PARAM, '缺少page'))

    ctx.body = params
    const offset = (page - 1) * parseInt(BLOG_LIMIT)

    let user_id
    if (user_info) ({ user_id } = user_info)

    try {
      // 博客返回信息
      let blog_res
      //登录：我的关注
      if (id == -1) {
        if (!user_id) return (ctx.body = error(MISSING_TOKEN, '登陆过期，请重新登录'))

        const followed_user_ids = await getColumns(Follow, { user_id }, 'followed_user_id')
        // 自己是关注自己的
        followed_user_ids.push(user_id)

        blog_res = await findAllBlog(
          {
            user_id: followed_user_ids,
            type,
          },
          offset
        )
      }
      //全部博客
      else if (id == -2) {
        blog_res = await findAllBlog(
          {
            type,
          },
          offset
        )
      }
      // 根据标签id获取博客
      else {
        blog_res = await findAllBlog(
          {
            category_id: id,
            type,
          },
          offset
        )
      }

      await handleBlogRes(blog_res, user_id)

      ctx.body = success(blog_res)
    } catch (err) {
      console.log(err)
      ctx.body = error('获取博客列表失败' + err)
    }
  }

  async getComm(ctx, next) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/get_comm/', ''))
    const blog_id = parseInt(query.id)
    const { user_info } = ctx
    let user_id
    if (user_info) user_id = user_info.user_id

    if (!blog_id) return (ctx.body = error(MISSING_PARAM, '缺少博客id'))

    const { limit } = ctx.request.body

    try {
      const ops = {
        where: notDel({
          blog_id,
        }),
        order: [['create_time', 'DESC']],
      }

      if (limit) {
        Object.assign(ops, { offset: 0, limit })
      }

      const comm_res = await Comm.findAll(ops)

      for (let comm_idx = 0; comm_idx < comm_res.length; comm_idx++) {
        if (!comm_res[comm_idx]) continue

        const comm_va = comm_res[comm_idx].dataValues

        comm_va['user_info'] = await findOneUser({ user_id: comm_va['user_id'] })

        comm_va['reps'] = await Reply.findAll({
          where: notDel({
            comment_id: comm_va['comment_id'],
          }),
          order: [['create_time', 'DESC']],
          offset: 0,
          limit: 2,
        })
        comm_va['is_mine'] = 0

        if (user_id) {
          comm_va['is_mine'] = comm_va['user_id'] == user_id ? 1 : 0
        }
        // 获取全部回复的条数
        comm_va['rep_count'] = await Reply.count({
          where: notDel({
            comment_id: comm_va['comment_id'],
          }),
        })
        const rep_res = comm_va['reps']

        for (let rep_idx = 0; rep_idx < rep_res.length; rep_idx++) {
          if (!rep_res[rep_idx]) return

          const rep_va = rep_res[rep_idx].dataValues

          rep_va['user_info'] = await findOneUser({ user_id: rep_va['user_id'] })

          rep_va['is_mine'] = rep_va['user_id'] == user_id ? 1 : 0

          if (rep_va['is_rereply']) {
            rep_va['reply_user_info'] = await findOneUser({ user_id: rep_va['reply_user_id'] })

            rep_va['reply_char_content'] = await Reply.findOne({
              where: notDel({
                reply_id: rep_va['parent_reply_id'],
              }),
            }).char_content
          }
        }
      }

      ctx.body = success(comm_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取评论失败！' + err)
    }
  }

  async getReply(ctx, next) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/get_reply/', ''))
    const id = parseInt(query.id)
    const { user_info } = ctx
    let user_id
    if (user_info) user_id = user_info.user_id

    if (!id) return (ctx.body = error(MISSING_PARAM, '缺少id'))

    if (id < 0) id = -id

    try {
      const rep_res = await Reply.findAll(
        order({
          where: notDel({
            comment_id: id,
          }),
        })
      )
      for (let rep_idx = 0; rep_idx < rep_res.length; rep_idx++) {
        if (!rep_res[rep_idx]) continue

        const rep_va = rep_res[rep_idx].dataValues

        rep_va['user_info'] = await findOneUser({ user_id: rep_va['user_id'] })
        rep_va['is_mine'] = 0
        if (user_id) {
          rep_va['is_mine'] = rep_va['user_id'] == user_id ? 1 : 0
        }

        if (rep_va['is_rereply']) {
          rep_va['reply_user_info'] = await findOneUser({ user_id: rep_va['reply_user_id'] })

          const t = await Reply.findOne({
            where: notDel({
              reply_id: rep_va['parent_reply_id'],
            }),
          })

          rep_va['reply_char_content'] = t && t.char_content
        }
      }

      ctx.body = success(rep_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取回复失败' + err)
    }
  }

  async getTopics(ctx, next) {
    try {
      const topic_res = await Topic.findAll({
        where: notDel(),
      })

      ctx.body = success(topic_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取话题失败' + err)
    }
  }

  async addComm(ctx, next) {
    const { user_info } = ctx
    let user_id
    user_id = user_info.user_id

    const { pid, blog_id, comm_content, reply_user_id, parent_reply_id } = ctx.request.body

    if (!blog_id) return (ctx.body = error(MISSING_PARAM, '缺少参数blog_id'))
    if (!comm_content) return (ctx.body = error(MISSING_PARAM, '缺少参数comm_content'))

    try {
      if (pid == 0) {
        await Comm.create({
          blog_id,
          user_id,
          comment_content: comm_content,
        })
      } else {
        let is_rereply = 0
        if (pid < 0) is_rereply = 1

        await Reply.create({
          comment_id: pid < 0 ? -pid : pid,
          user_id,
          char_content: comm_content,
          is_rereply,
          blog_id,
          reply_user_id,
          parent_reply_id,
        })
      }

      ctx.body = success([], '发布评论成功')
    } catch (er) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '发布评论失败')
    }
  }

  async toggleUpvote(ctx, next, Model = Upvote) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/toggle_upvote/', ''))
    const id = parseInt(query.id)
    const { user_info } = ctx
    let user_id = user_info.user_id
    let { is_add } = ctx.request.body

    if (!id) return (ctx.body = error(MISSING_PARAM, '缺少参数id'))
    let is_upvote
    try {
      const upvote_res = await Model.findOne({
        where: notDel({
          user_id,
          blog_id: id,
        }),
      })

      //添加点赞
      if (is_add === 1) {
        if (!upvote_res) {
          await Model.create({
            user_id,
            blog_id: id,
          })
        }
        is_upvote = 1
      }
      //删除点赞
      else if (is_add === 0) {
        if (upvote_res) {
          await Model.destroy({
            where: {
              user_id,
              blog_id: id,
            },
          })
        }
        is_upvote = 0
      }
      //切换点赞
      else {
        //删除点赞
        if (upvote_res) {
          await Model.destroy({
            where: {
              user_id,
              blog_id: id,
            },
          })
          is_upvote = 0
        }
        //添加点赞
        else {
          await Model.create({
            user_id,
            blog_id: id,
          })
          is_upvote = 1
        }
      }

      const upvote_count = await Model.count({
        where: notDel({
          blog_id: id,
        }),
      })

      let data
      if (Model === Upvote) {
        data = {
          upvote_count: upvote_count,
          is_upvote: is_upvote,
        }
      } else if (Model === Colle) {
        data = {
          colle_count: upvote_count,
          is_colle: is_upvote,
        }
      }

      ctx.body = success(data)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '切换点赞失败' + err)
    }
  }

  async toggleColle(ctx, next) {
    ctx.request.url = ctx.request.url.replace('/index/home/toggle_colle/', '')
    const Model = Colle
    await baseController.toggleUpvote(ctx, next, Model)
  }

  async removeBlog(ctx, next) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/remove_blog/', ''))
    const id = parseInt(query.id)
    const { user_info } = ctx
    let user_id = user_info.user_id

    try {
      const blog_res = await Blog.findOne({
        where: notDel({
          user_id,
          blog_id: id,
        }),
      })

      if (!blog_res) return (ctx.body = error(COMMEN_ERROR, '博客id不存在'))

      await Blog.destroy({
        where: {
          blog_id: id,
        },
      })

      ctx.body = success([], '删除博客成功')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '删除博客失败' + err)
    }
  }

  async removeComm(ctx, next) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/remove_comm/', ''))
    const id = parseInt(query.id)
    const { user_info } = ctx
    let user_id = user_info.user_id

    try {
      const comm_res = await Comm.findOne({
        where: notDel({
          comment_id: id,
          user_id,
        }),
      })
      if (!comm_res) return (ctx.body = error(COMMEN_ERROR, '评论id不存在'))

      await Comm.destroy({
        where: {
          comment_id: id,
          user_id,
        },
      })

      ctx.body = success([], '删除评论成功')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '删除评论失败' + err)
    }
  }

  async removeReply(ctx, next) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/remove_reply/', ''))
    const id = parseInt(query.id)
    const { user_info } = ctx
    let user_id = user_info.user_id

    try {
      const comm_res = await Reply.findOne({
        where: notDel({
          reply_id: id,
          user_id,
        }),
      })
      if (!comm_res) return (ctx.body = error(COMMEN_ERROR, '回复id不存在'))

      await Reply.destroy({
        where: {
          reply_id: id,
          user_id,
        },
      })

      ctx.body = success([], '删除回复成功')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '删除回复失败' + err)
    }
  }
}
const baseController = new BlogController()
module.exports = new BlogController()
