import { Context, Schema, segment } from 'koishi'
import { MessageParse } from './parse'

export const name = 'forward'

export interface Config {
  rules: {
    source: {
      channelId: string
      name: string
      platform: string
    }
    targets: {
      selfId: string
      channelId: string
      platform: string
      guildId: string
      disabled: boolean
    }[]
  }[]
}

export const Config: Schema<Config> = Schema.object({
  rules: Schema.array(Schema.object({
    source: Schema.object({
      channelId: Schema.string().required().description('群组编号'),
      name: Schema.string().required().description('平台代称'),
      platform: Schema.union(['onebot', 'telegram', 'discord', 'qqguild', 'kook', 'feishu']).required().description('群组平台 (QQ 群为 "onebot")'),
    }).description('来源'),
    targets: Schema.array(
      Schema.object({
        selfId: Schema.string().required().description('机器人自身编号'),
        channelId: Schema.string().required().description('群组编号'),
        platform: Schema.union(['onebot', 'telegram', 'discord', 'qqguild', 'kook', 'feishu']).required().description('群组平台 (QQ 群为 "onebot")'),
        guildId: Schema.string().default('').description('父级群组编号'),
        disabled: Schema.boolean().default(false).description('是否禁用')
      }),
    ).description('目标'),
  })).default([]).description('消息转发规则'),
})

export function apply(ctx: Context, config: Config) {
  ctx.middleware(async (session, next) => {
    if (session.type === 'message') {
      //console.log(session.elements)
      const index = config.rules.findIndex((element) => (element.source.channelId === session.channelId) && (element.source.platform === session.platform))
      if (index > -1) {
        const { source, targets } = config.rules[index]
        const same: Record<string, [string, string][]> = {}
        for (const target of targets) {
          if (target.disabled) continue
          const botId = `${target.platform}:${target.selfId}`
          same[botId] ?? (same[botId] = [])
          same[botId].push([target.channelId, target.guildId])
        }
        const prefix = `[${source.name} - ${session.author.nickname || session.author.username}]\n`
        let message = session.elements
        message.unshift(segment('text', { content: prefix }))
        if (session.quote) {
          const re = `Re ${session.quote.author.nickname || session.quote.author.username} ⌈${session.quote.content}⌋: `
          message.splice(1, 0, segment(null, {}, segment.parse(re)))
        }
        const guildMemberMap = await session.bot.getGuildMemberMap(session.guildId)
        for (const botId of Object.keys(same)) {
          ctx.bots[botId].broadcast(same[botId], new MessageParse(message).face().record().at(guildMemberMap).output())
        }
      }
    }
    return next()
  })
}
