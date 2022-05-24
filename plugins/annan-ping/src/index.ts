import { Context } from 'koishi'

export const name = 'annan-ping'

export function apply(ctx: Context) {
  ctx.command("ping").action(() => `pang`)
}
