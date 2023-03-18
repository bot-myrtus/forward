import { Context, Schema, h, Dict, sleep, Keys, Time } from 'koishi'
import { MessageParse } from './parse'

interface Sent {
  from: string
  to: string
  from_sid: string
  to_sid: string
  from_channel_id: string
  to_channel_id: string
  time: Date
  id?: number
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
    id: 'unsigned',
    time: 'timestamp',
    from: 'string(64)',
    to: 'string(64)',
    from_sid: 'string(64)',
    to_sid: 'string(64)',
    from_channel_id: 'string(64)',
    to_channel_id: 'string(64)',
  }, {
    autoInc: true
  })

  for (const rule of config.rules) {
    const sConfig = config.constants[rule.source] as SourceConfig
    if (!sConfig) continue
    const targetConfigs: Array<TargetConfig> = []
    for (const target of rule.targets) {
      const targetConfig = config.constants[target] as TargetConfig
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
        const target = targetConfigs[index]
        const targetSid = `${target.platform}:${target.selfId}`
        const bot = ctx.bots[targetSid]

        if (!bot) {
          ctx.logger('forward').warn(`暂时找不到机器人实例 %c, 等待一会儿说不定就有了呢!`, targetSid)
          continue
        }
        if (bot.status !== 'online') {
          ctx.logger('forward').warn(`机器人实例 %c 处于非在线状态，可能与网络环境有关。`, targetSid)
          continue
        }

        if (index) await sleep(config.delay[target.platform])

        if (session.quote) {
          let added = false
          if (session.selfId === session.quote.userId) {
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
            const username = author.nickname || author.username
            const re: h[] = [h.text(`Re ${username} ⌈`), ...elements, h.text('⌋\n')]
            payload.children.splice(1, 0, ...new MessageParse(re).face().at(guildMemberMap).outputRaw())
          }
        }

        try {
          const messageIds = await bot.sendMessage(target.channelId, payload, target.guildId)
          for (const msgId of messageIds) {
            sent.push({
              from: session.messageId,
              from_sid: `${session.platform}:${session.selfId}`,
              to: msgId,
              to_sid: targetSid,
              from_channel_id: session.channelId,
              to_channel_id: target.channelId,
              time: new Date()
            })
          }
        } catch (error) {
          ctx.logger('forward').error(error)
        }
      }

      if (sent.length !== 0) {
        ctx.database.upsert('myrtus_forward_sent', sent)
      }

      return next()
    })
  }
}

type Platform = 'onebot' | 'telegram' | 'discord' | 'qqguild' | 'kook' | 'feishu'

interface Source {
  channelId: string
  name: string
  platform: Platform
  guildId: string
  blockingWords: string[]
}
interface Target {
  selfId: string
  channelId: string
  platform: Platform
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

type TargetConfig = TargetConst | FullConst
type SourceConfig = SourceConst | FullConst

export interface Config {
  constants: Dict<SourceConst | TargetConst | FullConst, string>,
  rules: {
    source: string
    targets: string[]
  }[],
  delay: {
    onebot: number
    telegram: number
    discord: number
    qqguild: number
    kook: number
    feishu: number
  }
}

const platform = [
  Schema.const('onebot' as const).description('onebot (QQ)'),
  Schema.const('telegram' as const),
  Schema.const('discord' as const),
  Schema.const('qqguild' as const).description('qqguild (QQ频道)'),
  Schema.const('kook' as const),
  Schema.const('feishu' as const).description('feishu (飞书)'),
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
  }).description('转发规则设置'),
  Schema.object({
    delay: Schema.object({
      onebot: Schema.natural().role('ms').default(0.5 * Time.second).description('onebot 消息发送的延迟 (单位为毫秒)'),
      telegram: Schema.natural().role('ms').default(0.1 * Time.second).description('telegram 消息发送的延迟 (单位为毫秒)'),
      discord: Schema.natural().role('ms').default(0.1 * Time.second).description('discord 消息发送的延迟 (单位为毫秒)'),
      qqguild: Schema.natural().role('ms').default(0.5 * Time.second).description('qqguild 消息发送的延迟 (单位为毫秒)'),
      kook: Schema.natural().role('ms').default(0.1 * Time.second).description('kook 消息发送的延迟 (单位为毫秒)'),
      feishu: Schema.natural().role('ms').default(0.1 * Time.second).description('feishu 消息发送的延迟 (单位为毫秒)'),
    })
  }).description('发送间隔设置')
])
