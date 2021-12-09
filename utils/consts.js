const HTML_ENTITY = {
  '&#34;': '"'
};
const FILE_CONTENT_MAP = {
  vueFile: '',//vue文件内容index.vue
  jsonFile: '',//配置文件内容index.json
};
const BUILD_PATH = './build';
const TEMP_ZIP_NAME = 'pages.zip';
const GIT_STORE_PATH_NAME = 'gitRepository';//git仓库地址
const GIT_BUILD_ZIP = 'gitRepositoryZip';//git打包后存放路径
const ROUTER_PATH = 'packages/pkg_config/router/index.js';
const TABLE_DATA = (pageSize, current) => {
  console.log(pageSize, current, 'dddd')
  const falsyData = new Array(100).fill(false).map(ele => {
    const random = ('' + Math.random(10)).slice(10) + '页面' + current;
    return {
      name: `姓名1${random}`,
      date: `日期${random}`,
      address: `地址${random}`,
    }
  });
  const result = falsyData.slice(pageSize * (current - 1), pageSize * current - 1);
  return result;
};

module.exports = {
  HTML_ENTITY,
  FILE_CONTENT_MAP,
  BUILD_PATH,
  TEMP_ZIP_NAME,
  TABLE_DATA,
  GIT_STORE_PATH_NAME,
  ROUTER_PATH,
  GIT_BUILD_ZIP
}