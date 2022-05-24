import { Context } from 'koishi'

export const name = 'getgroupid'

export function apply(ctx: Context) {
  ctx.command("groupid").action(({ session }) => `channelId (群组编号): ${session.channelId}\nguildId (父级群组编号): ${session.guildId}`)
}
