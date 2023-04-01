import { Context, Schema, h } from 'koishi'

export const name = 'sundry'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command("source").action(() => "https://github.com/idanran/myrtus/")

  ctx.command("ping").action(() => `pang`)

  ctx.middleware((session, next) => {
    //console.log(session)
    return next()
  })
}
