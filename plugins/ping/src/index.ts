import { Context } from 'koishi'

export const name = 'ping'

export function apply(ctx: Context) {
  ctx.command("ping").action(() => `pang`)
}
