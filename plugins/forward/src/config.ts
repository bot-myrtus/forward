import { Schema, Dict, Time } from 'koishi'

type Platform = 'onebot' | 'telegram' | 'discord' | 'qqguild' | 'kook' | 'feishu' | 'lark' | 'matrix'

interface Source {
    channelId: string
    name: string
    platform: Platform
    guildId: string
    blockingWords: string[]
}
interface Target {
    selfId: string
    channelId: string
    platform: Platform
    guildId: string
    disabled: boolean
}

interface SourceConst extends Source {
    type: 'source'
}
interface TargetConst extends Target {
    type: 'target'
}
interface FullConst extends Target, Source {
    type: 'full'
}

interface Delay {
    onebot: number
    telegram: number
    discord: number
    qqguild: number
    kook: number
    feishu: number
    lark: number
    matrix: number
}

interface Rule {
    source: string
    targets: string[]
}

export type RuleTarget = TargetConst | FullConst
export type RuleSource = SourceConst | FullConst

export interface Config {
    constants: Dict<SourceConst | TargetConst | FullConst, string>,
    rules: Rule[],
    delay: Delay
}

const platform = [
    Schema.const('onebot').description('onebot (QQ)'),
    Schema.const('telegram'),
    Schema.const('discord'),
    Schema.const('qqguild').description('qqguild (QQ频道)'),
    Schema.const('kook'),
    Schema.const('feishu').description('feishu (飞书)'),
    Schema.const('lark').description('lark'),
    Schema.const('matrix')
]

const share = {
    platform: Schema.union(platform).description('平台名').default('onebot'),
    channelId: Schema.string().required().description('频道 ID (可能与群组 ID 相同)'),
    guildId: Schema.string().required().description('群组 ID'),
}

const delay: Schema<Delay> = Schema.object({
    onebot: Schema.natural().role('ms').default(0.5 * Time.second),
    telegram: Schema.natural().role('ms').default(0.1 * Time.second),
    discord: Schema.natural().role('ms').default(0.1 * Time.second),
    qqguild: Schema.natural().role('ms').default(0.5 * Time.second),
    kook: Schema.natural().role('ms').default(0.1 * Time.second),
    feishu: Schema.natural().role('ms').default(0.1 * Time.second),
    lark: Schema.natural().role('ms').default(0.1 * Time.second),
    matrix: Schema.natural().role('ms').default(0.1 * Time.second),
})

const rule: Schema<Rule> = Schema.object({
    source: Schema.string().required().description('来源 (此处填入「常量名称」)'),
    targets: Schema.array(String).description('目标列表 (此处填入「常量名称」)'),
})

const targetConst: Schema<TargetConst> = Schema.object({
    type: Schema.const('target').required(),
    selfId: Schema.string().required().description('自身 ID'),
    ...share,
    disabled: Schema.boolean().default(false).description('是否禁用')
})

const sourceConst: Schema<SourceConst> = Schema.object({
    type: Schema.const('source').required(),
    name: Schema.string().required().description('群组代称'),
    ...share,
    blockingWords: Schema.array(Schema.string().required().description('正则表达式 (无需斜杠包围)')).description('屏蔽词 (消息包含屏蔽词时不转发)')
})

const fullConst: Schema<FullConst> = Schema.object({
    type: Schema.const('full').required(),
    name: Schema.string().required().description('群组代称 (仅在常量用于「来源」时生效)'),
    selfId: Schema.string().required().description('自身 ID (仅在常量用于「目标」时生效)'),
    ...share,
    blockingWords: Schema.array(Schema.string().required().description('正则表达式 (无需斜杠包围)')).description('屏蔽词 (消息包含屏蔽词时不转发, 仅在常量用于「来源」时生效)'),
    disabled: Schema.boolean().default(false).description('是否禁用 (仅在常量用于「目标」时生效)'),
} as const)

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        constants: Schema.dict(Schema.intersect([
            Schema.object({
                type: Schema.union([
                    Schema.const('source').description('仅用于「来源」'),
                    Schema.const('target').description('仅用于「目标」'),
                    Schema.const('full').description('用于「来源」或「目标」(通常用以双向转发)'),
                ]).role('radio').required().description('常量类型'),
            }),
            Schema.union([
                sourceConst,
                targetConst,
                fullConst,
            ])
        ]).description('常量名称 (可随意填写)'))
    }),
    Schema.object({
        rules: Schema.array(rule),
    }),
    Schema.object({
        delay: delay
    })
]).i18n({
    'zh-CN': require('./locales/zh-CN'),
})