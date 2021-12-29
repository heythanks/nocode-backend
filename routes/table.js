const Router = require('koa-router');
const router = new Router();
const tableController = require('../controllers/table');

router.prefix('/api/table');
/**
 * @swagger
 * /api/table/list1: # 接口地址
 *    get:
 *       description: 查询表格数据
 *       tags: [表格数据]
 *       produces:
 *         - application/json
 *       parameters:
 *         - $ref: '#/definitions/pageSize'
 *         - name: current
 *           description: 当前页
 *           in: query
 *           required: true
 *           type: number
 *           default: 1
 *       responses:
 *          '200':
 *             description: OK
*/
router.get('/list1', async (ctx) => tableController.getTableList(ctx));

router.get('/list2', async (ctx) => tableController.getTableList(ctx))

module.exports = router;
