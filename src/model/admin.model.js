const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
} = require('sequelize')

const seq = require('../db/seq')

const Admin = seq.define(
  'tb_admin',
  {
    admin_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    account: {
      type: STRING,
      allowNull: false,
    },
    password: {
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

module.exports = Admin
