/*
 * 互联
 *
 * 部分代码基于「LilyWhiteBot」的 QQbot.js
 */

const faces = {
    0: '惊讶', 1: '撇嘴', 2: '色', 3: '发呆', 4: '得意', 5: '流泪', 6: '害羞', 7: '闭嘴', 8: '睡', 9: '大哭',
    10: '尴尬', 11: '发怒', 12: '调皮', 13: '呲牙', 14: '微笑', 15: '难过', 16: '酷', 17: '非典', 18: '抓狂', 19: '吐',
    20: '偷笑', 21: '可爱', 22: '白眼', 23: '傲慢', 24: '饥饿', 25: '困', 26: '惊恐', 27: '流汗', 28: '憨笑', 29: '悠闲',
    30: '奋斗', 31: '咒骂', 32: '疑问', 33: '嘘……', 34: '晕', 35: '折磨', 36: '衰', 37: '骷髅', 38: '敲打', 39: '再见',
    40: '闪人', 41: '发抖', 42: '爱情', 43: '跳跳', 44: '找', 45: '美眉', 46: '猪头', 47: '猫咪', 48: '小狗', 49: '拥抱',
    50: '钱', 51: '灯泡', 52: '酒杯', 53: '蛋糕', 54: '闪电', 55: '炸弹', 56: '刀', 57: '足球', 58: '音乐', 59: '便便',
    60: '咖啡', 61: '饭', 62: '药丸', 63: '玫瑰', 64: '凋谢', 65: '吻', 66: '爱心', 67: '心碎', 68: '会议', 69: '礼物',
    70: '电话', 71: '时间', 72: '邮件', 73: '电视', 74: '太阳', 75: '月亮', 76: '赞', 77: '踩', 78: '握手', 79: '胜利',
    80: '多多', 81: '美女', 82: '汉良', 83: '毛毛', 84: 'Q 仔', 85: '飞吻', 86: '怄火', 87: '白酒', 88: '汽水', 89: '西瓜',
    90: '下雨', 91: '多云', 92: '雪人', 93: '星星', 94: '女', 95: '男', 96: '冷汗', 97: '擦汗', 98: '抠鼻', 99: '鼓掌',
    100: '糗大了', 101: '坏笑', 102: '左哼哼', 103: '右哼哼', 104: '哈欠', 105: '鄙视', 106: '委屈', 107: '快哭了', 108: '阴险', 109: '亲亲',
    110: '吓', 111: '可怜', 112: '菜刀', 113: '啤酒', 114: '篮球', 115: '乒乓', 116: '示爱', 117: '瓢虫', 118: '抱拳', 119: '勾引',
    120: '拳头', 121: '差劲', 122: '爱你', 123: 'NO', 124: 'OK', 125: '转圈', 126: '磕头', 127: '回头', 128: '跳绳', 129: '挥手',
    130: '激动', 131: '街舞', 132: '献吻', 133: '左太极', 134: '右太极', 135: '招财进宝', 136: '双喜', 137: '鞭炮', 138: '灯笼', 139: '发财',
    140: 'K 歌', 141: '购物', 142: '邮件', 143: '帅', 144: '喝彩', 145: '祈祷', 146: '爆筋', 147: '棒棒糖', 148: '喝奶', 149: '下面',
    150: '香蕉', 151: '飞机', 152: '开车', 153: '高铁左车头', 154: '车厢', 155: '高铁右车头', 156: '多云', 157: '下雨', 158: '钞票', 159: '熊猫',
    160: '灯泡', 161: '风车', 162: '闹钟', 163: '打伞', 164: '彩球', 165: '钻戒', 166: '沙发', 167: '纸巾', 168: '药', 169: '手枪',
    170: '青蛙', 171: '茶', 172: '眨眼睛', 173: '泪奔', 174: '无奈', 175: '卖萌', 176: '小纠结', 177: '喷血', 178: '斜眼笑', 179: 'Doge',
    180: '惊喜', 181: '骚扰', 182: '笑哭', 183: '我最美', 184: '河蟹', 185: '羊驼', 186: '栗子', 187: '幽灵', 188: '蛋', 189: '马赛克',
    190: '菊花', 191: '肥皂', 192: '红包', 193: '大笑', 194: '不开心', 195: '啊', 196: '惶恐', 197: '冷漠', 198: '呃', 199: '好棒',
    200: '拜托', 201: '点赞', 202: '无聊', 203: '托脸', 204: '吃', 205: '送花', 206: '害怕', 207: '花痴', 208: '小样儿', 209: '脸红',
    210: '飙泪', 211: '我不看', 212: '托腮', 213: '哇哦', 214: '啵啵', 215: '糊脸', 216: '拍头', 217: '扯一扯', 218: '舔一舔', 219: '蹭一蹭',
    220: '拽炸天', 221: '顶呱呱', 222: '抱抱', 223: '暴击', 224: '开枪', 225: '撩一撩', 226: '拍桌', 227: '拍手', 228: '恭喜', 229: '干杯',
    230: '嘲讽', 231: '哼', 232: '佛系', 233: '掐一掐', 234: '惊呆', 235: '颤抖', 236: '啃头', 237: '偷看', 238: '扇脸', 239: '原谅',
    240: '喷脸', 241: '生日快乐', 245: "加油必胜", 246: "加油抱抱", 247: "口罩护体", 260: "搬砖中", 261: "忙到飞起", 262: "脑阔疼", 263: "沧桑",
    264: "捂脸", 265: "辣眼睛", 266: "哦哟", 267: "头秃", 268: "问号脸", 269: "暗中观察", 270: "emm", 271: "吃瓜", 272: "呵呵哒", 273: "我酸了",
    274: "太南了", 277: "汪汪", 289: "睁眼", 300: "胖三斤", 306: "牛气冲天", 307: "喵喵", 311: "打call", 312: "变形", 314: "仔细分析", 317: "菜汪", 318: "崇拜",
    319: "比心", 320: "庆祝", 324: "吃糖", 325: "惊吓", 326: "生气", 333: "烟花"
};

