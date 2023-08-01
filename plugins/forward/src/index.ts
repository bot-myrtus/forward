import { Context, h, sleep, Keys } from 'koishi'
import { MessageParse } from './parse'
import { RuleSource, RuleTarget, Config } from './config'

export * from './config'

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

export const usage = `
这是用于在不同群组间转发消息的插件。

入门教程<a href="https://github.com/idanran/myrtus#%E8%AE%BE%E5%AE%9A%E6%B6%88%E6%81%AF%E8%BD%AC%E5%8F%91%E8%A7%84%E5%88%99" target="_blank">点此查阅</a>，如有疑问可<a href="https://github.com/idanran/myrtus/issues/new" target="_blank">提交 issue</a>。
`

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

  const logger = ctx.logger('forward')

  for (const rule of config.rules) {
    const sConfig = config.constants[rule.source] as RuleSource
    if (!sConfig) continue
    const targetConfigs: Array<RuleTarget> = []
    for (const target of rule.targets) {
      const targetConfig = config.constants[target] as RuleTarget
      if (targetConfig && !targetConfig.disabled) {
        targetConfigs.push(targetConfig)
      }
    }
    if (targetConfigs.length === 0) {
      continue
    }

    const listened = ctx.platform(sConfig.platform).guild(sConfig.guildId).channel(sConfig.channelId)
    listened.middleware(async (session, next) => {
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

      let rows: Pick<Sent, Keys<Sent>>[] = []
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
        logger.debug('%C', '=== inspect quote ===')
        logger.debug(`from sid: ${sid}`)
        logger.debug(rows)
      }

      const filtered: h[] = new MessageParse(session.elements).face().record().at().output()

      const sent: Sent[] = []
      for (let index = 0; index < targetConfigs.length; index++) {
        const target = targetConfigs[index]
        const targetSid = `${target.platform}:${target.selfId}`
        const bot = ctx.bots[targetSid]

        const nickname = session.author.nickname || session.author.username
        let prefix: h
        if (target.simulateOriginal && target.platform === 'discord') {
          prefix = h('author', {
            nickname: `[${sConfig.name}] ${nickname}`,
            avatar: session.author.avatar
          })
        } else {
          prefix = h.text(`[${sConfig.name} - ${nickname}]\n`)
        }
        const payload: h[] = [prefix, ...filtered]

        if (!bot) {
          logger.warn(`暂时找不到机器人实例 %c, 等待一会儿说不定就有了呢!`, targetSid)
          continue
        }
        if (bot.status !== 'online') {
          logger.warn(`机器人实例 %c 处于非在线状态，可能与网络环境有关。`, targetSid)
          continue
        }

        const delay = typeof config.delay[target.platform] !== undefined ? config.delay[target.platform] : 10
        if (index) await sleep(delay)

        if (session.quote) {
          let quoteId: string | undefined
          if (session.selfId === session.quote.userId) {
            logger.debug('selfId = quote.userId')
            const row = rows.find(v => v.from_sid === targetSid && v.from_channel_id === target.channelId)
            if (row) {
              quoteId = row.from
              logger.debug(`channelId: ${row.from_channel_id}`)
            }
          } else {
            logger.debug('selfId != quote.userId')
            const row = rows.find(v => v.to_sid === targetSid && v.to_channel_id === target.channelId)
            if (row) {
              quoteId = row.to
              logger.debug(`channelId: ${row.to_channel_id}`)
            }
          }
          if (quoteId) {
            payload.unshift(h.quote(quoteId))
            logger.debug(`msgId: ${quoteId}`)
            logger.debug(`added`)
          } else {
            const { author, elements } = session.quote
            const username = author.nickname || author.username
            const re: h[] = [h.text(`Re ${username} ⌈`), ...elements, h.text('⌋\n')]
            payload.unshift(...new MessageParse(re).face().record().at().output())
            logger.debug('not added')
          }
          logger.debug(`to sid: ${targetSid}`)
        }

        try {
          logger.debug(payload)
          const messageIds = await bot.sendMessage(target.channelId, h(null, payload), target.guildId)
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
          logger.error(error)
        }
      }

      if (sent.length !== 0) {
        ctx.database.upsert('myrtus_forward_sent', sent)
      }

      return next()
    })
  }
}