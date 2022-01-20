/**
 * 实现get请求代理实现 queryContent需要前端encodeURIComponent
 */
const express = require('express');
const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const axios = require('axios').default;
const globUserCache = require('./utils/cache')
const chalk = require('chalk')
const { cwd } = require('process')
const bodyParser = require('body-parser')
const querystring = require('querystring');
const params = Object.create(null)

const currentPath = cwd();

// 统一处理请求拦截器
 axios.interceptors.request.use(function (config) {
	// Do something before request is sent
	console.log(chalk.green(`[发起请求]：[${config.method}]->${config.url}`))
	// const loginUrl = `${params.host}${params.loginPath}`
	// if (loginUrl !== config.url && params?.queryContent) {
	// 	//如果当前请求地址不等于配置地址，并且queryString存在，将querystring拼接
	// 	const unescapeStr = params?.queryContent;
	// 	config.url = `${config.url}?${unescapeStr}`
	// }
	console.log(chalk.yellow(config.url))
	console.log(config, '99')
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
	const { cookie = '', params={}} = opts;
	const { host, path } = params;
	console.log(chalk.green('[加入cookie重新请求]'))
	const reUrl = `${host}${path}`;
	return new Promise((resolve, reject) => {
		axios({
			method: 'post',
			url: reUrl,
			data: params.queryContent,
			headers: {
				'content-type': 'application/json',
				'Accept-Encoding': 'gzip, deflate, br'
			}
		}).then(logRes => {
			resolve(logRes)
		}).catch(err => {
			reject(err)
			console.log(chalk.red(`${err} 报错位置：${currentPath}`))
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
			data: loginContent
		}).then(async (res) => {
			const cookie = res.headers['set-cookie']
			globUserCache.set(host, cookie)
			const result = await restartRequest({cookie,params})
			resolve(result)
		}).catch(errObj => {
			reject(errObj)
		})
	})
}
/**
 * Configure proxy middleware
 */
 const jsonPlaceholderProxy = createProxyMiddleware({
	target: 'http:127.0.0.1',
	router: function(req) {
		// const parseKeyList = ['loginContent', 'queryContent']
		// parseKeyList.forEach(ele => {
		// 	req.body[ele] = JSON.parse(req.body[ele])
		// })
		// router重写
		Object.assign(params, {
			...req.body
		})
    return params.host + params.path;
	},
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
	selfHandleResponse: true,
	logLevel: 'debug',
	onProxyReq: (proxyReq, req, res) => {
		// 代理请求拦截处理
		console.log(req.body)
		console.log(req)
		const requestBody = req.body.queryContent;
		const session =	globUserCache.get(params.host) ?? '';
		proxyReq.path = proxyReq.path.split('/proxy')[0];
		// proxyReq.body = JSON.parse(req.body.queryContent);
    const contentType = proxyReq.getHeader('Content-Type');
		console.log(chalk.red(contentType))
		console.log(proxyReq, 'proxyReq')
		// console.log((proxyReq.body), '999', typeof proxyReq.body)
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
		// proxyReq.setHeader('cookie', session)
	},
	onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
		// 响应拦截
		const exchange = `[代理地址映射] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    // res.setHeader('content-type', 'application/json; charset=utf-8');
		console.log(chalk.yellow(exchange))
		// console.log(chalk.green(buffer.toString('utf8')))
		const proxyResponseObj = JSON.parse(buffer.toString('utf8'))
		console.log(proxyResponseObj, 'proxyResponseObj')
		const loginUrl = `${params.host}${params.loginPath}`
		try {
			if (proxyResponseObj?.message?.indexOf('未登录') > -1) {
				// 走重新登录逻辑
				console.log(chalk.green('重新登录'))
				const result = await reLogin({loginUrl, params})
				return JSON.stringify(result.data)
			} else {
				let result = Object.create(null)
				try {
					result = await restartRequest({params});
					return JSON.stringify(result.data)
				} catch(err) {
					console.log(chalk.red('重新登录报错'))
					return JSON.stringify(err.response.data)
				}
			}
		} catch(err) {
			return err
		}

  },
	),
	onError: (err, req, res, target) => {
		console.log(chalk.red(err))
	}
});

const app = express();
// cookie清理
const clearCookie = () => {
	globUserCache.clear()
}
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json())
app.use('/proxy',urlencodedParser, jsonPlaceholderProxy);
app.use('/clear',urlencodedParser, clearCookie);



app.listen(3001);

console.log(chalk.green('[DEMO] Server: listening on port 3001'));
console.log(chalk.green('[DEMO] Opening: http://localhost:3001/api/table/list1'));

