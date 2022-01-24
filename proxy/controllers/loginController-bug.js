const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const chalk = require('chalk');
const params = Object.create(null);
const path = require('path')
const globUserCache = require(path.resolve(__dirname, '../utils/cache'))
console.log(globUserCache, 'globUserCache')
const querystring = require('querystring')
let currentCookie = '';
const loginController = createProxyMiddleware({
	target: 'http://172.17.1.58:31380',
	router: function(req) {
		const { loginPath='', host='', loginContent ='' } = req.body;
    console.log(chalk.green(host + loginPath))
		return host + loginPath;
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	cookieDomainRewrite: {
		"*": ""
	},
	onProxyReq: (proxyReq, req, res) => {
		// 代理请求拦截器
		const {loginPath='', host='', loginContent = ''} = req.body;

		const requestBody = querystring.parse(loginContent)

		proxyReq.path = proxyReq.path.split(req.originalUrl)[0]
		currentCookie = proxyReq.getHeader('Cookie')
		proxyReq.setHeader('Cookie','')
		console.log(chalk.green(currentCookie, '我得到的cookie'))

    const contentType = proxyReq.getHeader('Content-Type');
		const writeBody = (bodyData) => {
			console.log(chalk.red(bodyData))
			// deepcode ignore ContentLengthInCode: bodyParser fix
			proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
			proxyReq.write(bodyData);
    };
		if (contentType && contentType.includes('application/json')) {
			writeBody(JSON.stringify(requestBody));
		}
		if (contentType === 'application/x-www-form-urlencoded') {
			writeBody(querystring.stringify(requestBody));
		}

	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
		// 代理响应拦截器
		const exchange = `[代理地址映射] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
		console.log(chalk.yellow(exchange))
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		const cookie = proxyRes.headers['set-cookie'];//代理接口响应的cookie
		// delete proxyRes.headers['x-removed']
		console.log(res.getHeader('set-cookie'), '999999')
		if(proxyResponseObj.code === "200") {
			//登录成功将session和登录相关的信息存下来
			globUserCache.set({
				type: 'userLoginInfoMap',
				key: currentCookie,
				val: {
					session: cookie,
					loginContent: {
						path: req.body.loginPath,
						loginBodyStr: req.body.loginContent
					}
				},
				isParent: true
			})
		}
		return JSON.stringify(proxyResponseObj)
  },
	),
	onError: (err, req, res, target) => {
		console.log(chalk.red(err))
	}
})
module.exports = loginController
