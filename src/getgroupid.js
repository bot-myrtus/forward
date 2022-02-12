module.exports.name = 'getgroupid'

module.exports.apply = (ctx, config) => {
    const cmd = ctx.command("groupid", "获取群组ID");
    cmd.action(async ({ session } = argv) => {
        if (!config.disabled) {
            if (session.platform === "qqguild") {
                await session.sendQueued(`频道ID: ${session.guildId}`)
                await session.sendQueued(`子频道ID: ${session.channelId}`)
            } else if (session.platform === "discord") {
                await session.sendQueued(`频道ID: ${session.guildId}`)
                await session.sendQueued(`子频道ID: ${session.channelId}`)
            } else {
                session.send(`群组ID: ${session.channelId}`)
            }
        }
    })
}