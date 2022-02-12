const randArray = array => {
    let rand = Math.random() * array.length | 0;
    let rValue = array[rand];
    return rValue;
}

const getRandPopular = data => {
    let rArray = randArray(data.query.mostviewed);
    if (rArray.ns !== 0) {
        getRandPopular(data)
    } else {
        return rArray
    }
}

module.exports.name = 'getpopular'

module.exports.apply = (ctx, config) => {
    const cmd = ctx.command("popular", "随机获取热门条目");
    cmd.action(async ({ session } = argv) => {
        let isSend = false;
        let prefix = "";
        let api = "";
        if (!config.disabled) {
            let { QQGroup, QQChannel, Telegram, Discord } = config.groups;
            if (typeof QQChannel !== "undefined" && typeof session.guildId !== "undefined" && Object.keys(QQChannel.list).indexOf(session.guildId) > -1) {
                if (QQChannel.list[session.guildId].all) {
                    isSend = true;
                    prefix = QQChannel.list[session.guildId].link;
                    api = QQChannel.list[session.guildId].api;
                } else if (Object.keys(QQChannel.list[session.guildId].sublist).indexOf(session.channelId) > -1) {
                    isSend = true;
                    prefix = QQChannel.list[session.guildId].sublist[session.channelId].link;
                    api = QQChannel.list[session.guildId].sublist[session.channelId].api;
                }
            } else if (typeof Telegram !== "undefined" && typeof session.channelId !== "undefined" && Object.keys(Telegram.list).indexOf(session.channelId) > -1) {
                isSend = true;
                prefix = Telegram.list[session.channelId].link;
                api = Telegram.list[session.channelId].api;
            } else if (typeof QQGroup !== "undefined" && typeof session.channelId !== "undefined" && Object.keys(QQGroup.list).indexOf(session.channelId) > -1) {
                isSend = true;
                prefix = QQGroup.list[session.channelId].link;
                api = QQGroup.list[session.channelId].api;
            }else if (typeof Discord !== "undefined" && typeof session.guildId !== "undefined" && Object.keys(Discord.list).indexOf(session.guildId) > -1) {
                if (Discord.list[session.guildId].all) {
                    isSend = true;
                    prefix = Discord.list[session.guildId].link;
                    api = Discord.list[session.guildId].api;
                } else if (Object.keys(Discord.list[session.guildId].sublist).indexOf(session.channelId) > -1) {
                    isSend = true;
                    prefix = Discord.list[session.guildId].sublist[session.channelId].link;
                    api = Discord.list[session.guildId].sublist[session.channelId].api;
                }
            }
        }
        if (isSend) {
            try {
                const response = await ctx.http.get(`${api}w/api.php?action=query&list=mostviewed&format=json&pvimlimit=20`);
                const rPopular = getRandPopular(response);
                session.send(prefix.replace('$1', encodeURI(rPopular.title)));
            } catch (error) {
                console.error(error);
            }
        }
    })
}