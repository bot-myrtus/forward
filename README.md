# Myrtus

[![License](https://img.shields.io/github/license/idanran/myrtus)](https://github.com/idanran/myrtus/blob/main/LICENSE)

在多个群组间传话的机器人。支持 `QQ 群`、`Telegram`、`QQ 频道`、`Discord`、`KOOK`、`飞书` 互联。

## 快速搭建

1. 前往[这里](https://github.com/koishijs/koishi-desktop/releases)下载 Koishi 桌面版
2. 启动 Koishi，你将会看到一个控制台界面
3. 点击左侧的「插件市场」，搜索「myrtus」，添加「@myrtus/mediawiki」、「@myrtus/forward」、「@myrtus/tool」
4. 点击左侧的「插件配置」，点击右上角的「添加插件」，选择「@myrtus/mediawiki」、「@myrtus/forward」、「@myrtus/tool」插件（每次只能选择一个），按需要进行配置，并点击右上角的「启用插件」

### 设定 QQ 机器人

1. 准备一个 QQ 号 (等级不要过低，否则可能被风控)
2. 点击左侧的「插件配置」，选择「adapter-onebot」插件，完成以下配置：
    - 在「selfId」填写你的 QQ 号
    - 在「password」填写你的密码
    - 在「protocol」选择 `ws-reverse`
    - 开启「gocqhttp.enable」选项
3. 点击右上角的「启用插件」
4. 现在你可以在 QQ 上使用了！

### 设定 Telegram 机器人

@BotFather，与其交互，按照屏幕提示进行操作，建立一个机器人账号。设定完成后，BotFather 会给一个 Token。

之后请记得执行 `/setprivacy` 命令，将机器人的 Privacy 设为 DISABLED，以便于让它看到群组内的讯息。

配置「adapter-telegram」插件，邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。

### 设定 Discord 机器人

进入
[Discord Developer Portal](https://discordapp.com/developers/applications/)，创建
Application。在 Bot 页面中 Add Bot。设定完成后，会得到一个 Token。

配置「adapter-discord」插件，邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。