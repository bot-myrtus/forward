import { Context } from 'koishi'

export const name = 'annan-getsource'

export function apply(ctx: Context) {
  ctx.command("source").action(() => "https://github.com/idanran/myrtus/")
}
