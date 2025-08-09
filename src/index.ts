export const name = 'forward'

export const inject = ['database', 'http']

export const usage = `
这是用于在不同群组间转发消息的插件。

入门教程<a href="https://github.com/bot-myrtus/forward?tab=readme-ov-file#%E8%AE%BE%E5%AE%9A%E6%B6%88%E6%81%AF%E8%BD%AC%E5%8F%91%E8%A7%84%E5%88%99" target="_blank">点此查阅</a>，如有疑问可<a href="https://github.com/bot-myrtus/forward/issues/new" target="_blank">提交 issue</a>。
`

export * from './config'

export * from './core'
