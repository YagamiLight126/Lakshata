#!/usr/bin/env node
const fs = require("fs");
const ini = require("ini");
const path = require("path");
const program = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const exec = require("child_process").exec;

const PKG = require("./package.json");
const registries = require("./registries.json");
const LAKSHATARC = path.join(process.env.HOME, ".lakshatarc");

// 定义当前版本
program.version(PKG.version);

program.command("add <name> <url> [branch]").description("添加一个自定义模板").action(onAdd);
program.command("ls").description("拥有的模板").action(onList);
program.command("init").description("使用模板初始化").action(onInit);
program.command("del <registry>").description("删除自定义模板").action(onDel);
program.command("change <name> <newName>").description("修改自定义模板名称").action(onRename);

program.parse(process.argv);
if (process.argv.length === 2) {
  program.outputHelp();
}

/*//////////////// cmd methods /////////////////*/
function onInit() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "template",
        message: "请选择模板",
        choices: Object.keys(getAllRegistry()),
      },
      { type: "input", name: "projectName", message: "请输入项目名称" },
    ])
    .then((answers) => {
      const { template, projectName } = answers;
      const remoteRepo = registries[template];
      const gitUrl = remoteRepo.home;
      const branch = remoteRepo.branch;
      // 复制项目模板到对应项目
      let cmdStr = `git clone ${gitUrl} ${projectName} && cd ${projectName} && git checkout ${branch} && rm -rf .git && rm README.md`;
      console.log(chalk.white("\n 开始生成模板"));
      exec(cmdStr, (error) => {
        if (error) {
          console.log(error);
          process.exit();
        }
        console.log(chalk.green("\n 模板生成完成"));
        console.log(chalk.white(`\n cd ${projectName}`));
        process.exit();
      });
    });
}

function onList() {
  const info = [""];
  const allRegistries = getAllRegistry();
  const keys = Object.keys(allRegistries);
  const len = Math.max(...keys.map((key) => key.length)) + 3;
  Object.keys(allRegistries).forEach(function (key) {
    const item = allRegistries[key];
    info.push(key + line(key, len) + item.home);
  });

  info.push(""); // 和初始值一起起到增加空行的作用
  printMsg(info);
}

function onAdd(name, url, branch) {
  const custom = getCustomRegistry();
  if (custom.hasOwnProperty(name)) return;
  custom[name] = {};
  if (url[url.length - 1] !== "/") url += "/";
  custom[name].home = url;
  if (branch) {
    custom[name].branch = branch;
  }
  setCustomRegistry(custom, function (err) {
    if (err) return exit(err);
    printMsg(["", "    add registry " + name + " success", ""]);
  });
}
function onDel(name) {
  const customRegistries = getCustomRegistry();
  if (!customRegistries.hasOwnProperty(name)) return;
  delete customRegistries[name];
  setCustomRegistry(customRegistries, function (err) {
    if (err) return exit(err);
    printMsg(["", "    delete registry " + name + " success", ""]);
  });
}
function onRename(registryName, newName) {
  if (!newName || registryName === newName) return;
  let customRegistries = getCustomRegistry();
  if (!customRegistries.hasOwnProperty(registryName)) {
    console.log("Only custom registries can be modified");
    return;
  }
  if (registries[newName] || customRegistries[newName]) {
    console.log("The registry contains this new name");
    return;
  }
  customRegistries[newName] = JSON.parse(JSON.stringify(customRegistries[registryName]));
  delete customRegistries[registryName];
  setCustomRegistry(customRegistries, function (err) {
    if (err) return exit(err);
    printMsg(["", `    rename ${registryName} to ${newName} success`, ""]);
  });
}

/*//////////////// helper methods /////////////////*/
function getAllRegistry() {
  const custom = getCustomRegistry();
  const all = Object.assign({}, registries, custom);
  for (let name in registries) {
    if (name in custom) {
      all[name] = Object.assign({}, custom[name], registries[name]);
    }
  }
  return all;
}

function getCustomRegistry() {
  return getINIInfo(LAKSHATARC);
}

function getINIInfo(path) {
  return fs.existsSync(path) ? ini.parse(fs.readFileSync(path, "utf-8")) : {};
}

function line(str, len) {
  const line = new Array(Math.max(1, len - str.length)).join("-");
  return " " + line + " ";
}

function setCustomRegistry(config, cbk) {
  for (let name in config) {
    if (name in registries) {
      delete config[name].registry;
      delete config[name].home;
    }
  }
  fs.writeFile(LAKSHATARC, ini.stringify(config), cbk);
}

function cleanRegistry() {
  setCustomRegistry("", function (err) {
    if (err) exit(err);
    onUse("npm");
  });
}

function printMsg(infos) {
  infos.forEach(function (info) {
    console.log(info);
  });
}
