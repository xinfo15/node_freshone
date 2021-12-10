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
const { BLOG_LIMIT, ARTICLE_TYPE, BLOG_TYPE } = require('../config/config.runtime')
const { MY_DOMAIN } = require('../config/config.default')
const path = require('path')
const jimp = require('jimp')

class ProfileController {
  async updateUinfo(ctx, next) {
    const { user_info } = ctx
    const { user_id } = user_info

    const { nickname, profile, organization } = ctx.request.body

    if (!nickname) return (ctx.body = error(MISSING_PARAM, '昵称不能为空'))

    try {
      const user_res = await User.update(
        {
          nickname,
          profile,
          organization,
        },
        {
          where: notDel({ user_id }),
        }
      )

      ctx.body = success(user_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '修改用户信息失败')
    }
  }

  async addAvatar(ctx, next) {
    const { user_info } = ctx
    let user_id = user_info.user_id
    const { files } = ctx.request
    let img
    if (files) img = files['img[]']
    console.log(files)

    if (!img) return (ctx.body = error(MISSING_PARAM, '缺少参数图片img'))
    const body = ctx.request.body
    let { is_crop } = body
    is_crop = parseInt(is_crop)

    try {
      let crop_param = {}

      for (const [key, val] of Object.entries(body)) {
        if (key.indexOf('crop_param') === 0) {
          if (!/\[(.)\]/.test(key)) continue
          const param_key = key.match(/\[(.)\]/)[1]
          crop_param[param_key] = parseInt(val)
        }
      }
      // 裁剪图片
      if (is_crop && crop_param.x) {
        const { x, y, w, h } = crop_param

        const jimpReader = await jimp.read(img.path)
        const res = jimpReader.crop(x, y, w, h).write(img.path)
      }

      const img_url = MY_DOMAIN + path.basename(img.path)

      await User.update(
        {
          avatar: img_url,
        },
        {
          where: notDel({
            user_id,
          }),
        }
      )

      ctx.body = success([], '上传头像成功')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '上传图片失败' + err)
    }
  }
}

module.exports = new ProfileController()
