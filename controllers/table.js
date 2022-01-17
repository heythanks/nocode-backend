const { TABLE_DATA } = require('../utils/consts');
const { successResponse } = require('../utils/response');


const getTableList = async (ctx) => {
  const { pageSize, current } = ctx.query;
  const tableData = TABLE_DATA(pageSize, current);
  successResponse(ctx, {
    records: tableData,
    total: 100,
    pages: 10,
    current: parseInt(current),
    size: parseInt(pageSize)
  })
};
const postTableList = async (ctx) => {
  const { pageSize, current } = ctx.request.body;
	console.log(pageSize, '9999', current)

  const tableData = TABLE_DATA(pageSize, current);
  successResponse(ctx, {
    records: tableData,
    total: 100,
    pages: 10,
    current: parseInt(current),
    size: parseInt(pageSize)
  })
};

module.exports = {
  getTableList,
	postTableList
}
