import { Schema, Dict, Time } from 'koishi'

interface Source {
    channelId: string
    name: string
    platform: string
    guildId: string
    blockingWords: string[]
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
    onebot: number
    telegram: number
    discord: number
    qqguild: number
    kook: number
    feishu: number
    lark: number
    matrix: number
    line: number
    dingtalk: number
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

const share = {
    platform: Schema.string().required(),
    channelId: Schema.string().required(),
    guildId: Schema.string().required(),
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
    line: Schema.natural().role('ms').default(0.1 * Time.second),
    dingtalk: Schema.natural().role('ms').default(0.1 * Time.second),
    mail: Schema.natural().role('ms').default(0.1 * Time.second),
    qq: Schema.natural().role('ms').default(0.1 * Time.second),
    satori: Schema.natural().role('ms').default(0.1 * Time.second),
    slack: Schema.natural().role('ms').default(0.1 * Time.second),
    'wechat-official': Schema.natural().role('ms').default(0.1 * Time.second),
    wecom: Schema.natural().role('ms').default(0.1 * Time.second),
    whatsapp: Schema.natural().role('ms').default(0.1 * Time.second),
    red: Schema.natural().role('ms').default(0.5 * Time.second),
})

const rule: Schema<Rule> = Schema.object({
    source: Schema.string().required(),
    targets: Schema.array(String),
})

const sourceConst: Schema<SourceConst> = Schema.object({
    type: Schema.const('source').required(),
    name: Schema.string().required(),
    ...share,
    blockingWords: Schema.array(String).role('table')
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
    name: Schema.string().required(),
    selfId: Schema.string().required(),
    ...share,
    blockingWords: Schema.array(String).role('table'),
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
    }),
    Schema.object({
        delay: delay
    })
]).i18n({
    'zh-CN': require('./locales/zh-CN'),
})