import { Context, Schema } from 'koishi'
import { parseMessageFace, parseMessageRecord } from './parse'

export const name = 'annan-forward'

interface groups {
  source: {
    groupId: string
    name: string
  }
  target: {
    qqGuild?: string[]
    qqGroup?: string[]
    telegram?: string[]
    discord?: string[]
  }
}

export interface Config {
  groups: groups[] | []
}

export const schema: Schema<Config> = Schema.object({
  groups: Schema.array(Schema.object({
    source: Schema.object({
      groupId: Schema.string().required().description('群组编号 (QQ 频道则为子频道编号)'),
      name: Schema.string().required().description('平台代称'),
    }).description('来源'),
    target: Schema.object({
      qqGuild:
        Schema.array(Schema.string().required().description('子频道编号')).description('QQ 频道目标列表'),
      qqGroup:
        Schema.array(Schema.string().required().description('群组编号')).description('QQ 群目标列表'),
      telegram:
        Schema.array(Schema.string().required().description('群组编号')).description('Telegram 目标列表'),
      discord:
        Schema.array(Schema.string().required().description('频道编号')).description('Discord 目标列表'),
    }).description('目标'),
  })).default([]).required().description('转发列表'),
})

export function apply(ctx: Context, config: Config) {
  ctx.middleware(async (session, next) => {
    const { author, channelId, content } = session
    if (!!content) {
      const index = config.groups.findIndex((element: { source: { groupId: string } }) => (element.source.groupId === channelId))
      if (index > -1) {
        const { qqGroup, qqGuild, telegram, discord } = config.groups[index].target
        const message = `[${config.groups[index].source.name} - ${(typeof author.nickname !== "undefined" && author.nickname) || author.username}] ${content}`
        if (typeof qqGroup !== "undefined") {
          const target = qqGroup.map((item) => `onebot:${item}`)
          ctx.broadcast(target, message)
        }
        if (typeof qqGuild !== "undefined") {
          const target = qqGuild.map((item) => `onebot:${item}`)
          ctx.broadcast(target, parseMessageRecord(message))
        }
        if (typeof telegram !== "undefined") {
          const target = telegram.map((item) => `telegram:${item}`)
          ctx.broadcast(target, parseMessageFace(message))
        }
        if (typeof discord !== "undefined") {
          const target = discord.map((item) => `discord:${item}`)
          ctx.broadcast(target, parseMessageFace(message))
        }
      }
    }
    return next()
  }, true)
}
