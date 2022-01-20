
const axios = require('axios').default;
// import router from '@/router/staticRouteCase'
// import { copyTextToCilpBoard } from '@/utils/common'
const path = require('path');
const Cache = require(path.resolve(__dirname, 'cache.js'))
const baseURL = Cache.getBaseURL()


function resolveErrorCode (res) {
  const { status } = res
  if (status === 401 || status === 403) {
    // Message({
    //   message: `${res.data.message}`,
    //   type: 'error',
    //   showClose: true,
    //   duration: 2000
    // })
		return res.data
    // router.push({ path: '/login', replace: true })
    // window.winRouter.push({ path: '/login', replace: true })
  }
}

const request = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
		'Accept-Encoding': 'gzip, deflate, br'
  }
})

request.interceptors.request.use(
  cfg => cfg,
  (err) => {
    console.log(err)
    Promise.reject(err)
  }
)

request.interceptors.response.use(
  (res) => {
    // 这里根据状态码统一处理所有异常

    if (res.status && res.status !== 200) {
      resolveErrorCode(res)
    }

    if (res.data.status === false) {
      // Message({
      //   message: `${res.data.message}`,
      //   type: 'error',
      //   showClose: true,
      //   duration: 2000
      // })
      return Promise.reject(new Error(res.data.message))
    }

    return res
  },
  (err) => {
    const { response } = err
    if (response.data.status) {
      // Message({
      //   message: `${response.data.status}: ${response.data.message}`,
      //   type: 'error',
      //   showClose: true,
      //   duration: 2000
      // })
    }
    if (response.status === 500) {
      // 点击关闭时的回调函数
      // const closeMethod = function () {
      //   if (response.data && response.data.data && response.data.data.uuid) {
      //     copyTextToCilpBoard(response.data.data.uuid)
      //   }
      // }
      // Message.error({
      //   showClose: true,
      //   message: `${response.data.message}`,
      //   onClose: closeMethod
      // })
    }
    if (response.status) {
      resolveErrorCode(response)
    }

    return Promise.reject(err)
  }
)
module.exports = request
