const { Sequelize } = require('sequelize')

// 更改moment提示为中文，用于查询create_time
require('../util/zh_moment')

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PWD, MYSQL_DB } = require('../config/config.default')

const seq = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PWD, {
  host: MYSQL_HOST,
  dialect: 'mysql',
  define: {
    freezeTableName: true,
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  timezone: '+08:00', // 保存为本地时区
})

// seq
//   .authenticate()
//   .then(() => {
//     console.log('数据库连接成功')
//   })
//   .catch((err) => {
//     console.log('数据库连接失败', err)
//   })

module.exports = seq
