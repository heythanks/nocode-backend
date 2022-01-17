// http://172.17.1.58:31380/baseline/upms-provider/platform/organization/user/info

const express = require('express');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const axios = require('axios').default;
const globUserCache = require('./utils/cache')
const chalk = require('chalk')
const bodyParser = require('body-parser')
const params = {}

 axios.interceptors.request.use(function (config) {
	// Do something before request is sent
	console.log(chalk.green(`[发起请求]：[${config.method}]->${config.url}`))
	console.log(config)
	return config;
}, function (error) {
	// Do something with request error
	return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
	// Any status code that lie within the range of 2xx cause this function to trigger
	// Do something with response data
	console.log(chalk.green('响应请求拦截器'))
	return response;
}, function (error) {
	// Any status codes that falls outside the range of 2xx cause this function to trigger
	// Do something with response error
	const errorLog = `[接口响应报错]：${error.config.url}:${error.response.data.message}`
	console.log(chalk.red(errorLog))
	return Promise.reject(error);
});
/**
 * Configure proxy middleware
 */
 const jsonPlaceholderProxy = createProxyMiddleware({
	target: 'http://127.0.0.1:7002',
	router: function(req) {
		// req.body = {
		// 	host: "http://172.17.1.58:31380",
		// 	path: "/baseline/upms-provider/platform/menu/tree",
		// 	loginPath: "/baseline/upms-provider/platform/login",
		// 	loginContent: JSON.stringify({password: "supconit",  username: "admin"})
		// }
		Object.assign(params, {
			...req.query
		})
		req.query = {};
    return params.host + params.path;
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	onProxyReq: (proxyReq, req, res) => {
		// const host = 'http://localhost:7002';
		// 请求拦截
		const session =	globUserCache.get(params.host) ?? '';
		proxyReq.path = proxyReq.path.split('/proxy')[0];
		proxyReq.setHeader('cookie', session)
	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
		// 响应拦截
		const exchange = `[代理地址映射] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    // res.setHeader('content-type', 'application/json; charset=utf-8');
		console.log(chalk.yellow(exchange))
		console.log(chalk.green(buffer.toString('utf8')))
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		let myPromise = null
		if (proxyResponseObj.message.indexOf('未登录') > -1) {
			// 走重新登录逻辑
			console.log(chalk.green('重新登录'),params.loginContent)
			const loginUrl = `${params.host}${params.loginPath}`
			myPromise = () => {
				return new Promise(resolve => {
					axios({
						method: 'post',
						url: loginUrl,
						data: JSON.parse(params.loginContent)
					}).then((res) => {
						const cookie = res.headers['set-cookie']
						console.log(cookie, 'cookie')
						globUserCache.set(params.host, cookie);
						// 登录成功，重新进行请求
						console.log(chalk.green('重新发起请求'))
						const reUrl = `${params.host}${params.path}`
						axios({
							method: 'get',
							url: reUrl,
							headers: {
								cookie: cookie
							}
						}).then(logRes => {
							resolve(logRes)
						}).catch(err => {
							console.log(chalk.red(err), '重新失败请求')
						})
					}).catch(errObj => {

					})
				})
			}


		}
		const result = await myPromise()
		return JSON.stringify(result.data)
  },
	),
});

const app = express();
const jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use('/proxy',urlencodedParser, jsonPlaceholderProxy);



app.listen(3001);

console.log('[DEMO] Server: listening on port 3001');
console.log('[DEMO] Opening: http://localhost:3001/api/table/list1');

