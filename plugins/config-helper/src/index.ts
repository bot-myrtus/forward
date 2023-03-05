import { Context, Schema } from 'koishi'

export const name = 'config-helper'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command("groupid", '获取群组编号').action(({ session }) => `channelId (群组编号): ${session.channelId}\nguildId (父级群组编号): ${session.guildId}`)

  ctx.command("selfid", '获取机器人自身编号').action(({ session }) => `selfId (自身编号): ${session.selfId}`)

  ctx.command("platform", '获取当前平台').action(({ session }) => `platform (平台): ${session.platform}`)

  ctx.middleware((session, next)=>{
    //console.log(session)
    return next()
  })
}