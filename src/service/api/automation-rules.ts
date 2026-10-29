/**
 * Typed client for the automation engine (`/v1/*`).
 *
 * This service answers with plain JSON, not with the `{code, data}` envelope the
 * tenant backend uses, so it cannot go through `@/service/request`. Sharing that
 * wrapper would mean teaching it two response shapes, and every caller would
 * then have to know which one it got.
 *
 * Two rules the callers depend on:
 *
 * 1. An error keeps the server's own `code` and `fields`. The rule form needs
 *    `fields` to put a message under the right input instead of showing one
 *    banner for a five-field rejection.
 * 2. A failed write whose fate is unknown is not reported as a failure. If the
 *    connection drops after the request left the browser, the rule may well
 *    exist; saying "save failed" invites the user to create a second one.
 */

import axios, { type AxiosInstance } from 'axios'
import { localStg } from '@/utils/storage'
import { getAutomationMode } from './automation-runtime'

export interface AutomationFieldError {
  field: string
  code: string
  message: string
}

export interface AutomationErrorDetail {
  code?: string
  field?: string
  fields?: AutomationFieldError[]
  rule_id?: string
  import_id?: string
  status?: string
  reason_code?: string
  referencing_rule_ids?: string[]
}

export class AutomationApiError extends Error {
  readonly httpStatus: number | null

  readonly code: string | undefined

  readonly fields: AutomationFieldError[]

  readonly detail: AutomationErrorDetail

  /** True when a write may have been applied even though we saw no answer. */
  readonly outcomeUnknown: boolean

  constructor(message: string, httpStatus: number | null, detail: AutomationErrorDetail, outcomeUnknown = false) {
    super(message)
    this.name = 'AutomationApiError'
    this.httpStatus = httpStatus
    this.detail = detail
    this.code = detail.code
    this.fields = detail.fields ?? []
    this.outcomeUnknown = outcomeUnknown
  }

  /** Field errors keyed by the form path the server used. */
  fieldMap(): Record<string, string> {
    const map: Record<string, string> = {}
    this.fields.forEach(item => {
      if (item.field && !map[item.field]) map[item.field] = item.message
    })
    if (this.detail.field && !map[this.detail.field]) {
      map[this.detail.field] = this.message
    }
    return map
  }
}

function baseUrl(): string {
  const configured = import.meta.env.VITE_AUTOMATION_API_BASE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  // Same origin. The development proxy and the production reverse proxy both
  // mount the engine here, so there is no second host to configure.
  return '/automation-core'
}

let transport: AxiosInstance | null = null

function http(): AxiosInstance {
  if (!transport) {
    transport = axios.create({ baseURL: baseUrl(), timeout: 20000 })
  }
  return transport
}

type Query = Record<string, string | number | boolean | undefined>

interface CallOptions {
  query?: Query
  body?: unknown
  /** Writes carry a derived key so a retry is the same intent. */
  idempotencyKey?: string
}

function readDetail(payload: unknown): AutomationErrorDetail {
  if (!payload || typeof payload !== 'object') return {}
  const body = payload as { details?: unknown; code?: unknown; message?: unknown }
  const detail = (body.details && typeof body.details === 'object' ? body.details : {}) as AutomationErrorDetail
  if (!detail.code && typeof body.code === 'string') detail.code = body.code
  return detail
}

function readMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

async function call<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, options: CallOptions = {}) {
  if ((await getAutomationMode()) !== 'native') {
    throw new AutomationApiError('当前使用原有自动化引擎，请从场景或联动页面操作', null, {
      code: 'native_engine_disabled'
    })
  }
  const headers: Record<string, string> = {}
  const token = localStg.get('token')
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.idempotencyKey) {
    // The header is for proxies and logs. The body copy below is what the
    // service actually reads, because a typed handler cannot see headers.
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  let body = options.body
  if (options.idempotencyKey && body && typeof body === 'object' && !Array.isArray(body)) {
    body = { ...(body as Record<string, unknown>), request_id: options.idempotencyKey }
  }

  const mutating = method !== 'get'
  try {
    const response = await http().request<T>({
      method,
      url: path,
      params: options.query,
      data: body,
      headers
    })
    return response.data
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw new AutomationApiError(String((error as Error)?.message ?? '请求失败'), null, {})
    }
    const status = error.response?.status ?? null
    const detail = readDetail(error.response?.data)
    // No response at all: the request may or may not have been applied.
    const unknown = mutating && !error.response
    throw new AutomationApiError(
      readMessage(error.response?.data, unknown ? '网络中断，结果未知' : '请求失败'),
      status,
      detail,
      unknown
    )
  }
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type RuleKind = 'automation' | 'scene' | 'alarm_policy' | 'schedule'
export type RunMode = 'single' | 'restart' | 'queued' | 'parallel'
export type SignalKind = 'telemetry' | 'attribute' | 'event' | 'status'

