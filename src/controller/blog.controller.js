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
const Ate = require('../model/ate.model')
const TopicSelection = require('../model/topic_selection.model')

const { findOneUser } = require('../service/user.service')
const { findAllBlog, handleBlogRes, handleCommRes } = require('../service/blog.service')
const { BLOG_LIMIT, BLOG_TYPE, ARTICLE_TYPE } = require('../config/config.runtime')
const { MY_DOMAIN } = require('../config/config.default')
const path = require('path')
const { literal } = require('sequelize')
const fs = require('fs')

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

  async getReleaseBlogCate(ctx, next, type = BLOG_TYPE) {
    try {
      const cate_res = await Cate.findAll({
        where: notDel({
          type,
        }),
      })

      ctx.body = success(cate_res)
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取发布博客标签失败' + err)
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

      await handleCommRes(comm_res, user_id)

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
    await self.toggleUpvote(ctx, next, Model)
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

  async getTheBlog(ctx, next, type = BLOG_TYPE) {
    const query = phpUrlParams(ctx.request.url.replace('/index/home/get_the_blog/', ''))
    const blog_id = parseInt(query.id)
    const { user_info } = ctx
    let user_id
    if (user_info) user_id = user_info.user_id

    try {
      let blog_res = await Blog.findOne({
        where: notDel({
          blog_id,
          type,
        }),
      })

      if (!blog_res) return (ctx.body = error(COMMEN_ERROR, '博客或文章id不存在'))

      blog_res = [blog_res]
      await handleBlogRes(blog_res, user_id)
      blog_res = blog_res[0]

      const comm_res = (blog_res.commList = await Comm.findAll(
        order({
          where: notDel({
            blog_id,
          }),
        })
      ))

      await handleCommRes(comm_res, user_id)

      ctx.body = success([blog_res])
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '获取当前博客失败')
    }
  }

  async uploadOneBlogMedia(ctx, next) {
    //#region
    // let client = new OSS({
    //   // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
    //   region: REGION,
    //   // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
    //   accessKeyId: ACCESS_KEY_ID,
    //   accessKeySecret: ACCESS_KEY_SECERT,
    //   bucket: BUCKET,
    //   // internal: true,
    // })
    // try {
    //   // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    //   // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    //   const result = await client.put('111.jpg', path.normalize('C:\\Users\\Administrator\\Desktop\\测试图片\\111.jpg'))
    //   console.log(result)
    // } catch (e) {
    //   console.log(e)
    // }
    //#endregion
    try {
      const { pos } = ctx.request.body

      const file = ctx.request.files.media

      const type = file.type.split('/')[0]

      const media_url = MY_DOMAIN + path.basename(file.path)

      const data = {
        url: media_url,
        type,
        pos,
      }

      ctx.body = success(data)
    } catch (e) {
      console.log(e)
      ctx.body = error(COMMEN_ERROR, '上传文件失败' + e)
    }
  }

  async addBlog(ctx, next) {
    const { user_info } = ctx
    let user_id = user_info.user_id
    if (user_info['blog_count_limit'] == 0) {
      return (ctx.body = error(COMMEN_ERROR, '你发布博客的次数以达到上线，请联系管理员解决'))
    }
    let { blog_content, category_id, ated_user_ids, topic_ids, upload_media_list } = ctx.request.body
    const files = ctx.request.files
    let imgs
    if (files) imgs = files.imgs

    ated_user_ids = ated_user_ids || []
    topic_ids = topic_ids || []
    imgs = imgs || null

    if (!blog_content && !imgs && !upload_media_list) return (ctx.body = error(MISSING_PARAM, '缺少参数[blog_content | imgs | upload_media_list]'))

    if (!category_id) return (ctx.body = error(MISSING_PARAM, '缺少参数category_id'))

    // sdfsdfkojsdkf
    // return json(ated_user_ids);

    try {
      const blog_res = await Blog.create({
        user_id,
        category_id,
        char_content: blog_content,
        type: BLOG_TYPE,
      })

      const blog_id = blog_res.blog_id

      if (ated_user_ids.length) {
        for (const ated_user_id of ated_user_ids) {
          await Ate.create({
            user_id,
            blog_id,
            ated_user_id,
          })
        }
      }

      if (topic_ids.length) {
        for (const topic_id of topic_ids) {
          await TopicSelection.create({
            blog_id,
            topic_id,
          })
        }
      }

      // upload_media_list 表示在前端上传过后的 url 地址
      // imgs 表示 在后端 上传 文件
      let upload_res = []
      if (imgs || upload_media_list.length) {
        if (imgs) {
        } else if (upload_media_list.length) {
          upload_res = upload_media_list
        }

        for (const upload_va of upload_res) {
          const type = upload_va['type'] == 'video' ? 1 : 0

          await Image.create({
            blog_id,
            image: upload_va['url'],
            type,
          })
        }
      }

      await User.update(
        {
          blog_count_limit: literal('blog_count_limit-1'),
        },
        {
          where: notDel({
            user_id,
          }),
        }
      )

      ctx.body = success([], '发布博客成功！')
    } catch (err) {
      console.log(err)
      ctx.body = error(COMMEN_ERROR, '发布博客失败' + err)
    }
  }

  // 大文件上传api
  // 获取上传过的chunk列表
  async getCachedChunkList(ctx, next) {
    const hash = ctx.query.hash
    const dir = path.resolve(__dirname, '../upload', hash)
    let ans
    if (fs.existsSync(dir)) {
      ans = { dirs: fs.readdirSync(dir) }
    } else {
      ans = {}
    }

    // res.send(JSON.stringify(ans))
    ctx.body = success(ans)
  }
  // 上传chunk
  async uploadFileChunk(ctx, next) {
    const { idx, hash } = ctx.request.body
    const chunk = ctx.request.files.chunk

    if (!chunk || !idx || !hash) return (ctx.body = error(MISSING_PARAM, 'chunk & idx & hash'))

    const dir = path.resolve(__dirname, '../upload', hash)
    const filename = hash + '_' + idx

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    fs.renameSync(chunk.path, path.resolve(dir, filename))

    ctx.body = success([])
  }
  // 合并chunk到文件中
  async mergeFileChunks(ctx, next) {
    const { hash, ext, chunkSize, type, pos } = ctx.request.body
    const chunkDir = path.resolve(__dirname, '../upload', hash)
    if (!chunkDir || !ext || !chunkSize || !type) return (ctx.body = error(MISSING_PARAM, '缺少参数 chunkDir & ext & chunkSize & type'))
    const filename = hash + ext
    const fileDir = path.resolve(__dirname, '../upload', filename)

    const pipeStream = (path, writeStream) =>
      new Promise((resolve) => {
        const readStream = fs.createReadStream(path)
        readStream.on('end', () => {
          // fs.unlinkSync(path)
          resolve()
        })
        readStream.pipe(writeStream)
      })

    if (fs.existsSync(chunkDir)) {
      let chunkPaths = fs.readdirSync(chunkDir)
      chunkPaths.sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))

      try {
        await Promise.all(
          chunkPaths.map((chunkPath, idx) =>
            pipeStream(
              `${chunkDir}/${chunkPath}`,
              fs.createWriteStream(fileDir, {
                start: idx * chunkSize,
                end: (idx + 1) * chunkSize,
              })
            )
          )
        )
      } catch (err) {
        console.log(err)
      }

      // 删除文件和目录
      chunkPaths.forEach((chunkPath, idx) => {
        fs.unlinkSync(path.resolve(__dirname, chunkDir, chunkPath))
      })
      fs.rmdirSync(chunkDir)
    }

    ctx.body = success({
      url: MY_DOMAIN + filename,
      type,
      pos,
    })
  }
}
const self = new BlogController()
module.exports = new BlogController()
