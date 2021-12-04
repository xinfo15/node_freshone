const { Op } = require('sequelize')
const Follow = require('../model/follow.model')
const User = require('../model/user.model')
const { notDel } = require('../util/sql')

class UserService {
  async findOneUser({ user_id, token, account, email }) {
    const whereOpt = {}
    const attributes = ['user_id', 'nickname', 'avatar', 'profile', 'organization', 'is_online', 'last_logout_time']

    user_id && Object.assign(whereOpt, { user_id })
    token && (Object.assign(whereOpt, { token }), attributes.push('expire_time'))
    account && Object.assign(whereOpt, { account })
    email && Object.assign(whereOpt, { email })

    const res = await User.findOne({
      attributes,
      where: notDel(whereOpt),
    })

    return res ? res.dataValues : null
  }

  userAttr(hasToken) {
    const attributes = ['user_id', 'nickname', 'avatar', 'profile', 'organization', 'is_online']
    hasToken && attributes.push('expire_time')
    return attributes
  }

  async updateOneUser(updateOpt, whereOpt) {
    const res = await User.update(updateOpt, {
      where: whereOpt,
    })

    return res[0] ? true : false
  }

  async handleFollowUsers(followed_user_ids, user_id) {
    const data = []
    for (let followed_user_id of followed_user_ids) {
      const followed_user_res = await self.findOneUser({ user_id: followed_user_id })
      if (!followed_user_id) continue

      followed_user_res['is_follow'] = 0
      followed_user_res['is_self'] = 0
      if (user_id) {
        followed_user_res['is_follow'] = await Follow.count({
          where: notDel({
            user_id,
            followed_user_id,
          }),
        })
        followed_user_res['is_self'] = user_id == followed_user_id ? 1 : 0
      }

      data.push(followed_user_res)
    }

    return data
  }
}
const self = new UserService()
module.exports = self
