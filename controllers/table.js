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

module.exports = {
  getTableList
}