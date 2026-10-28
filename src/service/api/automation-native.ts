/**
 * 自动化页面的数据入口：名字和以前一样，背后是新引擎。
 *
 * 这四个页面（场景管理 / 场景编辑 / 场景联动 / 联动编辑）以前直接调旧控制台的
 * `/scene`、`/scene_automations`。本次改版把场景和联动收进了自动化引擎，旧地址
 * 不再存在，所以页面的调用改到这里。
 *
 * 为什么保留旧函数名和旧的 `{ data, error }` 返回形状：页面里有两千多行交互
 * 逻辑（表单校验、回显、按钮状态）围着这个形状写的。换形状意味着四个页面都要
 * 重写一遍，而重写期间没有任何东西是经过验证的。把翻译收敛在这一层，页面只改
 * 一行 import，行为是可控的。
 *
 * 真正的翻译在 `automation-legacy-mapping.ts`，这里只负责发请求和兜错。
 */

import {
  AutomationApiError,
  createRule,
  deleteRule,
  getRule,
  listRules,
  listRuns,
  runRule,
  setRuleEnabled,
  updateRule
} from './automation-rules'
import type { Rule } from './automation-rules'
import {
  definitionToLinkageForm,
  definitionToSceneForm,
  linkageFormToDefinition,
  sceneFormToDefinition
} from './automation-legacy-mapping'
import type { LinkageForm, MappingIssue, SceneForm } from './automation-legacy-mapping'

// 设备/设备配置的下拉数据仍然由设备模块提供，不在这里重写。
export {
  configMetricsConditionMenu,
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsConditionMenu,
  deviceMetricsMenu
} from './automation'

/**
 * 与 `@sa/axios` 的 flat request 相同的返回形状。
 *
 * `data` 故意是 `any`：这一层的调用方是四个几千行的老页面，它们把返回值直接
 * 塞进 `ref([])` 再逐字段渲染，本来就没有类型。在这里标成 `T | null` 只会让
 * 每个页面多出一堆断言，换不来任何保护。翻译本身的类型在 mapping 模块里。
 */
export interface FlatResult<T = any> {
  data: T | null
  error: Error | null
  response: null
}

function ok<T>(data: T): FlatResult {
  return { data, error: null, response: null }
}

function failed<T = any>(error: unknown): FlatResult {
  const err = error instanceof Error ? error : new Error(String(error))
  // 旧封装会把后端消息直接弹出来，页面本身没有展示错误的位置。这里保持同样
  // 的行为，但把「这条规则哪里填错了」拼进消息里，否则用户只看到「请求失败」。
  const detail = describe(err)
  window.$message?.error(detail)
  return { data: null, error: new Error(detail), response: null }
}

function describe(error: Error): string {
  if (error instanceof AutomationApiError) {
    const fields = error.fields.map(item => item.message).filter(Boolean)
    if (fields.length > 0) return Array.from(new Set(fields)).join('；')
    if (error.message) return error.message
  }
  return error.message || '请求失败'
}

function issuesToError(issues: MappingIssue[]): Error {
  return new Error(Array.from(new Set(issues.map(item => item.message))).join('；'))
}

/** 旧分页参数 → 新分页参数。 */
function paging(params: { page?: number; page_size?: number }): { limit: number; offset: number } {
  const size = Number(params?.page_size) > 0 ? Number(params.page_size) : 10
  const page = Number(params?.page) > 0 ? Number(params.page) : 1
  return { limit: size, offset: (page - 1) * size }
}

/** 新规则 → 列表行。列表只用到 id / name / description / 时间 / 开关。 */
function toRow(rule: Rule) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.definition?.description ?? '',
    enabled: rule.enabled ? 'Y' : 'N',
    created_at: rule.created_at,
    updated_at: rule.updated_at,
    version: rule.version
  }
}

/**
 * 执行记录：把一次运行折成旧日志表的一行。
 *
 * 旧日志是「什么时候、做了什么、成功还是失败」。新的运行记录更细（每一步、
 * 每台设备都有状态），这里取最能回答那三个问题的部分：起止时间、目标台数、
 * 失败原因。点进规则编辑器还能看到逐步详情。
 */
