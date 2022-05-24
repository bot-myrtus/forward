import { Context } from 'koishi'

export const name = 'annan-getselfid'

export function apply(ctx: Context) {
  ctx.command("selfid").action(({ session }) => `自身编号: ${session.selfId}`)
}