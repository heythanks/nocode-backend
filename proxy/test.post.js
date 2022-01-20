const axios = require('axios');
const chalk = require('chalk');

const loginUrl = 'http://127.0.0.1:7002/api/table/list1';
axios({
	method: 'post',
	url: 'http://172.17.1.58:32180/gateway/upms-provider/api/platform/file/downFilesZip',
	data: {
		marks: '["1"]'
	},
	headers: {
		'content-type': 'application/json',
		'Accept-Encoding': 'gzip, deflate, br'
	},
})
	.then((res) => {
		// console.log(JSON.stringify(res))
		console.log(res, 'resss')
	})
	.catch((err) => {
		console.log(err, '登录接口报错');
	});
