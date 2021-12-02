const md5 = require('md5')
const uniqid = require('uniqid')
const sha1 = require('sha1')
const { findOneUser } = require('../service/user.service')

const setToken = (username) => {
  const str = md5(uniqid(md5(new Date().getTime())))
  const token = sha1(str + username)
  return token
}

const hasToken = async (token) => {
  const res = await findOneUser({ token })
  return res
}

module.exports = {
  setToken,
  hasToken,
}
