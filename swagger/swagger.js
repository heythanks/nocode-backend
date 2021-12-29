const router = require('koa-router')() //引入路由函数
const swaggerJSDoc = require('swagger-jsdoc')
const path = require('path')
const swaggerDefinition = {
    swagger: "2.0",
    info: {
        title: 'xxxx',
        version: '1.0.0',
        description: 'API',
    },
    basePath: '/' // Base path (optional)
};
const routerConf = path.resolve(__dirname, '../routes/*.js');
console.log(routerConf, 'routerConf')
const parametersConf = 'swagger/parameters.yaml';
const options = {
    swaggerDefinition,
    apis: [routerConf, parametersConf],
};
const swaggerSpec = swaggerJSDoc(options)
console.log(swaggerSpec, 'swaggerSpec')
// TODO：通过路由获取生成的注解文件, 通过json配置，接口不接受预检请求
// const swaggerSpec = require('./swagger.spec.json')
router.get('/swagger.json', async function (ctx) {
    ctx.set('Content-Type', 'application/json');
    ctx.body = swaggerSpec;
})
module.exports = router
