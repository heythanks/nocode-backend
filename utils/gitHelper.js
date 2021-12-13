const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const { GIT_STORE_PATH_NAME, ROUTER_PATH } = require("../utils/consts");
const { errorResponse } = require('../utils/response');
const { error } = require('../utils/log4j');

/**
 * @name 罗婵
 * @Date 2021-11-23 17:12:21
 * @introduction 解析路由文件
 * @description 解析路由文件，返回路由和组件的配置信息
 * @param {string} str
 * @return {object}
 * @exception 
 */
const parseJson = function (str) {
  //解析出路由和组件，拿到形似
  // "[
  //   {
  //     path: '/',
  //     name: 'Home',
  //     component: Home
  //   }
  // ]"
  try {
    let router = str.match(/\[(.|\n)*\]/)[0];
    if (router) {
      const list = [...router.matchAll(/(path\:(.[^,]*))|(name\:(.[^,]*))/g)];
      const reg = /'|\s|"/g;//去除前后空格和引号
      const comList = [];
      const routerList = [];
      list.forEach(ele => {
        const isCom = !!(ele[0].indexOf('name') > -1);
        let currentStr = '';
        if (isCom) {
          currentStr = ele[4];
          currentStr = currentStr.replace(reg, '');
          comList.push(currentStr);
        } else {
          currentStr = ele[2];
          currentStr = currentStr.replace(reg, '');
          routerList.push(currentStr);
        }
      });
      const routerMap = {}
      comList.forEach((ele, index) => {
        routerMap[ele] = routerList[index];
      });
      console.log(routerMap, 'routerMap');
      return routerMap;
    }
  }catch(err) {
    return {}
  }
  
}
const git = {
  /**
   * @name 罗婵
   * @Date 2021-11-22 15:14:19
   * @introduction 推送本地修改到远程
   * @description 
   * @param {object} opt
   * @return {*}
   * @exception 
   */
  pushCode: function (opt) {
    const {msg, gitReposName} = opt;
    const pt = path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}/${gitReposName}`);
    const addPromise = new Promise((resolve, reject) => {
      try {
        child_process.execSync(`git add .`,{
          cwd: pt
        });
        resolve()
      }catch(err) {
        reject(err)
      }
    });
    const commitPromise = new Promise((resolve, reject) => {
      try {
        child_process.execSync(`git commit -m ${msg}`,{
          cwd: pt
        });
        resolve()
      }catch(err) {
        reject(err)
      }
    });
    const pushPromise = new Promise((resolve, reject) => {
      try {
        child_process.execSync(`git push origin module/scdemo`,{
          cwd: pt
        });
        resolve()
      }catch(err) {
        reject(err)
      }
    });
    return Promise.all([addPromise, commitPromise, pushPromise])
  },
  /**
   * @name 罗婵
   * @Date 2021-11-23 17:13:09
   * @introduction 重写gitRepository/index.json
   * @description 
   * @param {*}
   * @return {无}
   * @exception 
   */
  rewriteGitJson: function () {
    const ptGit = path.resolve(__dirname, `../${GIT_STORE_PATH_NAME}`)
    const gitFileList = fs.readdirSync(ptGit);
    let gitJsonObj = {};
    gitFileList.forEach(ele => {
      const isFile = !!(ele.indexOf('.') > -1);
      if (!isFile) {
        let fileStr = '';
        try {
          fileStr = fs.readFileSync(`${ptGit}/${ele}/${ROUTER_PATH}`, 'utf-8');
        } catch (err) { }
        gitJsonObj[ele] = parseJson(fileStr);
      }
    });
    fs.writeFileSync(`${ptGit}/index.json`, JSON.stringify(gitJsonObj, null, 2));
  },
  /**
   * @name 罗婵
   * @Date 2021-11-29 11:26:08
   * @introduction 
   * @description 
   * @param {string} address git仓库地址
   * @param {string} directory 文件保存的目录
   * @param {object} ctx 上下文
   * @return {*}
   * @exception 
   */   
  addSubmodule: function(address = '',directory = '', ctx = {}) {
    const gitShell = `git submodule add ${address} ${directory}`;
    try {
      child_process.execSync(gitShell);
      return true;
    } catch (err) {
      error(err);
      errorResponse(ctx, '子仓库拉取失败');
      return false;
    }
  },
  /**
   * @name 罗婵
   * @Date 2021-11-29 10:14:14
   * @introduction 拉取主分支代码
   * @description 
   * @param {object} opt 子进程工作目录
   * @return {boolean} true为操作成功，false操作失败
   * @exception 
   */  
  /**
   * @name 罗婵
   * @Date 2021-11-29 11:27:54
   * @introduction 子仓库代码推送
   * @description 仅处理master分支
   * @param {string} cwd 子进程的工作路径
   * @param {*} ctx 上下文
   * @return {*}
   * @exception 
   */  
  pullMaster: function(cwd = '', ctx = {}) {
    try {
      child_process.execSync('git pull origin module/scdemo', { cwd });
      return true;
    } catch (err) {
      error(err);
      errorResponse(ctx, '子仓库代码推送失败');
      return false;
    }
  }
};

module.exports = git;