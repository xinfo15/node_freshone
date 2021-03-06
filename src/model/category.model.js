const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')
const { relativeTime } = require('../util/sql')

const Cate = seq.define(
  'tb_category',
  {
    category_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    admin_id: {
      type: INTEGER,
      allowNull: false,
    },
    type: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    name: {
      type: STRING,
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

module.exports = Cate