export interface Condition {
  source: 'self' | 'device'
  device_id?: string
  signal: SignalKind
  key: string
  operator: string
  value: string
  unit?: string
}

export interface ConditionGroup {
  id?: string
  conditions: Condition[]
}

export interface Trigger {
  groups: ConditionGroup[]
  for: string
}

export interface Step {
  kind: 'action' | 'wait' | 'alarm' | 'notify' | 'branch' | 'activate_scene'
  device_ref?: string
  action?: string
  identifier?: string
  value?: string
  wait?: string
  alarm_policy_id?: string
  notification_policy_id?: string
  continue_on_failure?: boolean
  then?: Step[]
  else?: Step[]
  condition?: ConditionGroup
  guard?: ConditionGroup
}

export interface TargetSpec {
  device_ids?: string[]
  device_config_ids?: string[]
  area_ids?: string[]
  include_sub_areas?: boolean
  labels?: string[]
  label_match?: 'and' | 'or'
  device_types?: string[]
  max_targets?: number
}

export interface Freshness {
  max_age: string
  max_gap: string
  mode?: 'periodic' | 'on_change'
  heartbeat?: string
  no_data?: string
}

export interface RuleParam {
  key: string
  type: 'number' | 'string' | 'bool'
  default: string
  min?: number
  max?: number
  label?: string
}

export interface RuleDefinition {
  kind: RuleKind
  mode: RunMode
  scope: 'device' | 'rule'
  /** 旧控制台里写在场景/联动旁边的说明，新模型原样保留。 */
  description?: string
  trigger: Trigger
  recovery?: Trigger
  freshness: Freshness
  targets: TargetSpec
  steps: Step[]
  queue?: { ttl?: string; max_depth?: number }
  parallel?: { max_concurrency?: number; ttl?: string }
  budget?: { max_steps?: number; max_duration?: string }
  params?: RuleParam[]
  /** Present only on kind=alarm_policy; the form carries it through untouched. */
  alarm?: {
    key?: string
    sources: string[]
    allowed_sources?: string[]
    level?: string
    notify_use_default?: boolean
    notify_alias_id?: string
  }
}

export interface Rule {
  id: string
  tenant_id: string
  name: string
  kind: RuleKind
  enabled: boolean
  revision: number
  version: number
  definition_hash: string
  legacy_id?: string
  definition: RuleDefinition
  created_at: string
  updated_at: string
}

export interface ListRulesResponse {
  rules: Rule[]
  total: number
  limit: number
  offset: number
}

export interface RunStep {
  id: string
  idx: number
  kind: string
  status: string
  idempotency_key: string
  attempt: number
  detail?: string
}

export interface RunTarget {
  device_id: string
  selected: boolean
  status: string
  reason_code?: string
  reason?: string
}

export interface RunOutbox {
  id: string
  kind: string
  status: string
  proof?: string
  detail?: string
}

export interface Run {
  id: string
  rule_id: string
  revision: number
  definition_hash: string
  scope_key: string
  generation: number
  device_id?: string
  status: string
  reason_code?: string
  reason?: string
  started_at: string
  finished_at?: string
  deadline?: string
  steps: RunStep[]
  targets: RunTarget[]
  outbox: RunOutbox[]
}

export interface ListRunsResponse {
  runs: Run[]
  total: number
  limit: number
  offset: number
}

export interface SimStep {
  idx: number
  kind: string
  decision: string
  detail?: string
}

export interface SimAction {
  step_idx: number
  device_id: string
  action: string
  identifier: string
  value: string
}

export interface SimulateResponse {
  rule_id: string
  revision: number
  definition_hash: string
  steps: SimStep[]
  actions?: SimAction[]
  would_run: number
  side_effects: number
  ends_at?: string
  notes: string[]
}

export interface PreviewDevice {
  device_id: string
  source: string
  overridden?: string[]
}

export interface ChangePreviewResponse {
  rule_id: string
  revision: number
  definition_hash: string
  devices: PreviewDevice[]
  device_count: number
  issues?: { field: string; code: string; message: string }[]
  expires_at: string
  token: string
}

export interface ValidationResponse {
  valid: boolean
  normalized?: RuleDefinition
  issues?: { field: string; code: string; message: string }[]
}

export interface ExplainResponse {
  rule_id: string
  device_id: string
  from: string
  to: string
  verdict: string
  reasons: { code: string; message: string }[]
  runs: Run[]
  evidence: { complete: boolean; notes?: string[] }
}

export interface EffectiveRule {
  rule_id: string
  rule_name: string
  kind: string
  enabled: boolean
  source: 'template' | 'device' | 'condition'
  binding_id?: string
  params?: Record<string, string>
  effective_params?: Record<string, string>
  overridden?: string[]
}

