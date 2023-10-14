import { Context, h, sleep, Keys, Universal } from 'koishi'
import { MessageParse } from './parse'
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
        listened.middleware(async ({ event, sid }, next) => {
            if (event.type !== 'message-created' || event.message.elements.length === 0) {
                return next()
            }

            for (const regexpStr of sConfig.blockingWords) {
                const includeBlockingWord = event.message.elements.some(value => {
                    if (value.type === 'text') {
                        return new RegExp(regexpStr).test(value.attrs.content)
                    }
                    return false
                })

                if (includeBlockingWord) return next()
            }

            let rows: Pick<Sent, Keys<Sent>>[] = []
            const { quote } = event.message
            if (quote) {
                if (event.selfId === quote.user.id) {
                    rows = await ctx.database.get('myrtus_forward_sent', {
                        to: quote.id,
                        to_sid: sid,
                        to_channel_id: event.channel.id
                    })
                } else {
                    rows = await ctx.database.get('myrtus_forward_sent', {
                        from: quote.id,
                        from_sid: sid,
                        from_channel_id: event.channel.id
                    })
                }
                logger.debug('%C', '=== inspect quote ===')
                logger.debug(`from sid: ${sid}`)
                logger.debug(rows)
            }

            const filtered: h[] = new MessageParse(event.message.elements).face().record().at().output()

            const sent: Sent[] = []
            for (let index = 0; index < targetConfigs.length; index++) {
                const target = targetConfigs[index]
                const targetSid = `${target.platform}:${target.selfId}`
                const bot = ctx.bots[targetSid]

                const { name, avatar } = event.user
                let prefix: h
                if (target.simulateOriginal && target.platform === 'discord') {
                    prefix = h('author', {
                        nickname: `[${sConfig.name}] ${name}`,
                        avatar
                    })
                } else {
                    prefix = h.text(`[${sConfig.name} - ${name}]\n`)
                }
                const payload: h[] = [prefix, ...filtered]

                if (!bot) {
                    logger.warn(`暂时找不到机器人实例 %c, 等待一会儿说不定就有了呢!`, targetSid)
                    continue
                }
                if (bot.status !== Universal.Status.ONLINE) {
                    logger.warn(`机器人实例 %c 处于非在线状态，可能与网络环境有关。`, targetSid)
                    continue
                }

                const delay = typeof config.delay[target.platform] !== undefined ? config.delay[target.platform] : 10
                if (index) await sleep(delay)

                if (event.message.quote) {
                    let quoteId: string | undefined
                    if (event.selfId === event.message.quote.user.id) {
                        logger.debug('selfId = quote.userId')
                        const row = rows.find(v => v.from_sid === targetSid && v.from_channel_id === target.channelId)
                        if (row) {
                            quoteId = row.from
                            logger.debug(`channelId: ${row.from_channel_id}`)
                        }
                    } else {
                        logger.debug('selfId != quote.userId')
                        const row = rows.find(v => v.to_sid === targetSid && v.to_channel_id === target.channelId)
                        console.log(row)
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
                        const { user, elements } = event.message.quote
                        const re: h[] = [h.text(`Re ${user.name} ⌈`), ...(elements || []), h.text('⌋\n')]
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

            return next()
        })
    }
}