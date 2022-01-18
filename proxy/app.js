/**
 * 实现get请求代理实现 queryContent需要前端encodeURIComponent
 */
const express = require('express');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const axios = require('axios').default;
const globUserCache = require('./utils/cache')
const chalk = require('chalk')
const bodyParser = require('body-parser')
// const querystring = require('querystring');
const params = Object.create(null)

// 统一处理请求拦截器
 axios.interceptors.request.use(function (config) {
	// Do something before request is sent
	console.log(chalk.green(`[发起请求]：[${config.method}]->${config.url}`))
	const loginUrl = `${params.host}${params.loginPath}`
	if (loginUrl !== config.url && params?.queryContent) {
		//如果当前请求地址不等于配置地址，并且queryString存在，将querystring拼接
		const unescapeStr = params?.queryContent;
		console.log(unescapeStr, 'unescapeStr')
		config.url = `${config.url}?${unescapeStr}`
	}
	console.log(chalk.yellow(config.url))
	return config;
}, function (error) {
	// Do something with request error
	return Promise.reject(error);
});

//统一处理响应拦截器
axios.interceptors.response.use(function (response) {
	return response;
}, function (error) {
	const errorLog = `[接口响应报错]：${error?.config?.url}:${error?.response?.data?.message}`
	// console.log(chalk.red(errorLog))
	return Promise.reject(error);
});
/**
 * @name 罗婵
 * @Date 2022-01-18 13:39:30
 * @introduction 重新发起请求
 * @description 将cookie带上
 * @param {*}
 * @return {*}
 * @exception
 */
const restartRequest = (opts = {}) => {
	const { cookie, params={}} = opts;
	const { host, path } = params;
	console.log(chalk.green('[加入cookie重新请求]'))
	const reUrl = `${host}${path}`;
	return new Promise((resolve, reject) => {
		axios({
			method: 'get',
			url: reUrl,
			headers: {
				cookie: globUserCache.get(host) || cookie
			}
		}).then(logRes => {
			resolve(logRes)
		}).catch(err => {
			console.log(err)
		})
	})

}
/**
 * @name 罗婵
 * @Date 2022-01-18 13:42:59
 * @introduction 系统登录
 * @description 无用户会话时进行系统登录
 * @param {*}
 * @return {*}
 * @exception
 */
let reLogin = (opts = {}) => {
	const { loginUrl, params = {} } = opts;
	const { loginContent, host } = params
	let errMsg = '';
	if(!loginUrl) {
		errMsg = '未传入login地址'
	}
	return new Promise((resolve,reject) => {
		if(errMsg) return reject(errMsg)
		axios({
			method: 'post',
			url: loginUrl,
			data: JSON.parse(loginContent)
		}).then(async (res) => {
			const cookie = res.headers['set-cookie']
			globUserCache.set(host, cookie)
			const result = await restartRequest({cookie,params})
			resolve(result)
		}).catch(errObj => {
			reject(errObj)
			// console.log(chalk.red('登录请求失败'))
		})
	})
}
/**
 * Configure proxy middleware
 */
 const jsonPlaceholderProxy = createProxyMiddleware({
	target: 'http://127.0.0.1:7002',
	router: function(req) {
		// req.query.path = decodeURIComponent(req.query.path)
		console.log(JSON.stringify(req.query));
		// router重写
		Object.assign(params, {
			...req.query
		})
		// req.query = {};
    return params.host + params.path;
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	onProxyReq: (proxyReq, req, res) => {
		// 代理请求拦截处理
		const session =	globUserCache.get(params.host) ?? '';
		proxyReq.path = proxyReq.path.split('/proxy')[0];
		proxyReq.setHeader('cookie', session)
	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
		// 响应拦截
		const exchange = `[代理地址映射] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    // res.setHeader('content-type', 'application/json; charset=utf-8');
		console.log(chalk.yellow(exchange))
		// console.log(chalk.green(buffer.toString('utf8')))
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		const loginUrl = `${params.host}${params.loginPath}`
		try {
			if (proxyResponseObj?.message?.indexOf('未登录') > -1) {
				// 走重新登录逻辑
				const result = await reLogin({loginUrl, params})
				return JSON.stringify(result.data)
			} else {
				const result = await restartRequest({params});
				return JSON.stringify(result.data)
			}
		} catch(err) {
			return err
		}

  },
	),
});

const app = express();
const jsonParser = bodyParser.json()
// cookie清理
const clearCookie = () => {
	globUserCache.clear()
}
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use('/proxy',urlencodedParser, jsonPlaceholderProxy);
app.use('/clear',urlencodedParser, clearCookie);



app.listen(3001);

console.log('[DEMO] Server: listening on port 3001');
console.log('[DEMO] Opening: http://localhost:3001/api/table/list1');

