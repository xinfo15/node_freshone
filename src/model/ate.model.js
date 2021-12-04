const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')
const { relativeTime } = require('../util/sql')

const Ate = seq.define(
  'tb_ate',
  {
    ate_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
    },
    ated_user_id: {
      type: INTEGER,
      allowNull: false,
    },
    blog_id: {
      type: INTEGER,
      allowNull: false,
    },
    ate_href: {
      type: INTEGER,
    },
    is_read: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    create_time: {
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

module.exports = Ate
