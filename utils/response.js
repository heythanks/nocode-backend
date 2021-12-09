//数据结构体
const structureData = {
  status: false,
  message: null,
  errorType: null,
  test: 66,
  data: {
    records: [],//约定后台列表数据
    total: 158,//约定后台列表总数
    size: 10,
    current: 1,
    pages: 15,
  },
};
const successResponse = (ctx, data) => {
  ctx.body = {
    ...structureData,
    
    data: {
      ...data
    }
  }
};
const errorResponse = (ctx, message) => {
  ctx.body = {
    ...structureData,
    status: false,
    message,
  }
}
module.exports = {
  successResponse,
  errorResponse
}