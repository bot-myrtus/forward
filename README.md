AnNanBot
===

在多个群组间传话的机器人。参考了「LilyWhiteBot」，使用了「Koishi」框架。

## 如何安装
目前支持 QQ 群、Telegram、QQ 频道、Discord 四种群组互联。

### 必需步骤
* 根据实际需要准备机器人账号。（具体方法见后面）
* 安装 Node.js，版本要求：>=12.x。
* 下载机器人本体。
* 执行：
```
npm install
npm start
```
* 根据实际需要修改 koishi.config.yml。

### 设定 QQ 机器人
1. 在正式启用互联之前，建议提前注册一个 QQ 小号，挂机挂到一定等级，并往钱包里塞一点钱，以减小被腾讯封杀的可能性。不过从实践情况来看，只有一颗星或不塞钱也无妨。
2. **下载[ go-cqhttp ](https://github.com/Mrs4s/go-cqhttp/releases)**，启动一下以便完成安装。

### 设定 Telegram 机器人
@BotFather，与其交互，按照荧幕提示进行操作，建立一个机器人账号。设定完成后，BotFather 会给一个 Token，你需要把这个 Token 填到 koishi.config.yml 中。

之后请记得执行 `/setprivacy` 命令，将机器人的 Privacy 设为 DISABLED，以便于让它看到群组内的讯息。

邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。

### 设定 Discord 机器人
进入 [Discord Developer Portal](https://discordapp.com/developers/applications/)，创建 Application。在 Bot 页面中 Add Bot。将 Token 填到 koishi.config.yml 中。

邀请机器人进群组，在群组中输入 `/groupid`，这样机器人会自动给出群组 ID 以便设定互联。
