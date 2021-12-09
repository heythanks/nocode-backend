const template = require('art-template');
const path = require('path');//路径处理

const { handleFileDownload, writePages } = require('../utils/utils');
const fs = require('fs');//文件系统
const send = require('koa-send');
const archiver = require('archiver');//跨平台实现打包功能模块，支持zip和tar格式
const { emptyDirectory, deepCloneDirectory, zipDirectory } = require('../utils/fileHelper');
const git = require('../utils/gitHelper');
const { transferStr, getGitReposName } = require('../utils/utils');
const { BUILD_PATH, TEMP_ZIP_NAME, ROUTER_PATH, GIT_STORE_PATH_NAME, GIT_BUILD_ZIP } = require('../utils/consts');
const child_process = require('child_process');
const { successResponse, errorResponse } = require('../utils/response');
const { info, error } = require('../utils/log4j');
const gitJson = require(path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/index.json`));

/**
 * @name 罗婵
 * @Date 2021-11-24 13:26:37
 * @introduction 接收到配置数据后将json转为.vue文件
 * @description 
 * @param {object} ctx 上下文
 * @param {object[]} ctx.request.body.comJSON 组件json配置
 * @param {string} ctx.request.body.fileName 文件名称
 * @return {*}
 * @exception 
 */
const receiveJsonToFile = async (ctx) => {
  const {fileName = '', comJSON = []} = ctx.request.body;
  //一对一：tableStack-paginationStack
  const cache = {
    tableStack: [],
    paginationStack: []
  };
  const oneTo1 = ['table', 'pagination'];

  const dir = path.resolve(`${BUILD_PATH}/${fileName}`);
  let htmlStr = '',
    dataStr = '',
    methodStr = '',
    mountedStr = '';
  comJSON.forEach((ele, index) => {
    if (oneTo1.indexOf(ele.type) > -1) {
      cache[`${ele.type}Stack`].push(ele.path);
    };
  });
  //对表格和分页组件进行绑定
  const minLen = Math.min(cache.tableStack.length, cache.paginationStack.length);
  const tableMapPagination = new Map();
  const paginationMapTable = new Map();
  //需要引入的一些工具函数
  const importUtil = {
    fetch: false,
  }
  for (let i = 0; i < minLen; i++) {
    const currentTable = cache.tableStack.shift();
    const currentPagination = cache.paginationStack.shift();
    tableMapPagination.set(currentTable, currentPagination);
    paginationMapTable.set(currentPagination, currentTable)
  };

  comJSON.forEach((ele, index) => {
    const mapData = {
      table: tableMapPagination,
      pagination: paginationMapTable
    };
    const linkPath = mapData[ele.type].get(ele.path);

    //绑定关联的分页组件
    ele.linkPath = linkPath ?? null;
    if (ele?.fetchConfig?.url) {
      if (!importUtil?.fetch) {
        importUtil.fetch = true
      }
      mountedStr = mountedStr + `this.query${ele.type}${ele.path}(); \n`;
    }

    const view = template(path.resolve(`./template/${ele.type}/view.art`), { data: ele });
    const data = template(path.resolve(`./template/${ele.type}/data.art`), { data: ele });
    const method = template(path.resolve(`./template/${ele.type}/method.art`), { data: ele });
    htmlStr += view;
    dataStr += data;
    methodStr += method;
  });
  const opts = {
    htmlStr: htmlStr,
    dataStr: dataStr,
    methodStr: methodStr,
    mountedStr,
    importUtil,
  };
  //将内容组装
  const result = transferStr(opts);
  const fileContent = {
    vueFile: result,
    jsonFile: JSON.stringify(comJSON, null, 2)
  };
  const hasBuild = fs.existsSync(dir);
  !hasBuild && fs.mkdirSync(dir);
  hasBuild && emptyDirectory(dir);
  //文件写入
  await writePages(fileContent, dir);
};
/**
 * @name 罗婵
 * @Date 2021-11-25 09:47:45
 * @introduction 重写git项目router文件
 * @description 
 * @param {object} opts
 * @param {string} opts.repositoryName
 * @param {string} opts.routerName
 * @return {*} 
 * @exception 
 */
const rewriteRouterConfig = (opts) => {
  const { repositoryName, routerName } = opts;
  const routerPath = path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/${repositoryName}/${ROUTER_PATH}`);
  let str = fs.readFileSync(routerPath, 'utf-8')
  // str = str.replace('Vue.use(VueRouter)', `const ${routerName} = ()=>import("../views/${routerName}/index.vue");\nVue.use(VueRouter)`);
  // str = str.replace(/\}\]/, `},\n{ \npath: '/${routerName}',\n name: '${routerName}',\ncomponent: ${routerName},\n}]`)
  str = str.replace(/\}\n/, `}, {
    path: '/${routerName}',
    name: '${routerName}',
    title: '${routerName}页面',
    component: () => import('../pages/${routerName}/index.vue') 
  }\n`)
  fs.writeFileSync(routerPath, str, 'utf-8');
}

/**
 * @name 罗婵
 * @Date 2021-11-25 09:55:10
 * @introduction 项目clone, 写入文件
 * @description 未存在的git仓库进行克隆，存在的仓库pull远程代码，新建vue页面到对应仓库
 * @param {*} ctx
 * @param {string} ctx.fileName 文件名称
 * @param {string} ctx.gitAddress git仓库远程地址
 * @param {string} ctx.routerName 新建页面路由名称
 * @return {*}
 * @exception 
 */
