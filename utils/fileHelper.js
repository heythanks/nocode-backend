//文件相关处理函数
const fs = require('fs');
const path = require('path');
const send = require('koa-send');
const { getGitReposName } = require('../utils/utils');
const archiver = require('archiver');
const { info } = require('../utils/log4j');
/**
 * @name 罗婵
 * @Date 2021-11-15 10:25:00
 * @introduction 清空文件夹
 * @description 
 * @param {string} path 删除文件的目录
 * @return {无}
 * @exception 
 */
const emptyDirectory = function (pt) {
  fs.rmdirSync(pt, {
    recursive: true, force: true
  });
  fs.mkdirSync(pt);
};
/**
 * @name 罗婵
 * @Date 2021-11-22 13:08:08
 * @introduction 是否为文件夹
 * @description 
 * @param {string} pt
 * @return {*}
 * @exception 
 */
const isDirectory = function (pt) {
  let stat = null;
  let result = false;
  try {
    stat = fs.statSync(pt);
    result = stat.isDirectory()
  } catch (err) {
    console.log(err);
  };
  return result;
};
/**
 * @name 罗婵
 * @Date 2021-11-22 13:25:27
 * @introduction 判断是否为文件
 * @description 
 * @param {string} pt
 * @return {*}
 * @exception 
 */
const isFile = function (pt) {
  const stat = null;
  let result = false;
  try {
    stat = fs.statSync(pt);
    result = stat.isFile()
  } catch (err) {
    console.log(err);
  };
  return result;
};
const exist = function (pt) {
  try {
    accessSync(pt, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  };
};
/**
 * @name 罗婵
 * @Date 2021-11-22 13:09:11
 * @introduction 文件夹拷贝
 * @description 
 * @param {string} origin 拷贝的文件路径
 * @param {string} target 拷贝至目标路径
 * @return {*}
 * @exception 
 */
const deepCloneDirectory = function (origin, target) {
  const fileType = isDirectory(origin) ? 'dir' : 'file';
  if (!exist(target) && target.indexOf('.') === -1) {
    //目标路径不存在并且为目录，则创建目录
    fs.mkdirSync(target);
  }
  let files = null;
  if (fileType === 'dir') {
    //如果是文件夹
    files = fs.readdirSync(origin);
    for (let i = 0; i < files.length; i++) {
      const newPath = path.join(origin, files[i])
      const itemIsDirectory = isDirectory(newPath);
      if (itemIsDirectory) {
        const newTarget = path.join(target, files[i]);
        fs.mkdirSync(newTarget);
        deepCloneDirectory(newPath, newTarget);
        return false;
      };
      const resolvePath = path.join(origin, files[i]);
      //TODO：现在为串行读写，后期可优化为并行读写
      const fileContent = fs.readFileSync(resolvePath, 'utf-8');
      fs.writeFileSync(path.join(target, files[i]), fileContent);
    }
  }
};
/**
 * @name 罗婵
 * @Date 2021-11-29 11:23:14
 * @introduction 文件夹压缩后返回文件流
 * @description 
 * @param {string} address 仓库git地址
 * @param {string} resolvePath git仓库的在本地的路径
 * @param {object} ctx 上下文
 * @return {无}
 * @exception 
 */
const zipDirectory = async function (address="", resolvePath="", ctx={}) {
  const repositoryName = getGitReposName(address);
  //命名一个zip文件
  const zipName = `${repositoryName}.zip`;
  //创建一个文件以存档数据流传输到其中
  const zipStream = fs.createWriteStream(zipName);
  const zip = archiver('zip');
  const eventWatcher = () => {
    zipStream.on('close', function () {
      //存档已完成，且文档输出符已关闭
      info(zip.pointer() + ' total bytes');
    });
    zip.on('warning', function (err) {
      info(`${err.code}:${err}`)
    });
    zip.on('error', function (err) {
      throw err;
    });
  };
  eventWatcher();
  zip.directory(`${resolvePath}/dist`, `${repositoryName}`);
  zip.pipe(zipStream);
  //完成存档
  await zip.finalize();
  //传给前端一个可下载数据， 以附件形式下载
  ctx.attachment(zipName);
  //通过send-koa中间件设置ctx.body、response header
  await send(ctx, zipName);
};
module.exports = {
  emptyDirectory,
  isDirectory,
  isFile,
  deepCloneDirectory,
  zipDirectory
}