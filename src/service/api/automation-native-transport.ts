export interface AutomationIssue {
  field: string
  code: string
  message: string
}

export interface AutomationParam {
  key: string
  type: 'string' | 'number' | 'duration' | 'bool'
  default: string
  min?: number
  max?: number
  description?: string
  unit?: string
}

export interface AutomationRule {
  id: string
  tenant_id: string
  name: string
  kind: string
  enabled: boolean
  revision: number
  version: number
  definition_hash: string
  definition: {
    kind: string
    params?: AutomationParam[]
    alarm?: { level?: 'H' | 'M' | 'L'; [key: string]: unknown }
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

export interface EffectiveAutomationRule {
  rule_id: string
  rule_name: string
  kind: string
  enabled: boolean
  source: 'template' | 'device' | 'condition' | string
  binding_id?: string
  params?: Record<string, string>
  effective_params?: Record<string, string>
  overridden?: string[]
}

export interface DeviceAutomationResponse {
  device_id: string
  device_config_id?: string
  rules: EffectiveAutomationRule[]
  issues?: AutomationIssue[]
}

export interface AutomationBinding {
  id: string
  rule_id: string
  kind?: 'automation' | 'alarm_policy' | 'scene' | string
  rule_name?: string
  source: string
  device_id?: string
  device_config_id?: string
  revision: number
  params?: Record<string, string>
  enabled: boolean
  detached_at?: string | null
  created_at: string
  effective_params?: Record<string, string>
  issues?: AutomationIssue[]
}

export interface TemplateBindingsResponse {
  device_config_id: string
  attached: number
  detached: number
  device_count: number
  bindings: AutomationBinding[]
  issues?: AutomationIssue[]
}

export interface RulesResponse {
  rules: AutomationRule[]
  total: number
}

export interface AutomationAlarm {
  id: string
  policy_id: string
  policy_key: string
  subject_id: string
  dimension?: string
  state: 'active' | 'cleared' | string
  level?: 'H' | 'M' | 'L' | string
  source?: string
  revision: number
  epoch: number
  opened_at: string
  first_seq: number
  last_seq: number
  sample_count: number
  last_evidence?: string
  acked_at?: string | null
  acked_by?: string
  cleared_at?: string | null
}

export interface AlarmsResponse {
  alarms: AutomationAlarm[]
  total: number
  limit: number
  offset: number
}

export interface AckAlarmResponse {
  acknowledged: boolean
}

export interface AutomationAttachRequest {
  scope_type: 'device' | 'device_config'
  scope_id: string
  params: Record<string, string>
  request_id: string
}

export interface AutomationBindingResponse extends AutomationBinding {}

export interface AutomationNativeErrorBody {
  code?: string
  message?: string
  error?: string
  details?: { code?: string; fields?: AutomationIssue[]; [key: string]: unknown }
  fields?: AutomationIssue[]
  field_issues?: AutomationIssue[]
  [key: string]: unknown
}

export interface AutomationRulesQuery {
  kind?: string
  device_id?: string
  device_config_id?: string
  name?: string
  enabled?: string
  has_alarm_step?: boolean
  limit?: number
  offset?: number
}

export interface AutomationNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export interface AutomationNativeRequester {
  request<T>(path: string, validate: (value: unknown) => value is T, init?: RequestInit, write?: boolean): Promise<T>
}

export class AutomationNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: AutomationNativeErrorBody,
    readonly outcomeUnknown = false
  ) {
    super(body?.message || body?.error || `Automation service request failed (${status})`)
    this.name = 'AutomationNativeError'
  }

  get code(): string | undefined {
    return this.body?.details?.code || this.body?.code
  }

  get fieldIssues(): AutomationIssue[] {
    const issues = this.body?.details?.fields ?? this.body?.field_issues ?? this.body?.fields
    return Array.isArray(issues)
      ? issues.filter(
          (issue): issue is AutomationIssue =>
            Boolean(issue) &&
            typeof issue.field === 'string' &&
            typeof issue.code === 'string' &&
            typeof issue.message === 'string'
        )
      : []
  }
}

