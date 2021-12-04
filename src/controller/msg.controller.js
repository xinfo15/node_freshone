const { notDel, getColumns, order, mapColumns, arrUniq, relativeTime } = require('../util/sql')

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
const Ate = require('../model/ate.model')

const { findOneUser } = require('../service/user.service')
const { findAllBlog, handleBlogRes, handleMiniBlogRes } = require('../service/blog.service')
const { BLOG_LIMIT, ARTICLE_TYPE, BLOG_TYPE } = require('../config/config.runtime')
const { getBlog, getCategory, getTheBlog } = require('./blog.controller')
const { Op } = require('sequelize')

class MsgController {
  async getMsgCnt(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    try {
      let my_blog_ids = await Blog.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['blog_id'],
      })
      my_blog_ids = mapColumns(my_blog_ids, 'blog_id')

      //评论我博客的
      const comm_blog_cnt = await Comm.count({
        where: notDel({
          blog_id: my_blog_ids,
          user_id: {
            [Op.ne]: user_id,
          },
          is_read: 0,
        }),
      })

      let my_comm_ids = await Comm.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['comment_id'],
      })
      my_comm_ids = mapColumns(my_comm_ids, 'comment_id')

      const where_or = [
        //回复我回复的
        { reply_user_id: user_id },
        //回复我评论的
        { comment_id: my_comm_ids },
      ]
      //所有回复我的
      const reply_cnt = await Reply.count({
        where: notDel({
          [Op.or]: where_or,
          is_rereply: 0,
          [Op.and]: [{ user_id: { [Op.ne]: user_id } }, { is_read: 0 }],
        }),
      })

      //@我的
      const ated_blog_cnt = await Ate.count({
        where: notDel({
          ated_user_id: user_id,
          user_id: {
            [Op.ne]: user_id,
          },
          is_read: 0,
        }),
      })
      //点赞我的
      const upvote_blog_cnt = await Upvote.count({
        where: notDel({
          blog_id: my_blog_ids,
          user_id: {
            [Op.ne]: user_id,
          },
          is_read: 0,
        }),
      })

      // console.log(comm_blog_cnt)
      // console.log(reply_cnt)
      // console.log(ated_blog_cnt)
      // console.log(upvote_blog_cnt)

      const total_cnt = comm_blog_cnt + reply_cnt + ated_blog_cnt + upvote_blog_cnt
      const comm_cnt = reply_cnt + comm_blog_cnt
      const data = {
        ated_blog_cnt: ated_blog_cnt,
        comm_cnt: comm_cnt,
        upvote_blog_cnt: upvote_blog_cnt,
        total_cnt: total_cnt,
      }
      ctx.body = success(data)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取信息数量失败' + err)
    }
  }

  async getAteBlog(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    try {
      const ate_res = await Ate.findAll({
        where: notDel({
          ated_user_id: user_id,
          user_id: {
            [Op.ne]: user_id,
          },
        }),
        order: [
          ['is_read', 'ASC'],
          ['create_time', 'DESC'],
        ],
      })

      const blog_res = []

      const type = BLOG_TYPE
      for (const ate_va of ate_res) {
        let blog_va = await Blog.findOne({
          where: notDel({
            blog_id: ate_va['blog_id'],
            type,
          }),
        })
        // blog_va && (blog_va = blog_va.dataValues)
        if (!blog_va) continue
        blog_res.push(blog_va)
        blog_va = blog_va.dataValues
        blog_va['col_id'] = ate_va['ate_id']
        blog_va['is_read'] = ate_va['is_read']
      }

      await handleBlogRes(blog_res, user_id)

      ctx.body = success(blog_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取@我的博客失败' + err)
    }
  }

  async getCommMe(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    try {
      let my_blog_ids = await Blog.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['blog_id'],
      })
      my_blog_ids = mapColumns(my_blog_ids, 'blog_id')

      // console.log(my_blog_ids);

      //评论我博客的
      const comm_blog_res = await Comm.findAll(
        order({
          where: notDel({
            blog_id: my_blog_ids,
            user_id: {
              [Op.ne]: user_id,
            },
          }),
        })
      )
      // console.log(comm_blog_res);

      //评论我评论的
      const comm_res = await Comm.findAll({
        where: notDel({
          user_id,
        }),
      })

      const comm_ids = mapColumns(comm_res, 'comment_id')

      // console.log(comm_ids);

      const where_or = [
        //回复我回复的
        { reply_user_id: user_id },
        //回复我评论的
        { comment_id: comm_ids },
      ]
      //所有回复我的
      const reply_res = await Reply.findAll(
        order({
          where: notDel({
            [Op.or]: where_or,
            is_rereply: 0,
            user_id: { [Op.ne]: user_id },
          }),
        })
      )

      // console.log(reply_res);
      // console.log(comm_blog_res.length, comm_res.length);

      // console.log(comm_blog_res.concat(comm_res).length);
      let blog_ids = mapColumns(comm_blog_res.concat(comm_res), 'blog_id')
      blog_ids = blog_ids.concat(mapColumns(reply_res, 'blog_id'))
      blog_ids = arrUniq(blog_ids)
      // console.log(blog_ids.length)

      const blog_data = await handleMiniBlogRes(blog_ids)

      const data = []

      for (let comm_blog_idx = 0; comm_blog_idx < comm_blog_res.length; comm_blog_idx++) {
        let comm_blog_va = comm_blog_res[comm_blog_idx]
        if (!comm_blog_va) continue
        comm_blog_va = comm_blog_res[comm_blog_idx] = comm_blog_va.dataValues

        comm_blog_va['blog_info'] = blog_data[comm_blog_va['blog_id']]
        comm_blog_va['user_info'] = await findOneUser({ user_id: comm_blog_va['user_id'] })
        comm_blog_va['is_rereply'] = -1
        comm_blog_va['sort_time'] = new Date(comm_blog_va['create_time']).getTime()
        comm_blog_va['create_time'] = relativeTime(comm_blog_va['create_time'])
        comm_blog_va['replied_info'] = null
        comm_blog_va['col_id'] = comm_blog_va['comment_id']

        data.push(comm_blog_va)
      }

      for (let reply_idx = 0; reply_idx < reply_res.length; reply_idx++) {
        let reply_va = reply_res[reply_idx]

        if (!reply_va) continue

        reply_va = reply_res[reply_idx] = reply_va.dataValues

        reply_va['blog_info'] = blog_data[reply_va['blog_id']]
        reply_va['user_info'] = await findOneUser({ user_id: reply_va['user_id'] })
        reply_va['sort_time'] = new Date(reply_va['create_time']).getTime()
        reply_va['create_time'] = relativeTime(reply_va['create_time'])

        reply_va['col_id'] = reply_va['reply_id']
        //回复的评论
        if (reply_va['is_rereply'] == 0) {
          let replied_comm_res = await Comm.findOne({
            comment_id: reply_va['comment_id'],
          })
          if (!replied_comm_res) continue
          replied_comm_res = replied_comm_res.dataValues
          replied_comm_res['user_info'] = await findOneUser({ user_id: replied_comm_res['user_id'] })
          if (!replied_comm_res['user_info']) continue
          //                replied_comm_res['replied_user_info'] = this.
          reply_va['replied_info'] = replied_comm_res
        } else {
          replied_reply_res = await Reply.findOne({
            reply_id: reply_va['parent_reply_id'],
          })
          if (!replied_reply_res) continue
          replied_reply_res = replied_reply_res.dataValues
          replied_reply_res['user_info'] = await findOneUser({ user_id: replied_reply_res['user_id'] })
          if (!replied_reply_res['user_info']) continue

          if (!replied_reply_res['is_rereply']) {
            const replied_reply_comm_res = await Comm.findOne({
              comment_id: replied_reply_res['comment_id'],
            })
            replied_reply_res['replied_user_info'] = await findOneUser({
              user_id: replied_reply_comm_res['user_id'],
            })
          } else {
            replied_reply_res['replied_user_info'] = await findOneUser({
              user_id: replied_reply_res['reply_user_id'],
            })
          }

          reply_va['replied_info'] = replied_reply_res
        }
        data.push(reply_va)
      }

      // console.log(data.length)
      data.sort((a, b) => {
        // 按is_read升序，sort_time降序排列
        // console.log(a.is_read - b.is_read)
        const first = a.is_read - b.is_read
        if (first != 0) return first
        // console.log(b.create_time, new Date(b.create_time).getTime());

        return b.sort_time - a.sort_time
      })

      ctx.body = success(data)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取评论我的消息失败' + err)
    }
  }

  async getUpvoteMe(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    try {
      let my_blog_ids = await Blog.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['blog_id'],
      })
      my_blog_ids = mapColumns(my_blog_ids, 'blog_id')

      const blog_data = await handleMiniBlogRes(my_blog_ids)

      const upvote_res = await Upvote.findAll({
        where: notDel({
          blog_id: my_blog_ids,
          user_id: {
            [Op.ne]: user_id,
          },
        }),
        order: [
          ['is_read', 'ASC'],
          ['create_time', 'DESC'],
        ],
      })

      for (let upvote_idx = 0; upvote_idx < upvote_res.length; upvote_idx++) {
        let upvote_va = upvote_res[upvote_idx]
        if (!upvote_va) continue
        upvote_va = upvote_res[upvote_idx] = upvote_va.dataValues
        const user_info = await findOneUser({
          user_id: upvote_va['user_id'],
        })
        if (!user_info) continue
        upvote_va['user_info'] = user_info
        // upvote_va['create_time'] = Utility::getWhen(time() - strtotime(upvote_va['create_time']));
        if (!blog_data[upvote_va['blog_id']]) continue
        upvote_va['blog_info'] = blog_data[upvote_va['blog_id']]
        upvote_va['col_id'] = upvote_va['upvote_id']
      }

      ctx.body = success(upvote_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取点赞我的消息失败' + err)
    }
  }

  async readMsg(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    const { type, col_id } = ctx.request.body
    if (typeof type !== 'number') return (ctx.body = error(MISSING_PARAM, '缺少参数type或类型错误'))
    if (type < -2 || type > 2) return (ctx.body = error(COMMEN_ERROR, 'type超出范围'))
    if (!col_id) return (ctx.body = error(MISSING_PARAM, '缺少参数col_id'))

    let is_read = 1
    let Model
    let column_name

    switch (type) {
      case -2:
        Model = Ate
        column_name = 'ate_id'
      case -1:
        Model = Model || Comm
        column_name = column_name || 'comment_id'
      case 0:
        Model = Model || Reply
        column_name = column_name || 'reply_id'
      case 1:
        Model = Model || Reply
        column_name = column_name || 'reply_id'
      case 2:
        Model = Model || Upvote
        column_name = column_name || 'upvote_id'

        try {
          const res = await Model.update(
            {
              is_read: 1,
            },
            {
              where: notDel({
                [column_name]: col_id,
              }),
            }
          )

          is_read = res[0] > 0 ? 1 : 0
        } catch (err) {
          return (ctx.body = error(COMMEN_ERROR, '设置消息已读失败' + err))
        }
        break
      default:
        return (ctx.body = error(COMMEN_ERROR, '参数type超出范围'))
    }
    ctx.body = success({ is_read })
  }

  async readAllMsg(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    try {
      let my_blog_ids = await Blog.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['blog_id'],
      })
      my_blog_ids = mapColumns(my_blog_ids, 'blog_id')

      let is_read = 1
      //评论我博客的
      await Comm.update(
        {
          is_read,
        },
        {
          where: notDel({
            blog_id: my_blog_ids,
            user_id: {
              [Op.ne]: user_id,
            },
            is_read: 0,
          }),
        }
      )

      let my_comm_ids = await Comm.findAll({
        where: notDel({
          user_id,
        }),
        attributes: ['comment_id'],
      })
      my_comm_ids = mapColumns(my_comm_ids, 'comment_id')

      const where_or = [
        //回复我回复的
        { reply_user_id: user_id },
        //回复我评论的
        { comment_id: my_comm_ids },
      ]
      //所有回复我的
      await Reply.update(
        {
          is_read,
        },
        {
          where: notDel({
            [Op.or]: where_or,
            is_rereply: 0,
            [Op.and]: [{ user_id: { [Op.ne]: user_id } }, { is_read: 0 }],
          }),
        }
      )

      //@我的
      await Ate.update(
        {
          is_read,
        },
        {
          where: notDel({
            ated_user_id: user_id,
            user_id: {
              [Op.ne]: user_id,
            },
            is_read: 0,
          }),
        }
      )
      //点赞我的
      await Upvote.update(
        {
          is_read,
        },
        {
          where: notDel({
            blog_id: my_blog_ids,
            user_id: {
              [Op.ne]: user_id,
            },
            is_read: 0,
          }),
        }
      )

      ctx.body = success([])
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '设置消息全部已读失败' + err)
    }
  }

}

module.exports = new MsgController()
