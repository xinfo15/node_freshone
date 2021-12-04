const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')
const { relativeTime } = require('../util/sql')

const Follow = seq.define(
  'tb_follow',
  {
    follow_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
    },
    followed_user_id: {
      type: INTEGER,
      allowNull: false,
    },    create_time: {
      type: DATE,
      get() {
        return relativeTime(this.getDataValue('create_time'))
      },
    },
    delete_time: {
      type: DATE,
    },
  },
  {
    createdAt: 'create_time',
    // 想要 updatedAt 但是希望名称叫做 updateTimestamp
    updatedAt: 'update_time',
  }
)

module.exports = Follow
