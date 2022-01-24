const express = require('express');
const path = require('path');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const chalk = require('chalk')
const { cwd } = require('process')
const bodyParser = require('body-parser')
const querystring = require('querystring');
const globUserCache = require(path.join(__dirname, '/utils/cache'))
const loginController = require(path.join(__dirname, '/controllers/loginController-bug'))
const normalController = require(path.join(__dirname, '/controllers/normalController-bug'))
const params = Object.create(null)
const PORT = 3002;

const currentPath = cwd();


const app = express();
// cookie清理
const clearCookie = () => {
	globUserCache.clear()
}
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json())

// app.use((req, res, next) => {
// 	console.log(req.url, '00')
// 	if (req.url === '/proxy/login') {
// 		// res.sendFile(__dirname + '/favicon.ico');
// 		loginController(req, res, next)
// 	} else if (req.url === '/proxy/request') {
// 		normalController(req, res, next)
// 	} else {
// 		next();
// 	}
// });
let proxyRouter = express.Router();
let loginRouter = express.Router();
//http://127.0.0.1:3002/proxydiy/baseline/upms-provider/platform/menu/tree这样形式的请求会报错找不到路径
//Error: Cannot GET /proxydiy/baseline/upms-provider/platform/menu/tree
// app.use('/proxydiy', proxyRouter, (req, res, next) =>{
// 	console.log(req, )
// });
//使用http-proxy-middleware代理
// app.use('/proxydiy', urlencodedParser, loginController);


// app.use('/proxy/login', loginRouter, loginController)
app.use('/proxy/login', urlencodedParser, loginController)
app.use('/proxy/request', urlencodedParser, normalController)

app.listen(PORT);

console.log(chalk.green(`开启了一个服务：127.0.0.1:${PORT}`))
