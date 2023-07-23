# Myrtus

[![License](https://img.shields.io/github/license/idanran/myrtus)](https://github.com/idanran/myrtus/blob/main/LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/idanran/myrtus/badge)](https://www.codefactor.io/repository/github/idanran/myrtus)

在多个群组间传话的机器人。支持 `QQ 群`、`Telegram`、`QQ 频道`、`Discord`、`KOOK`、`飞书`、`Matrix` 等平台互联。

## 组分

| Plugin              | Description              | Version                                                                                                                               |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| @myrtus/forward     | 消息转发 (群组互联)        | [![npm](https://img.shields.io/npm/v/@myrtus/koishi-plugin-forward)](https://www.npmjs.com/package/@myrtus/koishi-plugin-forward)     |
| @myrtus/mediawiki   | 查询 MediaWiki 信息       | [![npm](https://img.shields.io/npm/v/@myrtus/koishi-plugin-mediawiki)](https://www.npmjs.com/package/@myrtus/koishi-plugin-mediawiki) |
| @myrtus/sundry      | 杂项                      | [![npm](https://img.shields.io/npm/v/@myrtus/koishi-plugin-sundry)](https://www.npmjs.com/package/@myrtus/koishi-plugin-sundry)       |

## 快速搭建

1. 前往[这里](https://github.com/koishijs/koishi-desktop/releases)下载「Koishi 桌面」。
2. 启动 Koishi，你将会看到一个控制台界面（网页）。
3. 点击左侧的「插件市场」，搜索「@myrtus」，添加各组分。
4. 点击左侧的「插件配置」，点击右上角的「添加插件」，选择各组分 (每次只能选择一个)，随后点击右上角的「启用插件」。
5. 设定特定聊天平台 (如 Telegram) 的适配器，详见下方。
6. 设定消息转发规则，详见下方。

### 设定适配器

#### QQ

参见 Koishi 论坛的 [2501](https://forum.koishi.xyz/t/topic/2501) 帖。

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