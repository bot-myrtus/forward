import { Context, Schema } from 'koishi'
import { randArray, genlink, compare } from './utils'

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
    platform: Schema.union(['onebot', 'telegram', 'discord']).required().description('群组平台 (QQ 群和 QQ 频道则为 "onebot")'),
    link: Schema.string().default('https://zh.wikipedia.org/wiki/{replace}').description('链接模板'),
    api: Schema.string().default('https://zh.wikipedia.org/w/api.php').description('API 地址'),
  })).default([]).description('想要支援 MediaWiki 特性的群组规则'),
})

export function apply(ctx: Context, config: Config) {
  ctx.middleware(async (session, next) => {
    if (session.type === 'message') {
      const index = config.rules.findIndex((element) => (element.channelId === session.channelId) && (element.platform === session.platform))
      if (index > -1) {
        const text = session.content.replace(/&#91;/gu, '[').replace(/&#93;/gu, ']').replace(/&#44;/gu, ',').replace(/&amp;/gu, '&');
        if (/\[\[\s*([^\[\|]+?)\s*(|\|.+?)\]\]/gu.test(text) || /([^\{]|^)\{\{\s*([^\{#\[\]\|]+?)\s*(|\|.+?)\}\}/gu.test(text)) {
          return linky(text, config.rules[index].link).map(l => l.link).join('  ')
        }
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
      const response = await ctx.http.get(`${api}?action=query&list=categorymembers&cmtitle=Category%3A${encodeURI(randArray(artAarray))}&cmlimit=50&format=json`)
      const scienceArt: any = randArray(response.query.categorymembers)
      return link.replace('{replace}', encodeURI(scienceArt.title.replace("Talk:", "")))
    }
  })
}


const linky = (string: string, prefix: string): string[] => {
  let text = {}
  let links = []
  string.replace(/\[\[\s*([^\[\|]+?)\s*(|\|.+?)\]\]/gu, (s: string, l: string, _: any, offset: number) => {
    if (!text[l]) {
      links.push({ pos: offset, link: prefix.replace('{replace}', genlink(l)) })
      text[l] = true
    }
    return s
  })
  string.replace(/([^\{]|^)\{\{\s*([^\{#\[\]\|]+?)\s*(|\|.+?)\}\}/gu, (s: string, _: any, l: string, __: any, offset: number) => {
    if (!l.startsWith(':') && !l.toLowerCase().startsWith('template:')) {
      l = 'Template:' + l;
    }
    if (!text[l]) {
      links.push({ pos: offset, link: prefix.replace('{replace}', `${genlink(l)}`) })
      text[l] = true
    }
    return s
  })
  links.sort(compare)
  return links
}

const getRandPopular = (data: any) => {
  const rArray: any = randArray(data.query.mostviewed);
  if (rArray.ns !== 0) {
    getRandPopular(data)
  } else {
    return rArray
  }
}

const artAarray = ['极高重要度数学条目', '高重要度数学条目', '中重要度数学条目',
  '极高重要度物理学条目', '高重要度物理学条目', '中重要度物理学条目',
  '极高重要度化学条目', '高重要度化学条目', '中重要度化学条目',
  '极高重要度生物学条目', '高重要度生物学条目', '中重要度生物学条目',
  '极高重要度医学条目', '高重要度医学条目', '中重要度医学条目',
  '极高重要度电脑和信息技术条目', '高重要度电脑和信息技术条目', '中重要度电脑和信息技术条目']