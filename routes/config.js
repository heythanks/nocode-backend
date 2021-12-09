const Router = require('koa-router');
const router = new Router();
const configController = require('../controllers/config');

router.prefix('/api');

router.post('/config', async (ctx) => configController.postConfig(ctx));

router.post('/gits', async (ctx) => configController.postConfigPushGit(ctx));

router.get('/gits/:gitName', async (ctx) => configController.getGitsSource(ctx));

router.put('/gits/:gitName/:routerName', async (ctx) => configController.putChangeToGits(ctx));

module.exports = router;
