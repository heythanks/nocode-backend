const path = require('path')
const request = require(path.resolve(__dirname, '../utils/request'))

// 返回res.data.data
const fetch = (options) => new Promise((resolve, reject) => {
  request(options)
    .then(res => resolve(res.data.data))
    .catch(err => reject(err))
})


const get = (url, data = {}, options = {}) => fetch({ url, method: 'get', params: data, ...options })



const post = (url, data = {}, options = {}) => fetch({ url, method: 'post', data, ...options })

module.exports = {
	get,
	post
}









