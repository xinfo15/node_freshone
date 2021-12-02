const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')

const TopicSelection = seq.define(
  'tb_topic_selection',
  {
    selection_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    topic_id: {
      type: INTEGER,
      allowNull: false,
    },
    blog_id: {
      type: INTEGER,
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

module.exports = TopicSelection