function toLogRow(run: {
  id: string
  status: string
  reason?: string
  reason_code?: string
  started_at: string
  finished_at?: string
  targets?: { selected: boolean }[]
  steps?: { kind: string; status: string }[]
}) {
  const total = run.targets?.length ?? 0
  const selected = run.targets?.filter(item => item.selected).length ?? 0
  const steps = run.steps ?? []
  const done = steps.filter(step => step.status === 'succeeded' || step.status === 'accepted').length
  const parts = [`${done}/${steps.length} 步完成`]
  if (total > 0) parts.push(`${selected}/${total} 台设备`)
  if (run.reason) parts.push(run.reason)
  return {
    id: run.id,
    executed_at: run.started_at,
    detail: parts.join('，'),
    execution_result: run.status === 'succeeded' || run.status === 'partial' ? 'S' : 'F',
    status: run.status,
    reason_code: run.reason_code
  }
}

function listRunsOf(ruleId: string, query: { page?: number; page_size?: number }) {
  const { limit, offset } = paging(query)
  return listRuns(ruleId, { limit, offset })
}

// ---------------------------------------------------------------------------
// 场景
// ---------------------------------------------------------------------------

/** 场景列表。 */
export async function sceneGet(params: { name?: string; page?: number; page_size?: number }) {
  try {
    const { limit, offset } = paging(params)
    const res = await listRules({ kind: 'scene', name: params?.name || undefined, limit, offset })
    return ok({ list: res.rules.map(toRow), total: res.total })
  } catch (error) {
    return failed<{ list: unknown[]; total: number }>(error)
  }
}

/** 场景详情，回显成旧表单。 */
export async function sceneInfo(id: string) {
  try {
    const rule = await getRule(id)
    const form = definitionToSceneForm(rule.definition, rule.name, rule.id)
    return ok({ info: { id: rule.id, name: rule.name, description: form.description }, actions: form.actions })
  } catch (error) {
    return failed<unknown>(error)
  }
}

/** 新建场景。 */
export async function sceneAdd(form: SceneForm) {
  try {
    const mapped = sceneFormToDefinition(form)
    if (mapped.issues.length > 0) throw issuesToError(mapped.issues)
    const rule = await createRule({ name: form.name ?? '', definition: mapped.value, enabled: true })
    return ok(rule)
  } catch (error) {
    return failed<Rule>(error)
  }
}

/** 修改场景。 */
export async function sceneEdit(form: SceneForm & { id: string }) {
  try {
    const mapped = sceneFormToDefinition(form)
    if (mapped.issues.length > 0) throw issuesToError(mapped.issues)
    const current = await getRule(form.id)
    const rule = await updateRule(form.id, {
      name: form.name ?? '',
      definition: mapped.value,
      version: current.version
    })
    return ok(rule)
  } catch (error) {
    return failed<Rule>(error)
  }
}

/** 删除场景。 */
export async function sceneDel(id: string) {
  try {
    const current = await getRule(id)
    await deleteRule(id, { version: current.version })
    return ok({ deleted: true })
  } catch (error) {
    return failed<{ deleted: boolean }>(error)
  }
}

/**
 * 「激活」场景 = 手动执行一次。
 *
 * 旧控制台的 `scene/active/:id` 就是这个意思：按一下按钮，动作立刻下发。新模型
 * 里对应手动运行，不是「启用规则」——场景本身没有开关。
 */
export async function sceneActive(id: string) {
  try {
    const run = await runRule(id, {}, `scene-active-${id}-${Date.now()}`)
    return ok(run)
  } catch (error) {
    return failed<unknown>(error)
  }
}

/** 场景执行记录。 */
export async function sceneLog(query: { id: string; page?: number; page_size?: number; execution_result?: string }) {
  try {
    const res = await listRunsOf(query.id, query)
    let rows = res.runs.map(toLogRow)
    if (query?.execution_result) {
      rows = rows.filter(row => row.execution_result === query.execution_result)
    }
    return ok({ list: rows, total: query?.execution_result ? rows.length : res.total })
  } catch (error) {
    return failed<{ list: unknown[]; total: number }>(error)
  }
}

// ---------------------------------------------------------------------------
// 场景联动
// ---------------------------------------------------------------------------

/** 联动列表。device_id / device_config_id 用于「设备详情」「设备模板详情」里的内嵌列表。 */
export async function sceneAutomationsGet(params: {
  name?: string
  page?: number
  page_size?: number
  device_id?: string
  device_config_id?: string
}) {
  try {
    const { limit, offset } = paging(params)
    const res = await listRules({
      kind: 'automation',
      name: params?.name || undefined,
      device_id: params?.device_id || undefined,
      device_config_id: params?.device_config_id || undefined,
      limit,
      offset
    })
    return ok({ list: res.rules.map(toRow), total: res.total })
  } catch (error) {
    return failed<{ list: unknown[]; total: number }>(error)
  }
}

