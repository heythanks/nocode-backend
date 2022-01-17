// http://172.17.1.58:31380/baseline/upms-provider/platform/organization/user/info
// 测试地址：
const express = require('express');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const axios = require('axios').default;
const globUserCache = require('./utils/cache')
const chalk = require('chalk')
const query = {}
axios.interceptors.request.use(function (config) {
	// Do something before request is sent
	console.log(chalk.green(`[发起请求]：[${config.method}]->${config.url}`))
	console.log(config)
	return config;
}, function (error) {
	// Do something with request error
	return Promise.reject(error);
});
/**
 * Configure proxy middleware
 */
 const jsonPlaceholderProxy = createProxyMiddleware({
	router: function(req) {
		console.log(chalk.red(req), 'req')
		console.log(req.query, 'req');
		Object.assign(query, {
			...req.query
		})
    return query.host + query.path;
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	onProxyReq: (proxyReq, req, res) => {
		// const host = 'http://localhost:7002';
		const session =	globUserCache.get(query.host) ?? '';
		proxyReq.setHeader('cookie', session)
	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
    // 代理进行数据响应
		const exchange = `[DEBUG] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    // res.setHeader('content-type', 'application/json; charset=utf-8');
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		let myPromise = null
		if (proxyResponseObj.message.indexOf('未登录') > -1) {
			// 走重新登录逻辑
			console.log(chalk.green('重新登录'))
			const loginUrl = 'http://172.17.1.58:31380/baseline/upms-provider/platform/login'
			myPromise = () => {
				return new Promise(resolve => {
					axios({
						method: 'post',
						url: loginUrl,
						data: {
							password: "supconit",
							username: "admin"
						}
					}).then((res) => {
						const cookie = res.headers['set-cookie']
						console.log(cookie, 'cookie')
						globUserCache.set(query.host, cookie);
						// 登录成功，重新进行请求
						console.log(chalk.green('重新发起请求'))
						const reUrl = `${query.host}${query.path}`
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
					}).catch(err => {
						console.log(err, '登录接口报错')
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

/**
 * Add the proxy to express
 */
app.use('/proxy', jsonPlaceholderProxy);

app.listen(3001);

console.log('[DEMO] Server: listening on port 3001');
console.log('[DEMO] Opening: http://localhost:3001/proxy?host=http://172.17.1.58:31380&path=/baseline/upms-provider/platform/menu/tree');

