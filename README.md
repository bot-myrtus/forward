# @myrtus/forward

[![npm](https://img.shields.io/npm/v/@myrtus/koishi-plugin-forward?style=flat-square)](https://www.npmjs.com/package/@myrtus/koishi-plugin-forward)
[![CodeFactor](https://www.codefactor.io/repository/github/bot-myrtus/forward/badge)](https://www.codefactor.io/repository/github/bot-myrtus/forward)

在多个群组间传话的机器人插件。支持 `QQ 群`、`Telegram`、`QQ 频道`、`Discord`、`KOOK`、`飞书`、`Matrix` 等平台互联。

## 快速搭建

1. 前往[这里](https://github.com/koishijs/koishi-desktop/releases)下载「Koishi Desktop」。
2. 启动 Koishi，你将会看到一个控制台界面（网页）。
3. 点击左侧的「插件市场」，搜索「@myrtus/forward」，安装该插件。
4. 设定特定聊天平台 (如 Telegram) 的适配器，详见下方。
5. 设定消息转发规则，详见下方。

### 设定适配器

#### QQ

参见 Koishi 论坛的 [810](https://forum.koishi.xyz/t/topic/810) 帖。

#### Telegram

1. 添加好友 @BotFather，与其交互，按照屏幕提示进行操作，建立一个机器人账号。设定完成后，BotFather 会给一个 Token。
2. 执行 `/setprivacy` 命令，选择第一步建立的账号，随后点击 `Disable`，以便于让它看到群组内的讯息。
3. 回到 Koishi 控制台，配置「adapter-telegram」插件，并启用。

#### Discord

1. 进入 [Discord Developer Portal](https://discord.com/developers/applications/)，创建 Application。
2. 进入刚创建的 Application，在 Bot 页面中找到 MESSAGE CONTENT INTENT，启用该配置项。
3. 点击当前页面的 Reset Token 按钮，得到 Token。
4. 回到 Koishi 控制台，配置「adapter-discord」插件，并启用。

### 设定消息转发规则

1. 确保已启用所需的适配器和「inspect」插件。
2. 在群组 (来源和目标) 中发送 `inspect`，以获取会话信息。
3. 点击控制台左侧的「插件配置」，选择「@myrtus/forward」插件，完成以下配置：
    - 点击「constants」右侧的「添加项目」。
    - 填写「常量名称」。
    - 将步骤 2 获取的信息一一对应地复制进输入框。
    - 点击「rules」右侧的「添加项目」，按需求填入常量名称。
4. 点击页面右上角的「保存配置」。