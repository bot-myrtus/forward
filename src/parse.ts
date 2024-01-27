import { h } from 'koishi'

export class MessageParse {
    private faceEnable = false
    private recordEnable = false
    private atEnable = false
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
    at() {
        this.atEnable = true
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
                        if (faceName) {
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
                    if (this.atEnable) {
                        const name = attrs.name ? attrs.name : attrs.id
                        return h('text', { content: `@${name}` })
                    }
                }
            }
            return value
        })
        return segs
    }
}