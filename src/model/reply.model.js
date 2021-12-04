const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN, VIRTUAL },
} = require('sequelize')

const seq = require('../db/seq')

const Reply = seq.define(
  'tb_reply',
  {
    reply_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    comment_id: {
      type: INTEGER,
      allowNull: false,
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
    },
    is_rereply: {
      type: INTEGER,
      allowNull: false,
    },
    is_read: {
      type: INTEGER,
      defaultValue: 0,
    },
    blog_id: {
      type: INTEGER,
      allowNull: false,
    },
    reply_user_id: {
      type: INTEGER,
      defaultValue: 0,
    },
    parent_reply_id: {
      type: INTEGER,
      defaultValue: 0,
    },
    char_content: {
      type: STRING,
      allowNull: false,
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

module.exports = Reply