export interface AutomationNativeClient {
  deviceAutomation(id: string): Promise<DeviceAutomationResponse>
  templateBindings(id: string): Promise<TemplateBindingsResponse>
  rules(query: AutomationRulesQuery): Promise<RulesResponse>
  alarms(subjectId: string, state?: 'active' | 'cleared', limit?: number, offset?: number): Promise<AlarmsResponse>
  alarm(id: string): Promise<AutomationAlarm>
  ack(id: string, requestId: string): Promise<AckAlarmResponse>
  attach(ruleId: string, body: AutomationAttachRequest): Promise<AutomationBindingResponse>
  detach(bindingId: string, requestId: string): Promise<AutomationBindingResponse>
}

export function createAutomationRequestId(): string {
  const crypto = globalThis.crypto
  if (!crypto?.getRandomValues) throw new Error('Secure random number generation is unavailable')
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isIssue(value: unknown): value is AutomationIssue {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  )
}

function isRule(value: unknown): value is AutomationRule {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.kind === 'string' &&
    typeof value.enabled === 'boolean' &&
    isRecord(value.definition) &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

function isBinding(value: unknown): value is AutomationBinding {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.rule_id === 'string' &&
    (value.kind === undefined || typeof value.kind === 'string') &&
    typeof value.source === 'string' &&
    typeof value.enabled === 'boolean' &&
    typeof value.created_at === 'string'
  )
}

function validIssues(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isIssue))
}

function isDeviceAutomation(value: unknown): value is DeviceAutomationResponse {
  return (
    isRecord(value) &&
    typeof value.device_id === 'string' &&
    Array.isArray(value.rules) &&
    value.rules.every(
      row =>
        isRecord(row) &&
        typeof row.rule_id === 'string' &&
        typeof row.rule_name === 'string' &&
        typeof row.kind === 'string' &&
        typeof row.enabled === 'boolean' &&
        typeof row.source === 'string'
    ) &&
    validIssues(value.issues)
  )
}

function isTemplateBindings(value: unknown): value is TemplateBindingsResponse {
  return (
    isRecord(value) &&
    typeof value.device_config_id === 'string' &&
    typeof value.attached === 'number' &&
    typeof value.detached === 'number' &&
    typeof value.device_count === 'number' &&
    (value.bindings === null || Array.isArray(value.bindings)) &&
    (value.bindings === null || value.bindings.every(isBinding)) &&
    validIssues(value.issues)
  )
}

function isRules(value: unknown): value is RulesResponse {
  return isRecord(value) && Array.isArray(value.rules) && value.rules.every(isRule) && typeof value.total === 'number'
}

function isAlarm(value: unknown): value is AutomationAlarm {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.policy_id === 'string' &&
    typeof value.subject_id === 'string' &&
    typeof value.state === 'string' &&
    typeof value.opened_at === 'string'
  )
}

function isAlarms(value: unknown): value is AlarmsResponse {
  // The released engine returns only { alarms }; total, limit and offset are optional and filled in by
  // normalizeAlarms. When present they must still be sane.
  if (!isRecord(value) || !Array.isArray(value.alarms) || !value.alarms.every(isAlarm)) return false
  const optionalInt = (v: unknown, min: number, max: number) =>
    v === undefined || (Number.isInteger(v) && Number(v) >= min && Number(v) <= max)
  return (
    optionalInt(value.total, 0, Number.MAX_SAFE_INTEGER) &&
    optionalInt(value.limit, 1, 200) &&
    optionalInt(value.offset, 0, Number.MAX_SAFE_INTEGER) &&
    (value.limit === undefined || value.alarms.length <= Number(value.limit))
  )
}

function normalizeAlarms(payload: AlarmsResponse, requestedLimit: number, requestedOffset: number): AlarmsResponse {
  return {
    ...payload,
    total: payload.total ?? requestedOffset + payload.alarms.length,
    limit: payload.limit ?? requestedLimit,
    offset: payload.offset ?? requestedOffset
  }
}

export function mergeAutomationAlarmPages(existing: AutomationAlarm[], incoming: AutomationAlarm[]): AutomationAlarm[] {
  const merged = new Map<string, AutomationAlarm>()
  for (const alarm of existing) merged.set(alarm.id, alarm)
  for (const alarm of incoming) merged.set(alarm.id, alarm)
  return [...merged.values()].sort(
    (left, right) => Date.parse(right.opened_at) - Date.parse(left.opened_at) || right.id.localeCompare(left.id)
  )
}

