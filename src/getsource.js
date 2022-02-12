module.exports.name = 'getsource'

module.exports.apply = (ctx, config) => {
    const cmd = ctx.command("source", "获取此机器人源码");
    cmd.action(({ session } = argv) => {
        session.send("https://github.com/idanran/AnNanBot");
    })
}