const postConfigPushGit = async (ctx) => {
  const { fileName, gitAddress, routerName } = ctx.request.body;
  const repositoryName = getGitReposName(gitAddress);
  const pt = path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/${repositoryName}`);
  let operateResult = true;
  if (!gitJson[repositoryName]) {
    operateResult = git.addSubmodule(gitAddress, pt, ctx);
  } else {
    //子仓库存在，拉最新代码后重写index.json, 进入子仓库进行代码拉取
    operateResult = git.pullMaster(pt, ctx);
  };
  if (!operateResult) return operateResult;
  //重写gitJson数据
  git.rewriteGitJson();
  //判断路由是否冲突，如果冲突则阻断操作
  if (Object.keys(gitJson[repositoryName] || []).indexOf(routerName.trim()) > -1) {
    return errorResponse(ctx, '路由冲突了');
  };
  if (/^\d+/.test(routerName.trim())) {
    //在修改路由文件时，将路由名称设置为变量，不符合js变量声明规范
    return errorResponse(ctx, '路由不能以数字开头');
  }
  //做读写操作
  await receiveJsonToFile(ctx);
  // const pagePath = `src/views/${routerName}`
  const pagePath = `packages/pkg_config/pages/${routerName}`
  const copyPath = {
    source: path.resolve(`${BUILD_PATH}/${fileName}`),
    target: path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/${repositoryName}/${pagePath}`)
  };
  //文件克隆
  deepCloneDirectory(copyPath.source, copyPath.target);
  //改写路由文件
  rewriteRouterConfig({
    repositoryName, routerName
  });
  successResponse(ctx, {
    msg: '成功提交git上传信息'
  });
};

/**
 * @name 罗婵
 * @Date 2021-11-25 09:26:10
 * @introduction 更新git仓库
 * @description 
 * @param {object} ctx
 * @param {string} ctx.params.routerName 提交页面的路由名称
 * @param {string} ctx.params.gitName git仓库远程名称
 * @return {*}
 * @exception 
 */
const putChangeToGits = async (ctx) => {
  const { gitName, routerName } = ctx.params;
  //git提交
  try {
    await git.pushCode({
      msg: `增加页面${routerName}`,
      gitReposName: gitName
    });
    successResponse(ctx, { msg: 'git提交成功' })
  } catch (err) {
    error(err);
  };
};
/**
 * @name 罗婵
 * @Date 2021-11-25 09:26:44
 * @introduction 提交前台数据，打包文件
 * @description 将page打包的压缩文件返回前台下载
 * @param {object} ctx
 * @param {string} ctx.request.body.fileName 文件名称
 * @return {*}
 * @exception 
 */
const postConfig = async (ctx) => {
  const { fileName = '' } = ctx.request.body;
  receiveJsonToFile(ctx);
  //-------------------------------文件打包为zip,返回ctx.body = stream--------------
  const resolvePath = path.resolve(`${BUILD_PATH}/${fileName}`);
  const zipName = TEMP_ZIP_NAME;
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
  zip.directory(`${resolvePath}`, 'pages');
  zip.pipe(zipStream);
  //完成存档
  await zip.finalize();
  //传给前端一个可下载数据， 以附件形式下载
  ctx.attachment(zipName);
  //通过send-koa中间件设置ctx.body、response header
  await send(ctx, zipName);

};


/**
 * @name 罗婵
 * @Date 2021-11-24 13:23:51
 * @introduction 资源拉取并打包
 * @description 
 * @param {object} ctx
 * @param {string} ctx.request.body.gitAddress 仓库地址
 * @return {*}
 * @exception 
 */
const getGitsSource = async (ctx) => {
  const { gitName = '' } = ctx.params;
  const repositoryName = gitName;
  let pt = path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/${repositoryName}`);
  if (pt) {
    try { fs.statSync(pt) } catch(err) { return errorResponse(ctx, '仓库暂不存在，需要重新获取') }
  }
  try {
    child_process.spawnSync('yarn', null, {
      cwd: pt
    });
    //执行该命令后生成dist目录
    child_process.spawnSync('yarn', ['build'], {
      cwd: pt
    });
  } catch(err) {
    errorResponse(ctx, `${gitName}仓库资源打包失败`);
    return false;
  }
  //命名一个zip文件
  const zipPath = path.resolve(__dirname, `../${GIT_BUILD_ZIP}/${repositoryName}.zip`);
  //创建一个文件以存档数据流传输到其中
  const zipStream = fs.createWriteStream(zipPath);
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
  zip.directory(`${pt}/dist`, repositoryName);
  zip.pipe(zipStream);
  //完成存档
  await zip.finalize();
  //以附件形式下载，约定filename不用引号，所以自己设置content-disposition
  ctx.set('content-disposition', `attachment;filename=${repositoryName}.zip`);
  //通过send-koa中间件设置ctx.body、response header, 调试时发现不能使用绝对路径
  await send(ctx, `${GIT_BUILD_ZIP}/${repositoryName}.zip`, {});

};



 

module.exports = {
  postConfig,
  postConfigPushGit,
  putChangeToGits,
  getGitsSource,
}