const { notDel } = require('../util/sql')
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
const { BLOG_LIMIT } = require('../config/config.runtime')

class BlogService {
  async findAllBlog(where_ops, offset) {
    const blog_res = await Blog.findAll({
      where: notDel(where_ops),
      order: [['create_time', 'DESC']],
      offset,
      limit: parseInt(BLOG_LIMIT),
    })

    return blog_res
  }

  async handleBlogRes(blog_res, user_id) {
    for (let i = 0; i < blog_res.length; i++) {
      if (!blog_res[i]) continue
      const blog_va = (blog_res[i] = blog_res[i].dataValues)

      const blog_id = blog_va['blog_id']

      blog_va['user_info'] = await findOneUser({
        user_id: blog_va['user_id'],
      })

      blog_va['imgs'] = await Image.findAll({
        where: notDel({
          blog_id,
        }),
        attributes: ['type', 'image'],
      })
      blog_va['comm_count'] = await Comm.count({
        where: notDel({
          blog_id,
        }),
      })
      blog_va['upvote_count'] = await Upvote.count({
        where: notDel({
          blog_id,
        }),
      })
      blog_va['colle_count'] = await Colle.count({
        where: notDel({
          blog_id,
        }),
      })
      const cate_res = await Cate.findOne({
        where: notDel({
          category_id: blog_va['category_id'],
        }),
      })
      blog_va['category_name'] = cate_res.name
      blog_va['commList'] = []
      blog_va['collapseComm'] = false
      blog_va['hideSendCommBtn'] = false
      blog_va['sendCommContent'] = ''
      blog_va['is_upvote'] = 0
      blog_va['is_colle'] = 0
      blog_va['is_mine'] = 0

      if (user_id) {
        blog_va['is_upvote'] = await Upvote.count({
          where: notDel({
            blog_id,
            user_id,
          }),
        })
        blog_va['is_colle'] = await Colle.count({
          where: notDel({
            blog_id,
            user_id,
          }),
        })
        blog_va['is_mine'] = blog_va['user_id'] == user_id ? 1 : 0
      }
    }
  }

  // 缩略版blog
  async handleMiniBlogRes(blog_ids) {
    const blog_data = {}

    //处理博客
    for (const blog_id of blog_ids) {
      const blog_res = await Blog.findOne({
        where: notDel({
          blog_id,
        }),
      })
      if (!blog_res) continue

      let img = await Image.findOne({
        where: notDel({
          blog_id,
        }),
        attributes: ['type', 'image'],
      })
      const blog_user_info = await findOneUser({ user_id: blog_res['user_id'] })
      if (!blog_user_info) continue

      let img_type = 0
      if (img) {
        img_type = img['type']
        img = img['image']
      } else {
        img = blog_res['cover']
        if (!img) img = blog_user_info['avatar']
      }

      blog_data[blog_id] = {
        content: blog_res['type'] == 0 ? blog_res['char_content'] : blog_res['main_describe'],
        img: img,
        img_type: img_type,
        user_info: blog_user_info,
        type: blog_res['type'],
      }
    }

    return blog_data
  }

  async handleCommRes(comm_res, user_id) {
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

          const t = await Reply.findOne({
            where: notDel({
              reply_id: rep_va['parent_reply_id'],
            }),
          })
          rep_va['reply_char_content'] = t && t.char_content
        }
      }
    }
  }
}

module.exports = new BlogService()
