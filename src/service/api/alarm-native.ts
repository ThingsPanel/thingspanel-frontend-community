/**
 * 告警页面的数据入口。
 *
 * 「告警配置」在新模型里就是一类规则（kind=alarm_policy），所以它和场景、联动
 * 走同一个引擎，只是长得不一样：没有触发条件（旧告警配置本来就没有），靠
 * 「事件」这条通道被场景/联动里「触发告警」的动作拉起来。
 *
 * 两处必须说清楚的差异，写在下面的代码里：
 *
 * 1. 旧表单的「触发重复次数」「触发持续时间」在新模型里没有对应字段。旧引擎靠
 *    它们做去抖，新引擎的去抖是规则级的（同一条事件只算一次）。留着输入框但
 *    不生效，比没有这个输入框更糟，所以页面把这两项收起来了。
 * 2. 旧的「维护备注」是往告警行上写一段文字，新模型的告警事件是事实记录，
 *    不可改写。页面上的「维护」因此变成「确认处理」，对应新模型的确认动作。
 */

import {
  AutomationApiError,
  createRule,
  deleteRule,
  getRule,
  listAlarms,
  listRules,
  ackAlarm,
  setRuleEnabled,
  updateRule
} from './automation-rules'
import type { RuleDefinition } from './automation-rules'
import { getNotificationGroupList } from './notification'

export interface FlatResult<T = any> {
  data: T | null
  error: Error | null
  response: null
}

function ok<T>(data: T): FlatResult {
  return { data, error: null, response: null }
}

function describe(error: unknown): string {
  if (error instanceof AutomationApiError) {
    const fields = error.fields.map(item => item.message).filter(Boolean)
    if (fields.length > 0) return Array.from(new Set(fields)).join('；')
    if (error.message) return error.message
  }
  return error instanceof Error ? error.message : String(error)
}

function failed<T = any>(error: unknown): FlatResult {
  const detail = describe(error)
  window.$message?.error(detail)
  return { data: null, error: new Error(detail), response: null }
}

/** 新建策略时用的业务键。旧模型没有这个概念，这里给一个稳定且唯一的值。 */
function newPolicyKey(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `alarm-${Date.now().toString(36)}-${rand}`
}

/**
 * 旧告警配置表单 → 告警策略定义。
 *
 * `allowed_sources` 固定写 `automation`：场景/联动里的「触发告警」动作就是以这个
 * 身份提交的。不写它，策略建出来是「谁都不能拉起」的状态，而页面上看不出来。
 */
function buildPolicyDefinition(input: {
  name: string
  description?: string
  alarm_level: string
  notification_group_id?: string
  key?: string
}): RuleDefinition {
  const definition: RuleDefinition = {
    kind: 'alarm_policy',
    mode: 'single',
    scope: 'device',
    trigger: { groups: [], for: '0s' },
    freshness: { max_age: '10m', max_gap: '10m' },
    targets: {},
    steps: [],
    alarm: {
      key: input.key || newPolicyKey(),
      sources: ['event'],
      allowed_sources: ['automation'],
      level: input.alarm_level || 'L',
      notify_use_default: !input.notification_group_id,
      notify_alias_id: input.notification_group_id || undefined
    }
  }
  if (input.description) definition.description = input.description
  return definition
}

function toPolicyRow(
  rule: {
    id: string
    name: string
    enabled: boolean
    definition: RuleDefinition
    version: number
  },
  groupNames: Record<string, string>
) {
  const notify = (rule.definition.steps ?? []).find(step => step.kind === 'notify')
  const groupId = rule.definition.alarm?.notify_alias_id ?? notify?.notification_policy_id ?? ''
  return {
    id: rule.id,
    name: rule.name,
    description: rule.definition.description ?? '',
    alarm_level: rule.definition.alarm?.level ?? '',
    notification_group_id: groupId,
    notification_group_name: groupNames[groupId] ?? '',
    enabled: rule.enabled ? 'Y' : 'N',
    version: rule.version
  }
}

/** 通知组 id → 名称。通知组属于通知模块，这里只做一次只读查询用于展示。 */
async function notificationGroupNames(): Promise<Record<string, string>> {
  try {
    const res = await getNotificationGroupList({ page: 1, page_size: 200 })
    const list = res?.data?.list ?? []
    const map: Record<string, string> = {}
    list.forEach((item: any) => {
      if (item?.id) map[item.id] = item.name ?? item.id
    })
    return map
  } catch {
    // 拿不到名字不是错误：表格里退化成显示空，而不是整页报错。
    return {}
  }
}

/** 告警配置列表。 */
export async function warningMessageList(params: { page?: number; page_size?: number }): Promise<FlatResult> {
  try {
    const size = Number(params?.page_size) > 0 ? Number(params.page_size) : 10
    const page = Number(params?.page) > 0 ? Number(params.page) : 1
    const [res, groupNames] = await Promise.all([
      listRules({ kind: 'alarm_policy', limit: size, offset: (page - 1) * size }),
      notificationGroupNames()
    ])
    return ok({ list: res.rules.map(rule => toPolicyRow(rule, groupNames)), total: res.total })
  } catch (error) {
    return failed(error)
  }
}

