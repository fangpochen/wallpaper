// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'getWallpapers':
      return getWallpapers(data)
    case 'addWallpaper':
      return addWallpaper(data)
    case 'getCategories':
      return getCategories()
    default:
      return {
        code: -1,
        msg: '未知操作'
      }
  }
}

// 获取壁纸列表
async function getWallpapers(data) {
  const { type, page = 1, limit = 10 } = data
  const skip = (page - 1) * limit
  
  try {
    let query = db.collection('wallpapers')
    if (type) {
      query = query.where({
        type: type
      })
    }
    
    // 获取总数
    const countResult = await query.count()
    const total = countResult.total
    
    // 获取数据
    const list = await query
      .skip(skip)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      code: 0,
      data: {
        list: list.data,
        total,
        page,
        limit
      }
    }
  } catch (err) {
    return {
      code: -1,
      msg: '获取壁纸列表失败',
      err
    }
  }
}

// 添加壁纸
async function addWallpaper(data) {
  try {
    const result = await db.collection('wallpapers').add({
      data: {
        ...data,
        createTime: db.serverDate()
      }
    })
    return {
      code: 0,
      data: result
    }
  } catch (err) {
    return {
      code: -1,
      msg: '添加壁纸失败',
      err
    }
  }
}

// 获取分类列表
async function getCategories() {
  try {
    const result = await db.collection('categories').get()
    return {
      code: 0,
      data: result.data
    }
  } catch (err) {
    return {
      code: -1,
      msg: '获取分类失败',
      err
    }
  }
} 