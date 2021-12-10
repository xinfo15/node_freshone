const { findOneUser } = require('../service/user.service')
const { error, COMMEN_ERROR, MISSING_PARAM } = require('../util/response')

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

module.exports = {
  userExisted,
}
