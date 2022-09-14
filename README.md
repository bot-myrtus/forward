# Myrtus

[![Version](https://img.shields.io/github/v/tag/idanran/myrtus.svg)](https://github.com/idanran/myrtus/releases)
[![License](https://img.shields.io/github/license/idanran/myrtus)](https://github.com/idanran/myrtus/blob/main/LICENSE)

在多个群组间传话的机器人。目前支持 QQ 群、Telegram、QQ 频道、Discord 四种群组互联。

## 第一次使用

### 必需步骤

- 根据实际需要准备机器人账号 (具体方法见后面)
- 安装 Node.js, 版本要求: >=16.17.0
- 下载机器人[本体](https://github.com/idanran/myrtus/releases)
- 初始化 (在当前目录下执行)

```ps
corepack enable yarn
yarn
```

- 运行

```ps
yarn dev
```

#### 配置机器人

- 执行 `yarn dev` 后访问: http://localhost:5141/plugins/
- 点击右上角的 "添加插件"
- 点击左上角的 "插件选择"
- 选择指定平台的 adapter (QQ 群和 QQ 频道均为 "OneBot")
- 按照提示进行配置

#### 配置群组互联

- 执行 `yarn dev` 后访问: http://localhost:5141/plugins/
- 点击左侧的 "forward"
- 按照提示进行配置

### 设定 QQ 机器人

1. 在正式启用互联之前，建议提前注册一个 QQ 小号，挂机挂到一定等级，以减小被腾讯封杀的可能性。不过从实践情况来看，低等级也无妨。
2. **下载[go-cqhttp](https://github.com/Mrs4s/go-cqhttp/releases)**，启动一下安装提示进行配置。

### 设定 Telegram 机器人

@BotFather，与其交互，按照屏幕提示进行操作，建立一个机器人账号。设定完成后，BotFather 会给一个 Token。

之后请记得执行 `/setprivacy` 命令，将机器人的 Privacy 设为 DISABLED，以便于让它看到群组内的讯息。

邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。

### 设定 Discord 机器人

进入
[Discord Developer Portal](https://discordapp.com/developers/applications/)，创建
Application。在 Bot 页面中 Add Bot。将 Token 填到 koishi.config.yml 中。

邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。