import { Dict, h } from 'koishi'

export class MessageParse {
    private faceEnable = false
    private recordEnable = false
    private atEnable = false
    private guildMemberMap: Dict<string, string>
    constructor(private message: h[]) {
    }
    face() {
        this.faceEnable = true
        return this
    }
    record() {
        this.recordEnable = true
        return this
    }
    at(guildMemberMap: Dict<string, string>) {
        this.atEnable = true
        this.guildMemberMap = guildMemberMap
        return this
    }
    output() {
        const segs = this.message.map((value) => {
            const { type, attrs } = value
            switch (type) {
                case 'face': {
                    if (this.faceEnable) {
                        let content = '[表情]'
                        const faceName = attrs.name
                        if (['onebot', 'qqguild'].includes(attrs.platform) && faceName && faceName !== '') {
                            content = `[${[faceName]}]`
                        }
                        return h('text', { content })
                    }
                }
                case 'record': {
                    if (this.recordEnable) {
                        return h('text', { content: '[语音]' })
                    }
                }
                case 'at': {
                    if (this.atEnable && attrs.id && !attrs.name) {
                        return h('text', { content: `@${this.guildMemberMap[attrs.id]}` })
                    }
                }
            }
            return value
        })
        return segs
    }
}