export interface DeviceAutomation {
  device_id: string
  device_config_id?: string
  rules: EffectiveRule[]
  issues?: { field: string; code: string; message: string }[]
}

export interface Binding {
  id: string
  rule_id: string
  device_id?: string
  device_config_id?: string
  params?: Record<string, string>
  detached_at?: string
}

export interface TemplateBindings {
  device_config_id: string
  attached: number
  detached: number
  device_count: number
  bindings: Binding[]
  issues?: { field: string; code: string; message: string }[]
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export function listRules(query: Query) {
  return call<ListRulesResponse>('get', '/v1/rules', { query })
}

export function getRule(id: string) {
  return call<Rule>('get', `/v1/rules/${encodeURIComponent(id)}`)
}

export function validateRule(definition: RuleDefinition) {
  return call<ValidationResponse>('post', '/v1/rule-validation', { body: { definition } })
}

export function previewRuleChange(id: string, definition: RuleDefinition) {
  return call<ChangePreviewResponse>('post', `/v1/rules/${encodeURIComponent(id)}/change-preview`, {
    body: { definition }
  })
}

export function createRule(input: { name: string; definition: RuleDefinition; enabled: boolean }, idem?: string) {
  return call<Rule>('post', '/v1/rules', { body: input, idempotencyKey: idem })
}

export function updateRule(
  id: string,
  input: { name: string; definition: RuleDefinition; version: number; previewToken?: string; force?: boolean },
  idem?: string
) {
  return call<Rule>('put', `/v1/rules/${encodeURIComponent(id)}`, { body: input, idempotencyKey: idem })
}

export function setRuleEnabled(id: string, enabled: boolean, version: number, idem?: string) {
  return call<Rule>('post', `/v1/rules/${encodeURIComponent(id)}/enabled`, {
    body: { enabled, version },
    idempotencyKey: idem
  })
}

export function deleteRule(id: string, input: { version: number; force?: boolean } = { version: 0 }, idem?: string) {
  return call<{ deleted: boolean }>('delete', `/v1/rules/${encodeURIComponent(id)}`, {
    body: input,
    idempotencyKey: idem
  })
}

export function simulateRule(id: string, input: { device_id?: string; samples?: unknown[] } = {}) {
  return call<SimulateResponse>('post', `/v1/rules/${encodeURIComponent(id)}/simulate`, { body: input })
}

export function explainRule(id: string, query: { device_id?: string; from?: string; to?: string }) {
  return call<ExplainResponse>('get', `/v1/rules/${encodeURIComponent(id)}/explain`, { query })
}

export function runRule(id: string, input: { device_id?: string } = {}, idem?: string) {
  return call<Run>('post', `/v1/rules/${encodeURIComponent(id)}/run`, { body: input, idempotencyKey: idem })
}

export function listRuns(id: string, query: Query) {
  return call<ListRunsResponse>('get', `/v1/rules/${encodeURIComponent(id)}/runs`, { query })
}

export function getRun(runId: string) {
  return call<Run>('get', `/v1/runs/${encodeURIComponent(runId)}`)
}

// ---------------------------------------------------------------------------
// Alarms
// ---------------------------------------------------------------------------

/** 一条告警。state 是生命周期状态（active / acked / cleared），level 是等级。 */
export interface Alarm {
  id: string
  policy_id: string
  policy_key: string
  subject_id: string
  dimension?: string
  state: string
  level?: string
  source?: string
  revision: number
  epoch: number
  opened_at: string
  first_seq: number
  last_seq: number
  sample_count: number
  last_evidence?: string
  acked_at?: string
  acked_by?: string
  cleared_at?: string
}

export interface ListAlarmsResponse {
  alarms: Alarm[]
}

export function listAlarms(query: { policy_id?: string; subject_id?: string; state?: string; limit?: number }) {
  return call<ListAlarmsResponse>('get', '/v1/alarms', { query })
}

export function getAlarm(id: string) {
  return call<Alarm>('get', `/v1/alarms/${encodeURIComponent(id)}`)
}

export function ackAlarm(id: string, input: { actor?: string } = {}, idem?: string) {
  return call<{ acknowledged: boolean }>('post', `/v1/alarms/${encodeURIComponent(id)}/ack`, {
    body: input,
    idempotencyKey: idem
  })
}

// ---------------------------------------------------------------------------
// Contexts (device / template)
// ---------------------------------------------------------------------------

export function getDeviceAutomation(deviceId: string) {
  return call<DeviceAutomation>('get', `/v1/device-automation/${encodeURIComponent(deviceId)}`)
}

export function getTemplateBindings(deviceConfigId: string) {
  return call<TemplateBindings>('get', `/v1/device-configs/${encodeURIComponent(deviceConfigId)}/bindings`)
}
