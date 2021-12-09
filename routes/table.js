const Router = require('koa-router');
const router = new Router();
const tableController = require('../controllers/table');

router.prefix('/api/table');

router.get('/list1', async (ctx) => tableController.getTableList(ctx));

router.get('/list2', async (ctx) => tableController.getTableList(ctx))

module.exports = router;