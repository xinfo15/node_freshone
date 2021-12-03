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
const { BLOG_LIMIT } = require('../config/config.default')

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
      const blog_va = blog_res[i].dataValues

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
      } else {
        blog_va['is_upvote'] = 0
        blog_va['is_colle'] = 0
        blog_va['is_mine'] = 0
      }
    }
  }
}

module.exports = new BlogService()
