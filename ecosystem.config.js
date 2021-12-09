module.exports = {
  apps : [{
    name: 'nocode',
    script: 'app.js',
    watch: [
      'app.js',
      'controllers',
      'routes',
      'utils',
    ],
    ignore_watch: [
      'node_modules',
      'logs',
      'template'
    ],
    // error_file: './logs/',
    // out_file: '',
    env: {
      NODE_ENV: 'production'
    }
  }],
  deploy : {
    production : {
      key: '',
      user : '罗婵',
      //服务器ip
      host : '8.142.66.4',
      //远程分支
      ref  : 'master',
      //仓库地址
      repo : 'git@github.com:heythanks/nocode-backend.git',
      //项目要部署到服务器上的位置，PM2默认会部署到该路径的source子文件夹下
      path : '/usr/local/html',
      //服务器下载到最新的代码之后要执行命令
      'post-deploy' : 'yarn && pm2 reload ecosystem.config.js --env production',
    }
  }
};
