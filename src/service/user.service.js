const User = require('../model/user.model')

class UserService {
  async findOneUser({ user_id, token, account, email }) {
    const whereOpt = {}
    const attributes = ['user_id', 'nickname', 'avatar', 'profile', 'organization', 'is_online']

    user_id && Object.assign(whereOpt, { user_id })
    token && Object.assign(whereOpt, { token }), attributes.push('expire_time')
    account && Object.assign(whereOpt, { account })
    email && Object.assign(whereOpt, { email })

    const res = await User.findOne({
      attributes,
      where: whereOpt,
    })

    return res ? res.dataValues : null
  }

  async updateOneUser(updateOpt, whereOpt) {
    const res = await User.update(updateOpt, {
      where: whereOpt,
    })

    return res[0] ? true : false
  }
}

module.exports = new UserService()
