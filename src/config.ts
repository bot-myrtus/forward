import { Schema, Dict, Time } from 'koishi'

interface Source {
    channelId: string
    name: string
    platform: string
    guildId: string
    blockingWords: string[]
    selfId: string
}
interface Target {
    selfId: string
    channelId: string
    platform: string
    guildId: string
    disabled: boolean
    simulateOriginal: boolean
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
    [key: string]: number
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

const delay: Schema<Delay> = Schema.dict(Schema.natural().role('ms').default(0.1 * Time.second))

const rule: Schema<Rule> = Schema.object({
    source: Schema.string().required(),
    targets: Schema.array(String),
})

const share = {
    platform: Schema.string().required(),
    channelId: Schema.string().required(),
    guildId: Schema.string().required(),
}

const sourceConst: Schema<SourceConst> = Schema.object({
    type: Schema.const('source').required(),
    name: Schema.string(),
    ...share,
    blockingWords: Schema.array(String).role('table').default([]),
    selfId: Schema.string().default('*')
})

const targetConst: Schema<TargetConst> = Schema.object({
    type: Schema.const('target').required(),
    selfId: Schema.string().required(),
    ...share,
    simulateOriginal: Schema.boolean().default(false),
    disabled: Schema.boolean().default(false),
})

const fullConst: Schema<FullConst> = Schema.object({
    type: Schema.const('full').required(),
    name: Schema.string(),
    selfId: Schema.string().required(),
    ...share,
    blockingWords: Schema.array(String).role('table').default([]),
    simulateOriginal: Schema.boolean().default(false),
    disabled: Schema.boolean().default(false),
} as const)

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        constants: Schema.dict(Schema.intersect([
            Schema.object({
                type: Schema.union([
                    Schema.const('source'),
                    Schema.const('target'),
                    Schema.const('full'),
                ]).role('radio').required(),
            }),
            Schema.union([
                sourceConst,
                targetConst,
                fullConst,
            ])
        ]))
    }),
    Schema.object({
        rules: Schema.array(rule),
        delay: delay
    })
]).i18n({
    'zh-CN': require('./locales/zh-CN'),
})