function isAckResponse(value: unknown): value is AckAlarmResponse {
  return isRecord(value) && typeof value.acknowledged === 'boolean'
}

function isAutomationErrorBody(value: unknown): value is AutomationNativeErrorBody {
  return isRecord(value)
}

function queryString(query: object): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  return params.toString()
}

function requireRequestId(requestId: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestId))
    throw new Error('request_id must contain 8 to 128 allowed characters')
  return requestId
}

export function createAutomationNativeRequester(options: AutomationNativeOptions): AutomationNativeRequester {
  async function request<T>(
    path: string,
    validate: (value: unknown) => value is T,
    init: RequestInit = {},
    write = false
  ): Promise<T> {
    const token = options.getToken()
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body !== undefined) headers.set('Content-Type', 'application/json')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
      headers.set('x-token', token)
    }
    const language = options.getLanguage()
    if (language) headers.set('Accept-Language', language)

    let response: Response
    try {
      response = await options.fetch(path, { ...init, headers, redirect: 'manual' })
    } catch {
      throw new AutomationNativeError(0, { message: '自动化服务连接中断，请读取状态确认结果。' }, write)
    }
    if (!response.ok) {
      let body: AutomationNativeErrorBody | undefined
      try {
        const payload: unknown = await response.json()
        if (isAutomationErrorBody(payload)) body = payload
      } catch {
        // Keep status and outcome classification when the service returned no JSON.
      }
      const unknown =
        write && (response.status === 0 || response.status >= 500 || (response.status >= 300 && response.status < 400))
      throw new AutomationNativeError(response.status, body, unknown)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new AutomationNativeError(response.status, { message: '自动化服务返回了无法解析的成功响应。' }, write)
    }
    if (!validate(payload)) {
      throw new AutomationNativeError(response.status, { message: '自动化服务成功响应与接口字段不匹配。' }, write)
    }
    return payload
  }

  return { request }
}

export function createAutomationNativeClient(options: AutomationNativeOptions): AutomationNativeClient {
  const { request } = createAutomationNativeRequester(options)
  return {
    deviceAutomation(id) {
      return request(`/v1/device-automation/${encodeURIComponent(id)}`, isDeviceAutomation, { method: 'GET' })
    },
    templateBindings(id) {
      return request(`/v1/device-configs/${encodeURIComponent(id)}/bindings`, isTemplateBindings, {
        method: 'GET'
      }).then(value => ({
        ...value,
        bindings: value.bindings ?? []
      }))
    },
    rules(query) {
      const suffix = queryString(query)
      return request(`/v1/rules${suffix ? `?${suffix}` : ''}`, isRules, { method: 'GET' })
    },
    alarms(subjectId, state, limit = 50, offset = 0) {
      const suffix = queryString({ subject_id: subjectId, state, limit, offset })
      return request(`/v1/alarms?${suffix}`, isAlarms, { method: 'GET' }).then(page =>
        normalizeAlarms(page, limit, offset)
      )
    },
    alarm(id) {
      return request(`/v1/alarms/${encodeURIComponent(id)}`, isAlarm, { method: 'GET' })
    },
    ack(id, requestId) {
      return request(
        `/v1/alarms/${encodeURIComponent(id)}/ack`,
        isAckResponse,
        { method: 'POST', body: JSON.stringify({ request_id: requireRequestId(requestId) }) },
        true
      )
    },
    attach(ruleId, body) {
      const checked = { ...body, request_id: requireRequestId(body.request_id) }
      return request(
        `/v1/rules/${encodeURIComponent(ruleId)}/bindings`,
        isBinding,
        { method: 'POST', body: JSON.stringify(checked) },
        true
      )
    },
    detach(bindingId, requestId) {
      const suffix = queryString({ request_id: requireRequestId(requestId) })
      return request(`/v1/bindings/${encodeURIComponent(bindingId)}?${suffix}`, isBinding, { method: 'DELETE' }, true)
    }
  }
}
