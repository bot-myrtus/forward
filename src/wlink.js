/*
 * wlink - 自動將聊天中的[[]]與{{}}換成 Wiki 系統的連結
 *
 * 部分代码基于「LilyWhiteBot」的 wikilinky.js
 */

const compare = (x, y) => {
    return x.pos - y.pos;
};

const pad = (str) => {
    return `00${str}`.substr(-2);
};

const genlink = (v) => {
    // 處理「#」
    let str = v.replace(/ /gu, '_');
    let p = str.indexOf('#');

    if (p === -1) {
        return encodeURI(str);
    } else {
        /*
          對於「#」後面的內容：
 
          不轉成 ASCII 的：字母、數字、「-」、「.」、「:」、「_」
          空白轉成「_」
         */
        let s1 = encodeURI(str.substring(0, p));
        let s2 = str.substring(p + 1);

        let plain = Buffer.from(s2, 'utf-8').toString('binary');

        s2 = plain.replace(/[^A-Za-z0-9\-\.:_]/gu, (ch) => {
            return `.${pad(ch.charCodeAt(0).toString(16).toUpperCase())}`;
        });

        return `${s1}#${s2}`;
    }
};

const linky = (string, prefix) => {
    let text = {};      // 去重複
    let links = [];

    string.replace(/\[\[\s*([^\[\|]+?)\s*(|\|.+?)\]\]/gu, (s, l, _, offset) => {
        if (!text[l]) {
            links.push({ pos: offset, link: prefix.replace('$1', genlink(l)) });
            text[l] = true;
        }
        return s;
    });

    string.replace(/([^\{]|^)\{\{\s*([^\{#\[\]\|]+?)\s*(|\|.+?)\}\}/gu, (s, _, l, __, offset) => {
        let t = l;
        if (!t.startsWith(':') && !t.toLowerCase().startsWith('template:')) {
            t = 'Template:' + t;
        }
        if (!text[t]) {
            links.push({ pos: offset, link: prefix.replace('$1', `${genlink(t)}`) });
            text[t] = true;
        }
        return s;
    });

    links.sort(compare);
    return links;
};

module.exports.name = 'wlink'
module.exports.apply = (ctx, config) => {
    ctx.middleware(async (session, next) => {
        let isSend = false;
        let prefix = "";
        if (!config.disabled) {
            let { QQGroup, QQChannel, Telegram, Discord } = config.groups;
            if (typeof QQChannel !== "undefined" && typeof session.guildId !== "undefined" && Object.keys(QQChannel.list).indexOf(session.guildId) > -1) {
                if (QQChannel.list[session.guildId].all) {
                    isSend = true;
                    prefix = QQChannel.list[session.guildId].link;
                } else if (Object.keys(QQChannel.list[session.guildId].sublist).indexOf(session.channelId) > -1) {
                    isSend = true;
                    prefix = QQChannel.list[session.guildId].sublist[session.channelId].link;
                }
            } else if (typeof Telegram !== "undefined" && typeof session.channelId !== "undefined" && Object.keys(Telegram.list).indexOf(session.channelId) > -1) {
                isSend = true;
                prefix = Telegram.list[session.channelId].link;
            } else if (typeof QQGroup !== "undefined" && typeof session.channelId !== "undefined" && Object.keys(QQGroup.list).indexOf(session.channelId) > -1) {
                isSend = true;
                prefix = QQGroup.list[session.channelId].link;
            }else if (typeof Discord !== "undefined" && typeof session.guildId !== "undefined" && Object.keys(Discord.list).indexOf(session.guildId) > -1) {
                if (Discord.list[session.guildId].all) {
                    isSend = true;
                    prefix = Discord.list[session.guildId].link;
                } else if (Object.keys(Discord.list[session.guildId].sublist).indexOf(session.channelId) > -1) {
                    isSend = true;
                    prefix = Discord.list[session.guildId].sublist[session.channelId].link;
                }
            }
        }
        if (isSend) {
            const text = session.content.replace(/&#91;/gu, '[').replace(/&#93;/gu, ']').replace(/&#44;/gu, ',').replace(/&amp;/gu, '&');
            if (/\[\[\s*([^\[\|]+?)\s*(|\|.+?)\]\]/gu.test(text) || /([^\{]|^)\{\{\s*([^\{#\[\]\|]+?)\s*(|\|.+?)\}\}/gu.test(text)) {
                session.send(linky(text, prefix).map(l => l.link).join('  '))
            } else {
                return next()
            }
        } else {
            return next()
        }
    })
}