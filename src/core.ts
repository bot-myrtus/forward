import { Context, h, Universal } from 'koishi'
import { RuleSource, RuleTarget, Config } from './config'

declare module 'koishi' {
  interface Tables {
    myrtus_forward_sent: Sent
  }
}

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

function transform(source: h[], rules?: h.SyncVisitor<never>): h[] {
  return h.transform(source, {
    at(attrs) {
      const name = attrs.name || attrs.id
      return h.text(`@${name}`)
    },
    face(attrs) {
      const name = attrs.name || '表情'
      return h.text(`[${name}]`)
    },
    audio(attrs) {
      return h.text('[语音]')
    },
    ...rules
  })
}

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

  const { logger } = ctx

  for (const rule of config.rules) {
    const sConfig = config.constants[rule.source] as RuleSource
    if (!sConfig) continue
    const targetConfigs: RuleTarget[] = []
    for (const target of rule.targets) {
      const targetConfig = config.constants[target] as RuleTarget
      if (targetConfig && !targetConfig.disabled) {
        targetConfigs.push(targetConfig)
      }
    }
    if (targetConfigs.length === 0) {
      continue
    }

    let listened = ctx.platform(sConfig.platform)
    if (sConfig.selfId !== '*') listened = listened.self(sConfig.selfId)
    if (sConfig.channelId !== '*') listened = listened.channel(sConfig.channelId)

    listened.on('message-created', async (session) => {
      const { event, sid } = session

      for (const regexpStr of sConfig.blockingWords) {
        const reg = new RegExp(regexpStr)
        const hit = session.elements.some(v => {
          if (v.type === 'text') {
            return reg.test(v.attrs.content)
          }
          return false
        })
        if (hit) return
      }

      let rows: Sent[] = []
      const { quote } = event.message
      let quoteUser: Universal.User
      if (quote) {
        quoteUser = quote.user ?? (await session.bot.getMessage(session.channelId, quote.id)).user
        if (event.selfId === quoteUser.id) {
          rows = await ctx.database.get('myrtus_forward_sent', {
            to: quote.id,
            to_sid: sid,
            to_channel_id: event.channel.id
          })
          if (sConfig.onlyQuote && rows.length === 0) {
            return
          }
        } else if (sConfig.onlyQuote) {
          return
        } else {
          rows = await ctx.database.get('myrtus_forward_sent', {
            from: quote.id,
            from_sid: sid,
            from_channel_id: event.channel.id
          })
        }
        logger.debug('%C', '=== inspect quote ===')
        logger.debug(`from sid: ${sid}`)
      } else if (sConfig.onlyQuote) {
        return
      }

      const filtered = transform(event.message.elements, {
        at(attrs) {
          if (sConfig.onlyQuote && attrs.id === event.selfId) {
            return h.text('')
          }
          const name = attrs.name || attrs.id
          return h.text(`@${name}`)
        }
      })
      const sent: Sent[] = []

      for (let index = 0; index < targetConfigs.length; index++) {
        const target = targetConfigs[index]
        const targetSid = `${target.platform}:${target.selfId}`
        const bot = ctx.bots[targetSid]

        if (!bot) {
          logger.warn(`暂时找不到机器人实例 %c, 等待一会儿说不定就有了呢!`, targetSid)
          continue
        }
        if (bot.status !== Universal.Status.ONLINE) {
          logger.warn(`机器人实例 %c 处于非在线状态，可能与网络环境有关。`, targetSid)
          continue
        }

        let prefix: h
        if (target.simulateOriginal && target.platform === 'discord') {
          let avatar = event.user.avatar
          if (event.platform === 'telegram') {
            avatar = 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png'
          }
          prefix = h('author', {
            name: `[${sConfig.name ?? ''}] ${session.username}`,
            avatar
          })
        } else {
          const altName = sConfig.name ? `${sConfig.name} - ` : ''
          prefix = h.text(`[${altName}${session.username}]\n`)
        }

        const delay = config.delay[target.platform] ?? 200
        if (index) await ctx.sleep(delay)

        const payload: h[] = [prefix, ...filtered]
        if (event.message.quote) {
          let quoteId: string | undefined
          if (event.selfId === quoteUser.id) {
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
            if (payload[0].type === 'author') {
              payload.splice(1, 0, h.quote(quoteId))
            } else {
              payload.unshift(h.quote(quoteId))
            }
            logger.debug(`msgId: ${quoteId}`)
            logger.debug(`quote added`)
          } else {
            const { user, elements = [], member } = event.message.quote
            const name = member?.nick || user.nick || user.name
            payload.unshift(h.text(`Re ${name} ⌈`), ...transform(elements), h.text('⌋\n'))
            logger.debug('quote not added')
          }
          logger.debug(`to sid: ${targetSid}`)
        }

        try {
          const messageIds = await bot.sendMessage(target.channelId, payload)
          for (const msgId of messageIds) {
            sent.push({
              from: event.message.id,
              from_sid: `${event.platform}:${event.selfId}`,
              to: msgId,
              to_sid: targetSid,
              from_channel_id: event.channel.id,
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
    })
  }
}
