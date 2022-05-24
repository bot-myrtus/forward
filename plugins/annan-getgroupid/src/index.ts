import { Context } from 'koishi'

export const name = 'annan-getgroupid'

export function apply(ctx: Context) {
  ctx.command("groupid").action(({ session }) => `群组编号: ${session.channelId}`)
}
