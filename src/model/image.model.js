const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')

const Image = seq.define(
  'tb_image',
  {
    image_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    blog_id: {
      type: INTEGER,
      allowNull: false,
    },
    image: {
      type: STRING,
      allowNull: false,
    },
    type: {
      type: INTEGER,
      defaultValue: 0,
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

module.exports = Image
