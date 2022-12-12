import { Context, Schema, h } from 'koishi'
import { randArray } from './utils'

export const name = 'mediawiki'

export interface Config {
  rules: {
    channelId: string
    platform: string
    link: string
    api: string
  }[]
}

export const Config: Schema<Config> = Schema.object({
  rules: Schema.array(Schema.object({
    channelId: Schema.string().required().description('群组编号'),
    platform: Schema.union(['onebot', 'telegram', 'discord', 'qqguild', 'kook', 'feishu']).required().description('群组平台 (QQ 群为 "onebot")'),
    link: Schema.string().default('https://zh.wikipedia.org/wiki/{replace}').description('链接模板'),
    api: Schema.string().default('https://zh.wikipedia.org/w/api.php').description('API 地址'),
  })).default([]).description('想要支援 MediaWiki 特性的群组规则'),
})

export function apply(ctx: Context, config: Config) {
  ctx.middleware(async (session, next) => {
    if (session.type === 'message') {
      const index = config.rules.findIndex((element) => (element.channelId === session.channelId) && (element.platform === session.platform))
      if (index > -1) {
        return session.elements.map((element) => {
          if (element.type === 'text') {
            const keys = element.attrs.content.match(/(?<=\[\[).*?(?=\]\])/g)
            if (keys.length > 0) {
              const res = []
              for (const key of keys) {
                const url = config.rules[index].link.replace('{replace}', encodeURI(key))
                res.push(url)
              }
              return h('text', { content: res.join('  ') })
            }
          }
        })
      }
    }
    return next()
  })
  ctx.command('popular').action(async ({ session }) => {
    const index = config.rules.findIndex((element) => (element.channelId === session.channelId) && (element.platform === session.platform))
    if (index > -1) {
      const { api, link } = config.rules[index]
      const response = await ctx.http.get(`${api}?action=query&list=mostviewed&format=json&pvimlimit=20`)
      return link.replace('{replace}', encodeURI(getRandPopular(response).title))
    }
  })
  ctx.command('science').action(async ({ session }) => {
    const index = config.rules.findIndex((element) => (element.channelId === session.channelId) && (element.platform === session.platform))
    if (index > -1) {
      const { api, link } = config.rules[index]
      const response = await ctx.http.get(`${api}?action=query&list=categorymembers&cmtitle=Category%3A${encodeURI(randArray(sciArray))}&cmlimit=50&format=json`)
      const scienceArt: any = randArray(response.query.categorymembers)
      return link.replace('{replace}', encodeURI(scienceArt.title.replace("Talk:", "")))
    }
  })
}

function getRandPopular(data: any): Record<string, any> {
  const item: Record<string, any> = randArray(data.query.mostviewed);
  return item.ns !== 0 ? getRandPopular(data) : item
}

const sciArray = ['极高重要度数学条目', '高重要度数学条目', '中重要度数学条目',
  '极高重要度物理学条目', '高重要度物理学条目', '中重要度物理学条目',
  '极高重要度化学条目', '高重要度化学条目', '中重要度化学条目',
  '极高重要度生物学条目', '高重要度生物学条目', '中重要度生物学条目',
  '极高重要度医学条目', '高重要度医学条目', '中重要度医学条目',
  '极高重要度电脑和信息技术条目', '高重要度电脑和信息技术条目', '中重要度电脑和信息技术条目']