const fs = require('fs');//文件系统
const send = require('koa-send');
const archiver = require('archiver');//跨平台实现打包功能模块，支持zip和tar格式
const path = require('path');
const template = require('art-template');

const { HTML_ENTITY, FILE_CONTENT_MAP, BUILD_PATH, TEMP_ZIP_NAME } = require('./consts');
/**
 * @name 罗婵
 * @Date 2021-11-14 07:04:27
 * @introduction 通过get请求获取静态资源
 * @description 提供文件下载列表，将文件打包为zip下载
 * @param {Array} fileList 需要下载的文件列表 ['build/index.json']
 * @param {Object} ctx koa上下文 
 * @param {String} resolvePath 需要下载的文件目录,提供绝对路径 
 * @return {无}
 * @exception 
 */
const handleFileDownload = async (ctx, fileList, resolvePath) => {
  const zipName = 'pages.zip';
  //创建一个文件以存档数据流传输到其中
  const zipStream = fs.createWriteStream(zipName);

  const zip = archiver('zip');
  zip.directory(`${resolvePath}`, 'pages');

  zip.on('error', function (err) {
    console.log('zip error', err)
    throw err;
  });
  zipStream.on('close', function () {
    //存档已完成，且文档输出符已关闭
    console.log(zip.pointer() + ' total bytes');
  });
  zip.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });
  zip.pipe(zipStream);
  //完成存档
  await zip.finalize();
  //传给前端一个可下载数据， 以附件形式下载
  ctx.attachment(zipName);
  console.log('发送文件1', zipName);
  await send(ctx, zipName);
  console.log('发送文件2');
};
/**
 * @name 罗婵
 * @Date 2021-11-14 07:43:51
 * @introduction 获取html实体映射表
 * @description 
 * @param {无}
 * @return {Object}
 * @exception 
 */
const getHtmlEntity = function () {
  return HTML_ENTITY
};
/**
 * @name 罗婵
 * @Date 2021-11-15 14:03:37
 * @introduction 需求文件写入
 * @description 
 * @param {FILE_CONTENT_MAP} options 配置数据与FILE_CONTENT_MAP进行合并
 * @param {String} fileName 写入文件的名称
 * @return {*}
 * @exception 
 */
const writePages = function (options, fileName) {
  const newOpts = Object.assign({}, FILE_CONTENT_MAP, options);
  const promiseArr = [];
  return new Promise((resolveWrite, rejectWrite) => {
    try {
      for (let key in newOpts) {
        switch (key) {
          case 'vueFile':
            //vue文件写入;
            const vueFilePromise = new Promise((resolve, reject) => {
              fs.writeFile(`${fileName}/index.vue`, newOpts[key], function () {
                resolve();
              });
            });
            promiseArr.push(vueFilePromise)
            break;
          case 'jsonFile':
            //json文件写入;
            const jsonFilePromise = new Promise((resolve, reject) => {
              fs.writeFile(`${fileName}/index.json`, newOpts[key], function () {
                resolve();
              });
            });
            promiseArr.push(jsonFilePromise);
            break;
        }
      }
      Promise.all(promiseArr).then(resolve => {
        resolveWrite('写入成功')
      });
    } catch (err) {
      rejectWrite(JSON.stringify(err))
    }

  });
};
/**
 * @name 罗婵
 * @Date 2021-11-15 16:09:36
 * @introduction 将渲染的模版代码拼接
 * @description 
 * @param {object} options 模版渲染后的string
 * @param {string} options.htmlStr 模版渲染模版代码
 * @param {string} options.dataStr 模版渲染data数据声明
 * @param {string} options.methodStr 模版渲染methods方法声明
 * @param {string} options.importUtil 模版渲染后的import工具函数
 * @param {string} options.mountedStr 模版渲染后的mounted中函数调用
 * @return {*}
 * @exception 
 */
const transferStr = function (options) {
  const { htmlStr, dataStr, methodStr, importUtil, mountedStr } = options;
  let importStr = '';
  const importMap = {
    fetch: 'import fetch from "@base/utils/fetch";'
  }
  for (let key in importUtil) {
    importUtil[key] && (importStr += importMap[key] + '\n')
  }
  let result = '';
  result = `<template>\n
  <div>${htmlStr}</div> \n
</template>\n
<script>\n
${importStr ? importStr : ''}
export default {\n
  data(){\n
    return {\n
      ${dataStr}\n
    }\n
  },\n
  mounted() {\n
    ${mountedStr}
  },
  methods: {\n
    ${methodStr}\n
  }\n
}\n
</script> `

  // template(path.resolve('./template/common/vue.art'), {data: options} );
  return result;
};
/**
 * @name 罗婵
 * @Date 2021-11-29 09:47:53
 * @introduction 获取git仓库文件名称
 * @description 
 * @param {string} address
 * @return {*}
 * @exception 
 */
const getGitReposName = function (address = '') {
  const name = address.split('/').pop().replace('.git', '');
  return name;
};

module.exports = {
  handleFileDownload,
  getHtmlEntity,
  writePages,
  transferStr,
  getGitReposName
}