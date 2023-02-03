import { Context, Schema, h, Dict, sleep, Keys } from 'koishi'
import { MessageParse } from './parse'

interface Message {
  id?: number
  from: string
  to: string
  from_platform: string
  to_platform: string
  from_self: string
  to_self: string
}

declare module 'koishi' {
  interface Tables {
    myrtus_forward_message: Message
  }
}

export const name = 'forward'

export const using = ['database'] as const

export function apply(ctx: Context, config: Config) {
  ctx.model.extend('myrtus_forward_message', {
    id: 'unsigned',
    from: 'string(32)',
    to: 'string(32)',
    from_platform: 'string(16)',
    to_platform: 'string(16)',
    from_self: 'string(32)',
    to_self: 'string(32)',
  }, {
    autoInc: true,
  })

  for (const rule of config.rules) {
    const sourceConfig = config.constants[rule.source] as SourceConst | FullConst
    if (sourceConfig) {
      const targetConfigs: Array<TargetConst | FullConst> = []
      for (const target of rule.targets) {
        const targetConfig = config.constants[target] as TargetConst | FullConst
        if (targetConfig && !targetConfig.disabled) {
          targetConfigs.push(targetConfig)
        }
      }
      if (targetConfigs.length === 0) {
        continue
      }
      ctx.platform(sourceConfig.platform).guild(sourceConfig.guildId).channel(sourceConfig.channelId).middleware(async (session, next) => {
        if (session.type === 'message') {
          const prefix = `[${sourceConfig.name} - ${session.author.nickname || session.author.username}]\n`
          const message = session.elements
          message.unshift(h.text(prefix))
          const guildMemberMap = await session.bot.getGuildMemberMap(session.guildId)
          const payload = new MessageParse(message).face().record().at(guildMemberMap).output()

          const sent: [to: string, to_platform: string, to_self: string][] = []
          const delay = ctx.root.config.delay.broadcast
          let rows: Pick<Message, Keys<Message, any>>[]
          if (session.quote) {
            const { quote, platform, selfId } = session
            if (selfId === quote.userId) {
              rows = await ctx.database.get('myrtus_forward_message', {
                $and: [
                  { to: quote.messageId },
                  { to_platform: platform },
                  { to_self: selfId }
                ]
              })
            } else {
              rows = await ctx.database.get('myrtus_forward_message', {
                $and: [
                  { from: quote.messageId },
                  { from_platform: platform },
                  { from_self: selfId }
                ]
              })
            }
          }
          for (let index = 0; index < targetConfigs.length; index++) {
            if (index && delay) await sleep(delay)
            const target = targetConfigs[index]
            if (session.quote) {
              const { quote, selfId } = session
              let added = false
              if (selfId === quote.userId) {
                const row = rows.find(v => v.from_platform === target.platform && v.from_self === target.selfId)
                if (row) {
                  payload.children.unshift(h.quote(row.from))
                  added = true
                }
              } else {
                const row = rows.find(v => v.to_platform === target.platform && v.to_self === target.selfId)
                if (row) {
                  payload.children.unshift(h.quote(row.to))
                  added = true
                }
              }
              if (!added) {
                const { author, elements } = session.quote
                const re: h[] = []
                re.push(h.text(`Re ${author.nickname || author.username} ⌈`))
                re.push(...elements)
                re.push(h.text('⌋\n'))
                payload.children.splice(1, 0, ...new MessageParse(re).face().at(guildMemberMap).outputRaw())
              }
            }
            try {
              const sid = `${target.platform}:${target.selfId}`
              sent.push([(await ctx.bots[sid].sendMessage(target.channelId, payload, target.guildId))[0], target.platform, target.selfId])
            } catch (error) {
              ctx.logger('bot').warn(error)
            }
          }

          for (const item of sent) {
            ctx.database.create('myrtus_forward_message', {
              from: session.messageId,
              from_platform: session.platform,
              from_self: session.selfId,
              to: item[0],
              to_platform: item[1],
              to_self: item[2]
            })
          }
        }
        return next()
      })
    }
  }
}

interface Source {
  channelId: string
  name: string
  platform: string
  guildId: string
}

interface Target {
  selfId: string
  channelId: string
  platform: string
  guildId: string
  disabled: boolean
}

interface SourceConst extends Source {
  type: 'source'
}

interface TargetConst extends Target {
  type: 'target'
}

interface FullConst extends Target, Source {
  type: 'full'
}

export interface Config {
  constants: Dict<SourceConst | TargetConst | FullConst, string>,
  rules: {
    source: string
    targets: string[]
  }[]
}

const platform = [
  Schema.const('onebot').description('onebot (QQ)'),
  Schema.const('telegram'),
  Schema.const('discord'),
  Schema.const('qqguild').description('qqguild (QQ频道)'),
  Schema.const('kook'),
  Schema.const('feishu').description('feishu (飞书)'),
]

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    constants: Schema.dict(Schema.intersect([
      Schema.object({
        type: Schema.union([
          Schema.const('source').description('仅用于「来源」'),
          Schema.const('target').description('仅用于「目标」'),
          Schema.const('full').description('用于「来源」或「目标」(通常用以双向转发)'),
        ]).role('radio').required().description('常量类型'),
      }),
      Schema.union([
        Schema.object({
          type: Schema.const('source' as const).required(),
          name: Schema.string().required().description('群组代称'),
          channelId: Schema.string().required().description('群组编号'),
          platform: Schema.union(platform).required().description('群组平台'),
          guildId: Schema.string().required().description('父级群组编号 (可能与群组编号相同)'),
        } as const),
        Schema.object({
          type: Schema.const('target' as const).required(),
          selfId: Schema.string().required().description('机器人自身编号'),
          channelId: Schema.string().required().description('群组编号'),
          platform: Schema.union(platform).required().description('群组平台'),
          guildId: Schema.string().required().description('父级群组编号 (可能与群组编号相同)'),
          disabled: Schema.boolean().default(false).description('是否禁用')
        } as const),
        Schema.object({
          type: Schema.const('full' as const).required(),
          selfId: Schema.string().required().description('「目标」机器人自身编号'),
          channelId: Schema.string().required().description('「来源」/「目标」群组编号'),
          platform: Schema.union(platform).required().description('「来源」/「目标」群组平台'),
          guildId: Schema.string().required().description('「来源」/「目标」父级群组编号 (可能与群组编号相同)'),
          disabled: Schema.boolean().default(false).description('「目标」是否禁用'),
          name: Schema.string().required().description('「来源」群组代称'),
        } as const),
      ])
    ])).description('常量列表 (「消息转发规则」中的参数)')
  }).description('常量设置'),
  Schema.object({
    rules: Schema.array(Schema.object({
      source: Schema.string().required().description('来源 (常量, 即 constants.x 中的 x)'),
      targets: Schema.array(String).description('目标列表 (常量, 即 constants.x 中的 x)'),
    })).description('消息转发规则列表'),
  }).description('转发规则设置')
])
