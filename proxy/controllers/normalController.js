const { createProxyMiddleware, RequestHandler, responseInterceptor, fixRequestBody } = require('http-proxy-middleware')
const chalk = require('chalk');
const params = Object.create(null);

const path = require('path')
const globUserCache = require(path.resolve(__dirname, '../utils/cache'))
const {get, post} = require(path.resolve(__dirname, '../utils/fetch'))



console.log(globUserCache, 'globUserCache')
const querystring = require('querystring')
const normalController = (req, res, next) => {
	const {query, body } = req;
	console.log(query, 'query')
	console.log(body, 'body')

}
module.exports = normalController
