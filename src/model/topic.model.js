const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')

const Topic = seq.define(
  'tb_topic',
  {
    topic_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: STRING,
      allowNull: false,
    },
    description: {
      type: STRING,
      allowNull: false,
    },
    admin_id: {
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

module.exports = Topic
