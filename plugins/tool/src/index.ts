import { Context, Schema } from 'koishi'

export const name = 'tool'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command("groupid").action(({ session }) => `channelId (群组编号): ${session.channelId}\nguildId (父级群组编号): ${session.guildId}`)

  ctx.command("selfid").action(({ session }) => `selfId (自身编号): ${session.selfId}`)

  ctx.command("source").action(() => "https://github.com/idanran/myrtus/")

  ctx.command("ping").action(() => `pang`)
}