/** 联动详情，回显成旧表单。 */
export async function sceneAutomationsInfo(id: string) {
  try {
    const rule = await getRule(id)
    const form = definitionToLinkageForm(rule.definition, rule.name, rule.enabled, rule.id)
    return ok(form)
  } catch (error) {
    return failed<LinkageForm>(error)
  }
}

/** 新建联动。 */
export async function sceneAutomationsAdd(form: LinkageForm) {
  try {
    const mapped = linkageFormToDefinition(form)
    if (mapped.issues.length > 0) throw issuesToError(mapped.issues)
    const rule = await createRule({
      name: form.name ?? '',
      definition: mapped.value,
      enabled: form.enabled !== 'N'
    })
    return ok(rule)
  } catch (error) {
    return failed<Rule>(error)
  }
}

/** 修改联动。 */
export async function sceneAutomationsEdit(form: LinkageForm & { id: string }) {
  try {
    const mapped = linkageFormToDefinition(form)
    if (mapped.issues.length > 0) throw issuesToError(mapped.issues)
    const current = await getRule(form.id)
    const rule = await updateRule(form.id, {
      name: form.name ?? '',
      definition: mapped.value,
      version: current.version
    })
    // 开关单独一次请求：改定义不等于改开关，混在一起会让「保存」顺手打开一条
    // 用户特意停用的规则。
    if (rule.enabled !== (form.enabled !== 'N')) {
      const toggled = await setRuleEnabled(form.id, form.enabled !== 'N', rule.version)
      return ok(toggled)
    }
    return ok(rule)
  } catch (error) {
    return failed<Rule>(error)
  }
}

/** 删除联动。 */
export async function sceneAutomationsDel(id: string) {
  try {
    const current = await getRule(id)
    await deleteRule(id, { version: current.version })
    return ok({ deleted: true })
  } catch (error) {
    return failed<{ deleted: boolean }>(error)
  }
}

/**
 * 联动开关。
 *
 * 旧接口 `switch/:id` 是「取反」，所以这里也要先读当前状态。不用前端传的值：
 * 页面上的 switch 可能因为上一次失败而没有回滚，按前端的值写会把「看起来关了
 * 其实开着」固化成真。
 */
export async function sceneAutomationsSwitch(id: string) {
  try {
    const current = await getRule(id)
    const rule = await setRuleEnabled(id, !current.enabled, current.version)
    return ok(rule)
  } catch (error) {
    return failed<Rule>(error)
  }
}

/** 联动执行记录。 */
export async function sceneAutomationsLog(query: {
  scene_automation_id: string
  page?: number
  page_size?: number
  execution_result?: string
}) {
  try {
    const res = await listRunsOf(query.scene_automation_id, query)
    let rows = res.runs.map(toLogRow)
    if (query?.execution_result) {
      rows = rows.filter(row => row.execution_result === query.execution_result)
    }
    return ok({ list: rows, total: query?.execution_result ? rows.length : res.total })
  } catch (error) {
    return failed<{ list: unknown[]; total: number }>(error)
  }
}

// ---------------------------------------------------------------------------
// 给「动作/告警」下拉用的新数据源
// ---------------------------------------------------------------------------

/**
 * 动作里「触发告警」要选的告警列表。
 *
 * 以前来自旧告警配置接口。新模型里告警策略本身就是一种规则，所以列表从这里来，
 * 动作里存的 action_target 也就是策略 id，不需要再做一次 id 映射。
 */
export async function alarmPolicyOptions(params: { name?: string } = {}) {
  try {
    const res = await listRules({ kind: 'alarm_policy', name: params.name || undefined, limit: 200, offset: 0 })
    return ok(
      res.rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.definition?.description ?? '',
        enabled: rule.enabled ? 'Y' : 'N'
      }))
    )
  } catch (error) {
    return failed<unknown[]>(error)
  }
}

/** 场景下拉：动作里「激活场景」要选的场景列表。 */
export async function sceneOptions(params: { name?: string } = {}) {
  try {
    const res = await listRules({ kind: 'scene', name: params.name || undefined, limit: 200, offset: 0 })
    return ok(res.rules.map(toRow))
  } catch (error) {
    return failed<unknown[]>(error)
  }
}

export type { LinkageForm, MappingIssue, SceneForm }
