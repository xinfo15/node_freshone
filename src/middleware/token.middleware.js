const { hasToken } = require('../util/token')
const { error, MISSING_TOKEN, COMMEN_ERROR, MISSING_PARAM } = require('../util/response')
const { getTimeSec } = require('../util/date')

/**
 * 判断是否有token
 */
const verifyToken = async (ctx, next, isForceLogin) => {
  const token = ctx.request.header.authorization

  try {
    let user_info = null

    if (token) user_info = await hasToken(token)

    if (user_info && user_info.expire_time < getTimeSec()) {
      return (ctx.body = error(MISSING_TOKEN, '登录过期，请重新登录！'))
    }

    if (isForceLogin) {
      if (!user_info) {
        return (ctx.body = error(MISSING_TOKEN, '请登录后再试！'))
      }
    }

    ctx.user_info = user_info
    await next()
  } catch (err) {
    ctx.body = error(COMMEN_ERROR, '检验token失败' + err)
  }
}

// 必须登录
const forceLogin = async (ctx, next) => {
  const isForceLogin = true
  await verifyToken(ctx, next, isForceLogin)
}

// 是否登录
const hasLogin = async (ctx, next) => {
  const isForceLogin = false
  await verifyToken(ctx, next, isForceLogin)
}

module.exports = {
  forceLogin,
  hasLogin,
}
