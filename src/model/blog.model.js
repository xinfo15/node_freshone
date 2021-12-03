const {
  DataTypes: { INTEGER, STRING, DATEONLY, DATE, BOOLEAN },
  VIRTUAL,
} = require('sequelize')

const seq = require('../db/seq')
const { relativeTime } = require('../util/sql')

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
// const blog_id = blog_va['blog_id']

// blog_va.setDataValue(
//   'user_info',
//   await findOneUser({
//     user_id: blog_va['user_id'],
//   })
// )
// blog_va.setDataValue(
//   'imgs',
//   await Image.findAll({
//     where: notDel({
//       blog_id,
//     }),
//     attributes: ['type', 'image'],
//   })
// )
// blog_va.setDataValue(
//   'comm_count',
//   await Comm.count({
//     where: notDel({
//       blog_id,
//     }),
//   })
// )
// blog_va.setDataValue(
//   'upvote_count',
//   await Upvote.count({
//     where: notDel({
//       blog_id,
//     }),
//   })
// )
// blog_va.setDataValue(
//   'colle_count',
//   await Colle.count({
//     where: notDel({
//       blog_id,
//     }),
//   })
// )

// const cate_res = await Cate.findOne({
//   where: {
//     category_id: blog_va['category_id'],
//   },
// })
// blog_va.setDataValue('category_name', cate_res.name)
// blog_va.setDataValue('commList', [])
// blog_va.setDataValue('collapseComm', false)
// blog_va.setDataValue('sendCommContent', '')

// if (user_id) {
//   blog_va.setDataValue(
//     'is_upvote',
//     await Upvote.count({
//       where: {
//         blog_id,
//         user_id,
//       },
//     })
//   )
//   blog_va.setDataValue(
//     'is_colle',
//     await Colle.count({
//       where: {
//         blog_id,
//         user_id,
//       },
//     })
//   )
//   blog_va.setDataValue('is_mine', blog_va['user_id'] == user_id ? 1 : 0)
// } else {
//   blog_va['is_upvote'] = 0
//   blog_va['is_colle'] = 0
//   blog_va['is_mine'] = 0
// }

module.exports = Blog
