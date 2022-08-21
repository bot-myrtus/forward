# Koishi 模板仓库

- [安装方法](#安装方法)
  - [从当前仓库创建](#从当前仓库创建)
  - [使用包管理器创建](#使用包管理器创建)
- [基本功能](#基本功能)
  - [启动机器人](#启动机器人)
  - [设置环境变量](#设置环境变量)
  - [工作区开发](#工作区开发)

## 安装方法

我们提供了两种安装方法。你可以使用其中的任意一种。

### 从当前仓库创建

1. 点击 [**这里**](https://github.com/koishijs/boilerplate/generate) 以创建此仓库的副本。<br>注意：这是一个模板仓库，创建副本不同于 fork，它生成的新仓库不会包含当前仓库的提交历史。
2. 将你创建的项目 clone 到本地，并在本地目录启动命令行。
3. 输入 `npm install` / `yarn` 安装依赖。
4. 输入 `npm start` / `yarn start` 开始运行。

### 使用包管理器创建

在任意目录启动命令行，输入下面的指令：

```sh
npm init koishi         # yarn create koishi
```

跟随提示即可完成全套初始化流程。

> 由于国内可能无法访问 GitHub，你可能需要科学上网或使用镜像。例如你可以使用 [FastGit](http://fastgit.org/) 作为镜像源，只需在上面的脚本后添加 `-m https://download.fastgit.org` 即可。

## 基本功能

### 启动机器人

如果你顺利完成了上一步操作，你的应用此时应该已经是启动状态，你无需进行额外的操作。但当应用处于关闭状态时，你可以在运行下面的指令以启动：

```sh
npm start               # yarn start
```

关于控制台的使用方法，请参考官方文档 [**使用控制台**](https://koishi.js.org/manual/starter/installation.html#使用控制台) 章节。

### 工作区开发

除了上面介绍的用法以外，我们还提供了更多功能：

- build：构建源代码
- bump：更新版本号
- dep：更新依赖
- pub：发布插件
- setup：创建新插件

关于每个指令的具体用法，请参考官方文档 [**工作区开发**](https://koishi.js.org/manual/development.html) 章节。
