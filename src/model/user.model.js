const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE },
} = require('sequelize')

const seq = require('../db/seq')

// 创建模型(Model zd_user -> 表 zd_users)
const User = seq.define(
  'tb_user',
  {
    user_id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    blog_count_limit: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    token: {
      type: STRING,
    },
    expire_time: {
      type: INTEGER,
    },
    account: {
      type: STRING,
      allowNull: false,
    },
    email: {
      type: STRING,
      allowNull: false,
    },
    password: {
      type: STRING,
      allowNull: false,
    },
    nickname: {
      type: STRING,
      allowNull: false,
    },
    birthday: {
      type: DATEONLY,
    },
    gender: {
      type: STRING,
    },
    organization: {
      type: STRING,
    },
    profile: { type: STRING },
    avatar: { type: STRING, allowNull: false },
    last_login_time: { type: DATE },
    delete_time: { type: DATE },
    last_logout_time: { type: DATE },
    is_online: { type: INTEGER },
  },
  {
    createdAt: 'create_time',
    // 想要 updatedAt 但是希望名称叫做 updateTimestamp
    updatedAt: 'update_time',
  }
)

// 强制同步数据库(创建数据表)
// User.sync({ force: true })

module.exports = User
