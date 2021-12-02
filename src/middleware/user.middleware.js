const bcrypt = require('bcryptjs')

const { findOneUser } = require('../service/user.service')
const { userFormateError, userAlreadyExited, userRegisterError, userDoesNotExist, userLoginError, invalidPassword } = require('../constant/err.type')
const { error, COMMEN_ERROR, MISSING_PARAM } = require('../util/response')

const userValidator = async (ctx, next) => {
  const { user_name, password } = ctx.request.body
  // 合法性
  if (!user_name || !password) {
    console.error('用户名或密码为空', ctx.request.body)
    ctx.app.emit('error', userFormateError, ctx)
    return
  }

  await next()
}

// 用户是否存在
const userExisted = async (ctx, next) => {
  const { username: account, password, email } = ctx.request.body

  if (!account) return (ctx.body = error(MISSING_PARAM, '缺少用户名username'))
  if (!email) return (ctx.body = error(MISSING_PARAM, '缺少邮箱email'))
  if (!password) return (ctx.body = error(MISSING_PARAM, '缺少password'))

  try {
    let res = await findOneUser({ account })

    if (res) {
      return (ctx.body = error(COMMEN_ERROR, '用户名已存在'))
    }

    res = await findOneUser({ email })
    if (res) {
      return (ctx.body = error(COMMEN_ERROR, '邮箱已存在'))
    }
  } catch (err) {
    return (ctx.body = error(COMMEN_ERROR, '获取用户信息失败'))
  }

  await next()
}

const crpytPassword = async (ctx, next) => {
  const { password } = ctx.request.body

  const salt = bcrypt.genSaltSync(10)
  // hash保存的是 密文
  const hash = bcrypt.hashSync(password, salt)

  ctx.request.body.password = hash

  await next()
}

const verifyLogin = async (ctx, next) => {
  // 1. 判断用户是否存在(不存在:报错)
  const { user_name, password } = ctx.request.body

  try {
    const res = await getUerInfo({ user_name })

    if (!res) {
      console.error('用户名不存在', { user_name })
      ctx.app.emit('error', userDoesNotExist, ctx)
      return
    }

    // 2. 密码是否匹配(不匹配: 报错)
    if (!bcrypt.compareSync(password, res.password)) {
      ctx.app.emit('error', invalidPassword, ctx)
      return
    }
  } catch (err) {
    console.error(err)
    return ctx.app.emit('error', userLoginError, ctx)
  }

  await next()
}

module.exports = {
  userValidator,
  userExisted,
  crpytPassword,
  verifyLogin,
}
