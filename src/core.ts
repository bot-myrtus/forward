import { Awaitable, Context, Dict, h, Universal } from 'koishi'
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

type Visitor<S> = Dict<h.Transformer<S>> | h.Visit<Awaitable<boolean | h.Fragment>, S>

// Some adapters emit opaque message or channel identifiers longer than 64 chars.
const IDENTIFIER_TYPE = 'string(255)'

function transform<S = never>(platform: string, source: h[], rules?: Visitor<S>): Promise<h[]> {
  return h.transformAsync(source, {
    at(attrs) {
      let name = attrs.name || attrs.id
      if (platform === 'discord' && attrs.type === 'all') {
        name = 'everyone\n'
      }
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

function relativeTime(date: number) {
  const now = Date.now()
  const diff = date - now
  const abs = Math.abs(diff)

  const seconds = Math.floor(abs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (diff > 0) {
    if (days > 0) return `${days}天内`
    if (hours > 0) return `${hours}小时内`
    if (minutes > 0) return `${minutes}分钟内`
    return `${seconds}秒内`
  } else {
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return `${seconds}秒前`
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.model.extend('myrtus_forward_sent', {
    id: 'unsigned',
    time: 'timestamp',
    from: IDENTIFIER_TYPE,
    to: IDENTIFIER_TYPE,
    from_sid: IDENTIFIER_TYPE,
    to_sid: IDENTIFIER_TYPE,
    from_channel_id: IDENTIFIER_TYPE,
    to_channel_id: IDENTIFIER_TYPE,
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

      if (session.platform === 'discord' && session.userId === session.selfId) {
        return
      }

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
      let quoteUser = quote?.user ?? quote?.member?.user
      let quoteIsSelf = false
      if (quote) {
        // QQ group replies can include only a nickname and quoted content, and
        // the adapter does not support fetching the original message.
        if (!quoteUser && quote.id && typeof session.bot.getMessage === 'function') {
          try {
            quoteUser = (await session.bot.getMessage(session.channelId, quote.id))?.user
          } catch (error) {
            logger.debug('cannot fetch quoted message: %s', error)
          }
        }
        quoteIsSelf = event.selfId === quoteUser?.id
        if (quote.id && (quoteIsSelf || !quoteUser?.id)) {
          rows = await ctx.database.get('myrtus_forward_sent', {
            to: quote.id,
            to_sid: sid,
            to_channel_id: event.channel.id
          })
          // A stored forwarding record can identify our own message even when
          // the platform omits the author of the quoted message.
          if (rows.length) quoteIsSelf = true
        }
        if (sConfig.onlyQuote && (!quoteIsSelf || !rows.length)) return
        if (quote.id && !quoteIsSelf) {
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

      const filtered = await transform(session.platform, event.message.elements, {
        at(attrs) {
          if (sConfig.onlyQuote && attrs.id === event.selfId) {
            return h.text('')
          }
          let name = attrs.name || attrs.id
          if (session.platform === 'discord' && attrs.type === 'all') {
            name = 'everyone\n'
          }
          return h.text(`@${name}`)
        },
        async img(attrs) {
          if (session.platform === 'discord') {
            const res = await ctx.http(attrs.src, { responseType: 'arraybuffer' })
            return h.img(res.data, res.headers.get('Content-Type'))
          }
          return h('img', attrs)
        }
      })
      if (session.platform === 'discord') {
        for (const embed of session.event._data.d.embeds) {
          const buffer = []
          if (embed.title) {
            buffer.push(embed.title)
          }
          if (embed.description) {
            buffer.push(embed.description)
          }
          filtered.push(h.text(buffer.join('\n')))
        }
        for (const element of filtered) {
          if (element.type === 'text') {
            element.attrs.content = element.attrs.content.replace(
              /<t:(\d+):([a-zA-Z])\/?>/g,
              (match: string, timestamp: string, format: string) => {
                if (format === 'F' || format === 'f') {
                  const date = new Date(+timestamp * 1000)
                  const options = {
                    timeZone: 'Asia/Shanghai',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  } as const
                  const locale = Object.keys(Object.values(ctx.root.i18n.locales)[0])[0]
                  return date.toLocaleString(locale, options)
                } else if (format === 'R') {
                  return relativeTime(+timestamp * 1000)
                } else if (format === 'S') {
                  const date = new Date(+timestamp * 1000)
                  const options = {
                    timeZone: 'Asia/Shanghai'
                  } as const
                  const locale = Object.keys(Object.values(ctx.root.i18n.locales)[0])[0]
                  return date.toLocaleString(locale, options)
                } else {
                  return match
                }
              }
            )
          }
        }
      }
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

        let prefix: h | undefined
        if (target.simulateOriginal && target.platform === 'discord') {
          let avatar = event.user.avatar
          if (event.platform === 'telegram') {
            avatar = 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png'
          }
          prefix = h('author', {
            name: `[${sConfig.name ?? ''}] ${session.username}`,
            avatar
          })
        } else if (!target.hidePrefix) {
          const altName = sConfig.name ? `${sConfig.name} - ` : ''
          prefix = h.text(`[${altName}${session.username}]\n`)
        }

        const delay = config.delay[target.platform] ?? 200
        if (index) await ctx.sleep(delay)

        const payload: h[] = prefix ? [prefix, ...filtered] : [...filtered]
        if (event.message.quote) {
          let quoteId: string | undefined
          if (quoteIsSelf) {
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
            if (payload[0]?.type === 'author') {
              payload.splice(1, 0, h.quote(quoteId))
            } else {
              payload.unshift(h.quote(quoteId))
            }
            logger.debug(`msgId: ${quoteId}`)
            logger.debug(`quote added`)
          } else {
            const { user, elements = [], member } = event.message.quote
            const name = member?.nick || user?.nick || user?.name || quoteUser?.nick || quoteUser?.name || quoteUser?.id || '未知用户'
            payload.unshift(h.text(`Re ${name} ⌈`), ...(await transform(session.platform, elements)), h.text('⌋\n'))
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