/** 新建告警配置。 */
export async function addWarningMessage(data: {
  name: string
  description?: string
  alarm_level: string
  notification_group_id?: string
}): Promise<FlatResult> {
  try {
    const definition = buildPolicyDefinition(data)
    const rule = await createRule({ name: data.name, definition, enabled: true })
    return ok(rule)
  } catch (error) {
    return failed(error)
  }
}

/**
 * 告警配置的修改。
 *
 * 页面有两种调用：`{ID, enabled}` 是列表上的启停，其余是编辑弹窗的保存。启停只
 * 改开关，不去碰定义——否则「停用」会顺手把用户刚改还没保存的内容写进去。
 */
export async function editInfo(data: {
  id?: string
  ID?: string
  enabled?: string
  name?: string
  description?: string
  alarm_level?: string
  notification_group_id?: string
}): Promise<FlatResult> {
  try {
    const id = String(data?.id || data?.ID || '')
    if (!id) throw new Error('缺少告警配置 id')
    const current = await getRule(id)

    const toggleOnly = !!data.enabled && !data.name
    if (toggleOnly) {
      const rule = await setRuleEnabled(id, data.enabled === 'Y', current.version)
      return ok(rule)
    }

    const definition = buildPolicyDefinition({
      name: data.name ?? current.name,
      description: data.description,
      alarm_level: data.alarm_level ?? current.definition.alarm?.level ?? 'L',
      notification_group_id: data.notification_group_id,
      // 业务键必须沿用，否则同一条告警会被当成新的一条。
      key: current.definition.alarm?.key
    })
    // 保存定义时不动开关：编辑弹窗里的 enabled 是页面写死的 'Y'，照它写会把
    // 用户特意停用的告警配置重新打开。开关只有列表上的启停会改。
    return ok(
      await updateRule(id, {
        name: data.name ?? current.name,
        definition,
        version: current.version
      })
    )
  } catch (error) {
    return failed(error)
  }
}

/** 删除告警配置。 */
export async function delInfo(id: string): Promise<FlatResult> {
  try {
    const current = await getRule(id)
    await deleteRule(id, { version: current.version })
    return ok({ deleted: true })
  } catch (error) {
    return failed(error)
  }
}

/**
 * 告警信息列表。
 *
 * 新模型把「一条告警」和「它属于哪个策略」分开存，所以名字要按 policy_id 回查一次。
 * 时间、等级、来源都直接来自告警本身，不再拼旧表的字段。
 */
export async function alarmHistory(query: {
  page?: number
  page_size?: number
  alarm_status?: string
  start_time?: string
  end_time?: string
}): Promise<FlatResult> {
  try {
    const size = Number(query?.page_size) > 0 ? Number(query.page_size) : 10
    const page = Number(query?.page) > 0 ? Number(query.page) : 1
    // 新接口一次最多返回 limit 条且不支持 offset；先按「够用一页」取，再在下面
    // 按时间/等级过滤。数量级上告警不会一次几千条，这里不引入第二套分页协议。
    const res = await listAlarms({ limit: Math.max(size * page, size) })
    const policies = await listRules({ kind: 'alarm_policy', limit: 200, offset: 0 })
    const names: Record<string, string> = {}
    const descriptions: Record<string, string> = {}
    policies.rules.forEach(rule => {
      names[rule.id] = rule.name
      descriptions[rule.id] = rule.definition.description ?? ''
    })

    let rows = res.alarms.map(alarm => ({
      id: alarm.id,
      create_at: alarm.opened_at,
      name: names[alarm.policy_id] ?? alarm.policy_key,
      alarm_status: alarm.level ?? '',
      state: alarm.state,
      // 新模型的告警只带 subject_id（触发对象）和 state，不再有旧的 content 文本。
      // 直接把它拼成「原因」会让客户看到一串 UUID，所以优先用证据/维度，
      // 两者都没有时明确写成「对象」，至少读得懂这是什么。
      content: alarm.last_evidence || alarm.dimension || `对象 ${alarm.subject_id ?? ''}`.trim(),
      description: descriptions[alarm.policy_id] || alarm.last_evidence || '',
      // 详情里的设备表要能列出来，subject_id 就是触发告警的那台设备。
      alarm_device_list: alarm.subject_id ? [{ id: alarm.subject_id, name: '' }] : [],
      acked_at: alarm.acked_at ?? null,
      acked_by: alarm.acked_by ?? ''
    }))

    if (query?.alarm_status) rows = rows.filter(row => row.alarm_status === query.alarm_status)
    if (query?.start_time) {
      const startTime = Date.parse(query.start_time)
      rows = rows.filter(row => Date.parse(row.create_at) >= startTime)
    }
    if (query?.end_time) {
      const endTime = Date.parse(query.end_time)
      rows = rows.filter(row => Date.parse(row.create_at) <= endTime)
    }

    const total = rows.length
    const start = (page - 1) * size
    return ok({ list: rows.slice(start, start + size), total })
  } catch (error) {
    return failed(error)
  }
}

/** 告警信息列表（旧名字，页面用的就是这个）。 */
export const infoList = alarmHistory

/** 确认处理一条告警。 */
export async function processingOperation(params: { id: string; actor?: string }): Promise<FlatResult> {
  try {
    const res = await ackAlarm(params.id, { actor: params.actor ?? '' })
    return ok(res)
  } catch (error) {
    return failed(error)
  }
}
