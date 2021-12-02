const { findOneUser, updateOneUser } = require('../service/user.service')

const { userRegisterError } = require('../constant/err.type')

const { TOKEN_EXPIRE } = require('../config/config.default')
const { error, success, MISSING_PARAM, COMMEN_ERROR } = require('../util/response')
const { setToken } = require('../util/token')
const User = require('../model/user.model')
const { getTimeSec } = require('../util/date')

class UserController {
  async login(ctx, next) {
    const { username: account, password } = ctx.request.body

    if (!account || !password) return (ctx.body = error(MISSING_PARAM, '缺少用户名或密码'))

    const user_info = await findOneUser({ account, password })

    if (!user_info) return (ctx.body = error(COMMEN_ERROR, '用户名或密码错误'))

    const { user_id } = user_info
    const token = setToken()
    const expire_time = getTimeSec() + parseInt(TOKEN_EXPIRE)
    const update_res = await updateOneUser({ token, expire_time }, { user_id })

    if (!update_res) return (ctx.body = error(COMMEN_ERROR, '修改token失败'))

    ctx.body = success({
      token,
      expire_time,
      user_info,
    })
  }

  async getUserInfo(ctx, next) {
    const { user_info } = ctx

    if (user_info) {
      ctx.body = success(user_info)
    } else {
      ctx.body = error(COMMEN_ERROR, '获取用户信息失败')
    }
  }

  async register(ctx, next) {
    const { username: account, password, email } = ctx.request.body

    try {
      const res = await User.create({ account, password, email, nickname: account, avatar: '/static/img/coder.jpg', profile: '这个人很懒，什么也没有留下' })
      ctx.body = success(res, '注册成功')
    } catch (err) {
      ctx.body = error(COMMEN_ERROR, '注册用户失败' + err)
    }
  }

  async getFollowedUsers(rtx, next) {
    const { user_info } = ctx
    
  }
}

module.exports = new UserController()
