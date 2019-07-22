'use strict'
const co = require('co');
const chalk = require('chalk');
const prompt = require('co-prompt');
const exec = require('child_process').exec;

const templates = require('../templates');

module.exports = () => {
  co(function* () {
    // 处理用户输入
    const tplName = yield prompt('输入想要的模板名: ');
    if (tplName !== 'all' && !templates[tplName]) {
      console.log(chalk.red('\n × 不存在相应的模板'));
      console.log('输入下列模板中的一个');
      templates.all.forEach(t => {
        console.log(chalk.green(`${t}`));
      });
      process.exit();
    }

    const projectName = yield prompt('项目名: ');

    const gitUrl = templates[tplName].url;
    // 复制项目模板到对应项目
    let cmdStr = `git clone ${gitUrl} ${projectName} && cd ${projectName} && rm -rf .git && rm README.md && git init && git add . && git commit -m 'First commit'`;

    console.log(chalk.white('\n 开始生成模板'))
    exec(cmdStr, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
        process.exit()
      }
      console.log(chalk.green('\n 模板生成完成'))
      console.log(`\n cd ${projectName} && npm install \n`)
      console.log(`\n git remote add origin '你的项目的git地址' \n`)
      process.exit()
    })
  })
}