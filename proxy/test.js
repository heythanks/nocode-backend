const axios = require('axios');
const chalk = require('chalk');

const loginUrl = 'http://127.0.0.1:7002/api/table/list1';
axios({
	method: 'get',
	url: loginUrl
})
	.then((res) => {
		// console.log(JSON.stringify(res))
		const cookie = res.headers['set-cookie'];
		const host = 'http://127.0.0.1:7001';
		// globUserCache.set(host, cookie);
		// 登录成功，重新进行请求
		const reUrl = 'http://127.0.0.1:7002/api/table/list1';
		axios({
			method: 'get',
			url: reUrl
		})
			.then((res) => {
				console.log(chalk.green('重新成功请求'));
				console.log(res, '重新成功请求');
			})
			.catch((err) => {
				console.log(chalk.red('重新失败请求'));
				console.log(err);
			});
	})
	.catch((err) => {
		console.log(err, '登录接口报错');
	});
