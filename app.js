const Koa = require('koa');
const json = require('koa-json');//将node-object转为二进制
const app = new Koa();
const logger = require('koa-logger');// 请求记录中间件会在控制台输出路径以及请求方式，官方logger
// const logger4js = require('log4js');//更加强大的日志记录
const Router = require('koa-router'); // koa 路由中间件
const koaBody = require('koa-body');//请求体解析中间件、支持multipart、urlencoded、json的body格式
const router = new Router();
const table = require('./routes/table');
const config = require('./routes/config');

const port = 3000;
const { error } = require('./utils/log4j.js');
const { koaSwagger } = require('koa2-swagger-ui')
const swagger = require('./swagger/swagger.js');




app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 500 * 1024 * 1024    // 设置上传文件大小最大限制，默认2M
  }
}));


router.use(config.routes(), config.allowedMethods());
router.use(table.routes(), table.allowedMethods());
app.use(swagger.routes(), swagger.allowedMethods())

app.use(router.routes(), router.allowedMethods())
//错误捕获
app.on('error', (err, ctx) => {
  error(err);
  console.log('server error', err, ctx)
})
// app.use(logger());
app.use(koaSwagger({
  routePrefix: '/swagger', // 接口文档访问地址
  swaggerOptions: {
    url: '/swagger.json', // example path to json 其实就是之后swagger-jsdoc生成的文档地址
  }
}))

app.use(json());

app.listen(port);

console.log(`app listen: http://127.0.0.1:${port}`)
