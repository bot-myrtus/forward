import { Context, Schema } from 'koishi'
import { parseMessageFace } from './parse'

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
      platform: Schema.union(['onebot', 'telegram', 'discord', 'qqguild']).required().description('群组平台 (QQ 群为 "onebot")'),
    }).description('来源'),
    targets: Schema.array(
      Schema.object({
        selfId: Schema.string().required().description('机器人自身编号'),
        channelId: Schema.string().required().description('群组编号'),
        platform: Schema.union(['onebot', 'telegram', 'discord', 'qqguild']).required().description('群组平台 (QQ 群为 "onebot")'),
        guildId: Schema.string().default('').description('父级群组编号, 仅 QQ 频道需要填写'),
        disabled: Schema.boolean().default(false).description('是否禁用')
      }),
    ).description('目标'),
  })).default([]).description('消息转发规则'),
})

export function apply(ctx: Context, config: Config) {
  ctx.middleware(async (session, next) => {
    if (!!session.content) {
      const index = config.rules.findIndex((element) => (element.source.channelId === session.channelId) && (element.source.platform === session.platform))
      if (index > -1) {
        const { source, targets } = config.rules[index]
        const same: Record<string, [string, string][]> = {}
        for (const target of targets) {
          if (target.disabled) continue
          const botId = `${target.platform}:${target.selfId}`
          if (typeof same[botId] === 'undefined') {
            same[botId] = []
          }
          same[botId].push([target.channelId, target.guildId])
        }
        const message = `[${source.name} - ${(typeof session.author.nickname !== "undefined" && session.author.nickname) || session.author.username}] ${session.content}`
        for (const botId of Object.keys(same)) {
          const bot = ctx.bots[botId]
          if (botId.includes('telegram') || botId.includes('discord')) {
            bot.broadcast(same[botId], parseMessageFace(message))
            continue
          }
          bot.broadcast(same[botId], message)
        }
      }
    }
    return next()
  }, true)
}
