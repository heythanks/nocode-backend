
const axios = require('axios').default
const path = require('path');
const querystring = require('querystring')
const globUserCache = require(path.resolve(__dirname, '../utils/cache'))
const chalk = require('chalk')
/**
 * @name 罗婵
 * @Date 2022-01-21 10:13:51
 * @introduction 重新登录接口
 * @description 由于接口代理不能正确拿到cookie
 * @param {*}
 * @return {*}
 * @exception
 */
const loginProxy = (opts = {}) => {
	console.log(chalk.red(11111))
	const { host, loginContent, loginPath, userCookie } = opts;
	let errMsg = '';
	if(!loginPath) {
		errMsg = '未传入login地址'
	}
	return new Promise((resolve,reject) => {
		if(errMsg) return reject(errMsg)
		axios({
			method: 'post',
			url: `${host}${loginPath}`,
			data: querystring.parse(loginContent)
		}).then(async (res) => {
			console.log(chalk.green('重新登录成功'))
			const cookie = res.headers['set-cookie']
			globUserCache.set({
				type: 'userLoginInfoMap',
				key: cookie,
				val: {
					session: cookie,
					loginContent: {
						path: loginPath,
						loginBodyStr: loginContent
					}
				},
				isParent: true
			})
			resolve(res)
		}).catch(errObj => {
			console.log(chalk.red('登录请求失败'))
			console.log(errObj)
		})
	})
}

module.exports = {
	loginProxy
}
