const express = require('express');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const axios = require('axios').default;
const globUserCache = require('./utils/cache')
const chalk = require('chalk')
/**
 * Configure proxy middleware
 */
 const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://127.0.0.1:7002',
	router: {
		// '/api': 'http://127.0.0.1:7002/api',
		'dev.localhost:3001': 'http://localhost:7002',
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	onProxyReq: (proxyReq, req, res) => {
		const host = 'http://localhost:7002';
		const session =	globUserCache.get(host) ?? '';
		console.log(session, 'session')
		proxyReq.setHeader('cookie', session)
	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
    // 代理进行数据响应
		const exchange = `[DEBUG] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    console.log(chalk.red(exchange));
    // res.setHeader('content-type', 'application/json; charset=utf-8');
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		let myPromise = null
		if (proxyResponseObj.message.message.indexOf('未登录') > -1) {
			// 走重新登录逻辑
			console.log(chalk.green('重新登录'))
			const loginUrl = 'localhost://127.0.0.1:7002/api/table/list2'
			myPromise = () => {
				return new Promise(resolve => {
					axios({
						method: 'get',
						url: loginUrl,
					}).then((res) => {
						const cookie = res.headers['set-cookie']
						console.log(cookie, 'cookie')
						const host = 'http://127.0.0.1:7002';
						globUserCache.set(host, cookie);
						// 登录成功，重新进行请求
						console.log(chalk.green('重新发起请求'))
						const reUrl = `${host}/api/table/list1`
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
		console.log(JSON.stringify(result.data), '999')
		return JSON.stringify(result.data)
  },
	),
});

const app = express();

/**
 * Add the proxy to express
 */
app.use('/*', jsonPlaceholderProxy);

app.listen(3001);

console.log('[DEMO] Server: listening on port 3001');
console.log('[DEMO] Opening: http://localhost:3001/api/table/list1');

