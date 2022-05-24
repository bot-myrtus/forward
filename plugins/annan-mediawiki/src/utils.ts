export function randArray<T>(array: T[]): T {
    const rand = Math.random() * array.length | 0
    return array[rand]
}

export function compare(x: { pos: number }, y: { pos: number }): number {
    return x.pos - y.pos
}

export function pad(str: string): string {
    return `00${str}`.substring(-2)
}

export function genlink(v: string): string {
    const str = v.replace(/ /gu, '_')
    const p = str.indexOf('#')
    if (p === -1) {
        return encodeURI(str)
    }
    const title = encodeURI(str.substring(0, p))
    const plain = Buffer.from(str.substring(p + 1), 'utf-8').toString('binary');
    const chapter = plain.replace(/[^A-Za-z0-9\-\.:_]/gu, (ch) => {
        return `.${pad(ch.charCodeAt(0).toString(16).toUpperCase())}`
    })
    return `${title}#${chapter}`
}