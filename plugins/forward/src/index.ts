import { Context, Schema, h, Dict, sleep, Keys } from 'koishi'
import { MessageParse } from './parse'

interface Sent {
  from: string
  to: string
  from_sid: string
  to_sid: string
  from_channel_id: string
  to_channel_id: string
  time: Date
}

declare module 'koishi' {
  interface Tables {
    myrtus_forward_sent: Sent
  }
}

export const name = 'forward'

export const using = ['database'] as const

export function apply(ctx: Context, config: Config) {
  ctx.model.extend('myrtus_forward_sent', {
    time: 'timestamp',
    from: 'string(64)',
    to: 'string(64)',
    from_sid: 'string(64)',
    to_sid: 'string(64)',
    from_channel_id: 'string(64)',
    to_channel_id: 'string(64)',
  }, {
    primary: 'time'
  })

  for (const rule of config.rules) {
    const sConfig = config.constants[rule.source] as SourceConst | FullConst
    if (sConfig) {
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
      ctx.platform(sConfig.platform).guild(sConfig.guildId).channel(sConfig.channelId).middleware(async (session, next) => {
        if (session.type !== 'message' || session.elements.length === 0) {
          return next()
        }

        for (const regexpStr of sConfig.blockingWords) {
          const includeBlockingWord = session.elements.some(value => {
            if (value.type === 'text') {
              return new RegExp(regexpStr).test(value.attrs.content)
            }
            return false
          })

          if (includeBlockingWord) return next()
        }

        const prefix = `[${sConfig.name} - ${session.author.nickname || session.author.username}]\n`
        const message = [h.text(prefix), ...session.elements]
        const guildMemberMap = await session.bot.getGuildMemberMap(session.guildId)
        const payload = new MessageParse(message).face().record().at(guildMemberMap).output()
        const delay = ctx.root.config.delay.broadcast

        let rows: Pick<Sent, Keys<Sent, any>>[]
        if (session.quote) {
          const { quote, selfId, sid, channelId } = session
          if (selfId === quote.userId) {
            rows = await ctx.database.get('myrtus_forward_sent', {
              to: quote.messageId,
              to_sid: sid,
              to_channel_id: channelId
            })
          } else {
            rows = await ctx.database.get('myrtus_forward_sent', {
              from: quote.messageId,
              from_sid: sid,
              from_channel_id: channelId
            })
          }
        }

        const sent: Sent[] = []
        for (let index = 0; index < targetConfigs.length; index++) {
          if (index && delay) await sleep(delay)

          const target = targetConfigs[index]
          const targetSid = `${target.platform}:${target.selfId}`

          if (session.quote) {
            const { quote, selfId } = session
            let added = false
            if (selfId === quote.userId) {
              const row = rows.find(v => v.from_sid === targetSid)
              if (row) {
                payload.children.unshift(h.quote(row.from))
                added = true
              }
            } else {
              const row = rows.find(v => v.to_sid === targetSid)
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
            const bot = ctx.bots[targetSid]
            if (!bot) {
              ctx.logger('forward').warn(`暂时找不到机器人实例 %c, 等待一会儿说不定就有了呢!`, targetSid)
              continue
            }
            const messageIds = await bot.sendMessage(target.channelId, payload, target.guildId)
            const fromSid = `${session.platform}:${session.selfId}`
            for (const msgId of messageIds) {
              sent.push({
                from: session.messageId,
                from_sid: fromSid,
                to: msgId,
                to_sid: targetSid,
                from_channel_id: session.channelId,
                to_channel_id: target.channelId,
                time: new Date()
              })
            }
          } catch (error) {
            ctx.logger('forward').warn(error)
          }
        }

        if (sent.length !== 0) {
          ctx.database.upsert('myrtus_forward_sent', sent)
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
  blockingWords: string[]
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
          blockingWords: Schema.array(Schema.string().required().description('正则表达式 (无需斜杠包围)')).description('屏蔽词 (消息包含屏蔽词时不转发)')
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
          blockingWords: Schema.array(Schema.string().required().description('正则表达式 (无需斜杠包围)')).description('「来源」屏蔽词 (消息包含屏蔽词时不转发)')
        } as const),
      ])
    ]).description('常量名称 (可随意填写)')).description('常量列表 (「消息转发规则」中的参数)')
  }).description('常量设置'),
  Schema.object({
    rules: Schema.array(Schema.object({
      source: Schema.string().required().description('来源 (此处填入「常量名称」)'),
      targets: Schema.array(String).description('目标列表 (此处填入「常量名称」)'),
    })).description('消息转发规则列表'),
  }).description('转发规则设置')
])
