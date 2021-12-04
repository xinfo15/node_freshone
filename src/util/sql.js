const moment = require('moment')
const { Op } = require('sequelize')

// 创建没有被删除的where条件
const notDel = (where_ops) => {
  !where_ops && (where_ops = {})
  Object.assign(where_ops, { delete_time: { [Op.is]: null } })

  return where_ops
}

const getColumns = async (Model, where_ops, column_name) => {
  let res = await Model.findAll({
    attribute: [column_name],
    where: where_ops,
  })

  res.map((item) => item[column_name])

  return res
}

const mapColumns = (res, column_name) => {
  return res.map((item) => item[column_name])
}

const relativeTime = (datetime) => {
  return moment(datetime, 'YYYY-MM-DD hh:mm:ss').fromNow()
}

const arrUniq = (arr) => {
  const hash = {}
  const res = []
  arr.forEach((item) => {
    if (!hash[item]) {
      hash[item] = true
      res.push(item)
    }
  })

  return res
}

/**
 * 添加 创建时间 降序
 * @param {*} ops
 * @returns
 */
const order = (ops) => {
  !ops && (ops = {})
  Object.assign(ops, { order: [['create_time', 'DESC']] })

  return ops
}

module.exports = {
  notDel,
  getColumns,
  relativeTime,
  order,
  mapColumns,
  arrUniq,
}
