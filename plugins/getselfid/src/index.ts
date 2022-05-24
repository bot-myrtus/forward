import { Context } from 'koishi'

export const name = 'getselfid'

export function apply(ctx: Context) {
  ctx.command("selfid").action(({ session }) => `selfId (自身编号): ${session.selfId}`)
}