const parseMessageRecord = (message) => {
    let text = message.replace(/\n/gu, '&#10;').replace(/\[CQ:([^,]*?)\]/gu, '[CQ:$1,]').replace(/\[CQ:(.*?)((?:,).*?)\]/gu, (_, type, param) => {
        if (type === "record") {
            return '[语音]';
        } else {
            return '';
        }
    }).replace(/&#10;/gu, '\n');

    return text;
}

/**
 * 去除接收訊息中的部分 CQ 碼（酷 Q 專用碼，包括表情等資料），將其換為「[表情名稱]」等文字
 * @param  {string} Message 已解碼並轉為 UTF-8 之後的訊息
 * @return {string} 去除 CQ 碼之後的文字
 */
const parseMessage = (message) => {
    let text = message.replace(/\n/gu, '&#10;').replace(/\[CQ:([^,]*?)\]/gu, '[CQ:$1,]').replace(/\[CQ:(.*?)((?:,).*?)\]/gu, (_, type, param) => {
        let tmp;
        let tmp1;
        switch (type) {
            case 'face':
                // [CQ:face,id=13]
                tmp = param.match(/(?:^|,)id=(.*?)(?:,|$)/u);
                tmp1 = faces[parseInt(tmp[1])];
                if (tmp && tmp[1] && typeof tmp1 !== "undefined") {
                    return `[${tmp1}]`;
                } else {
                    return '[表情]';
                }

            case 'record':
                // 一般語音 [CQ:record,file=C091016F9A0CCFF1741AF0B442BD4F70.silk]
                // 領取語音紅包 [CQ:record,file=C091016F9A0CCFF1741AF0B442BD4F70.silk,hb=true]
                // 依據客户端之不同，可能是 silk，也可能是 amr
                return '[语音]';

            case 'hb':
                // [CQ:hb,title=恭喜发财]
                tmp = ['[红包]'];
                tmp1 = param.match(/(?:^|,)title=(.*?)(?:,|$)/u);
                if (tmp1 && tmp1[1]) {
                    tmp.push(tmp1[1]);
                }
                return tmp.join('\n');

            default:
                return '';
        }
    }).replace(/&#10;/gu, '\n');

    return text;
}

module.exports.name = 'wforward'
module.exports.apply = (ctx, config) => {
    ctx.middleware(async (session, next) => {
        const { author, channelId, platform, content } = session;
        if (!config.disabled && !!content) {
            let index = config.group.findIndex((element) => (element.source.groupId === channelId));
            if (index > -1) {
                let { QQGroup, QQChannel, Telegram, Discord } = config.group[index].target;
                let template = `[${config.group[index].source.name} - ${(typeof author.nickname !== "undefined" && author.nickname) || author.username}] ${content}`;
                if (typeof QQGroup !== "undefined") {
                    let targetBot = ctx.bots.get(`onebot:${QQGroup.selfId}`);
                    targetBot.broadcast(QQGroup.groupIdList, template);
                }
                if (typeof QQChannel !== "undefined") {
                    let targetBot = ctx.bots.get(`qqguild:${QQChannel.selfId}`);
                    targetBot.broadcast(QQChannel.groupIdList, parseMessageRecord(template));
                }
                if (typeof Telegram !== "undefined") {
                    let targetBot = ctx.bots.get(`telegram:${Telegram.selfId}`);
                    targetBot.broadcast(Telegram.groupIdList, parseMessage(template));
                }
                if (typeof Discord !== "undefined") {
                    let targetBot = ctx.bots.get(`discord:${Discord.selfId}`);
                    targetBot.broadcast(Discord.groupIdList, parseMessage(template));
                }
                console.log(session);
            }
        }
        return next()
    }, true)
}