module.exports.name = 'getselfid'

module.exports.apply = (ctx, config) => {
    const cmd = ctx.command("selfid", "获取自身ID");
    cmd.action(({ session } = argv) => {
        if (!config.disabled) {
            session.sendQueued(`自身ID: ${session.selfId}`)
        }
    })
}