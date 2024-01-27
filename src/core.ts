import { Context, h, sleep, Keys, Universal, isNullable } from 'koishi'
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

        let listened = ctx.platform(sConfig.platform)
        if (sConfig.selfId !== '*') listened = listened.self(sConfig.selfId)
        if (sConfig.guildId !== '*') listened = listened.guild(sConfig.guildId)
        if (sConfig.channelId !== '*') listened = listened.channel(sConfig.channelId)

        listened.on('message-created', async (session) => {
            const { event, sid } = session

            for (const regexpStr of sConfig.blockingWords) {
                const includeBlockingWord = event.message.elements.some(value => {
                    if (value.type === 'text') {
                        return new RegExp(regexpStr).test(value.attrs.content)
                    }
                    return false
                })

                if (includeBlockingWord) return
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

                const name = event.member?.nick || event.user.nick || event.user.name
                let prefix: h
                if (target.simulateOriginal && target.platform === 'discord') {
                    let avatar = event.user.avatar
                    if (event.platform === 'telegram') {
                        /*const user = await session.bot.getUser(event.user.id)
                        const [message] = await bot.createMessage(target.channelId, h.image(user.avatar))
                        await bot.deleteMessage(target.channelId, message.id)
                        avatar = message.elements[0].attrs.url*/
                        /*const data = await session.bot.internal.getChat({ chat_id: event.user.id })
                        if (data.photo) {
                            const fileId = data.photo.small_file_id || data.photo.big_file_id
                            const file = await session.bot.internal.getFile({ file_id: fileId })
                            // @ts-ignore
                            if (session.bot.server) {
                                // @ts-ignore
                                avatar = `${session.bot.server}/${file.file_path}`
                            } else {
                                // @ts-ignore
                                const { endpoint } = session.bot.file.config
                                avatar = `${endpoint}/${file.file_path}`
                            }
                        } else {
                            avatar = 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png'
                        }*/
                        avatar = 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png'
                    }
                    prefix = h('author', {
                        name: `[${sConfig.name}] ${name}`,
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

                const delay = isNullable(config.delay[target.platform]) ? 100 : config.delay[target.platform]
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
                        logger.debug(`added`)
                    } else {
                        const { user, elements } = event.message.quote
                        const re: h[] = [h.text(`Re ${user.nick || user.name} ⌈`), ...(elements || []), h.text('⌋\n')]
                        payload.unshift(...new MessageParse(re).face().record().at().output())
                        logger.debug('not added')
                    }
                    logger.debug(`to sid: ${targetSid}`)
                }

                try {
                    logger.debug(payload)
                    const messageIds = await bot.sendMessage(target.channelId, payload, target.guildId)
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
