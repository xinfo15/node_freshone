const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')

const Blog = seq.define(
  'tb_blog',
  {
    blog_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
    },
    category_id: {
      type: INTEGER,
      allowNull: false,
    },
    type: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    char_content: {
      type: STRING(10000),
    },
    main_describe: {
      type: STRING,
    },
    title: {
      type: STRING,
    },
    cover: {
      type: STRING,
    },
    view: {
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

module.exports = Blog
