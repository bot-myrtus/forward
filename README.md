# Myrtus

[![License](https://img.shields.io/github/license/idanran/myrtus)](https://github.com/idanran/myrtus/blob/main/LICENSE)

在多个群组间传话的机器人。支持 `QQ 群`、`Telegram`、`QQ 频道`、`Discord`、`KOOK`、`飞书` 互联。

## 组分

### @myrtus/forward

消息转发 (群组互联)。

### @myrtus/mediawiki

让群组支援 MediaWiki 特性，例如用户发送 `[[test]]`，随后用户将会收到该主题的链接。

### @myrtus/sundry

杂项。

## 快速搭建

1. 前往[这里](https://github.com/koishijs/koishi-desktop/releases)下载 Koishi 桌面版。
2. 启动 Koishi，你将会看到一个控制台界面（网页）。
3. 点击左侧的「插件市场」，搜索「@myrtus」，添加各组分。
4. 点击左侧的「插件配置」，点击右上角的「添加插件」，选择各组分 (每次只能选择一个)，随后点击右上角的「启用插件」。
5. 设定特定聊天平台 (如 Telegram) 的适配器，详见下方。
6. 设定消息转发规则，详见下方。

### 设定适配器

#### QQ

1. 准备一个 QQ 号 (等级最好不要过低，否则可能被风控)。
2. 点击控制台左侧的「插件配置」，选择「adapter-onebot」插件，完成以下配置：
    - 在「selfId」填写你的 QQ 号。
    - 在「password」填写你的密码。
    - 在「protocol」选择 `ws-reverse`。
    - 开启「gocqhttp.enable」选项。
3. 点击页面右上角的「启用插件」。

#### Telegram

1. @BotFather，与其交互，按照屏幕提示进行操作，建立一个机器人账号。设定完成后，BotFather 会给一个 Token。
2. 执行 `/setprivacy` 命令，选择第一步建立的账号，随后点击 `Disable`，以便于让它看到群组内的讯息。
3. 配置「adapter-telegram」插件，并启用。

#### Discord

1. 进入
[Discord Developer Portal](https://discordapp.com/developers/applications/)，创建
Application。在 Bot 页面中 Add Bot。设定完成后，会得到一个 Token。
2. 配置「adapter-discord」插件，并启用。

### 设定消息转发规则

1. 确保已启用所需的适配器和「inspect」插件。
2. 在群组 (来源和目标) 中发送 `inspect`，以获取会话信息。
3. 点击控制台左侧的「插件配置」，选择「@myrtus/forward」插件，完成以下配置：
    - 点击「constants」右侧的「添加项」，随后出现的第一个空格（即常量名称）必须填写，按需求配置其余参数，此时可将步骤 2 中获取的信息填入。
    - 点击「rules」右侧的「添加项」，按需求填入常量名称。
4. 点击页面右上角的「重载配置」。