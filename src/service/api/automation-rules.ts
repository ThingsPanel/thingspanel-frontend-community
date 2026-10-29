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

import { localStg } from '@/utils/storage'
import {
  AutomationNativeError,
  createAutomationNativeRequester,
  createAutomationRequestId
} from './automation-native-transport'

const requester = createAutomationNativeRequester({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

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

  static fromNative(error: AutomationNativeError): AutomationApiError {
    const body = error.body
    const detail =
      body?.details && typeof body.details === 'object' && !Array.isArray(body.details)
        ? { ...(body.details as AutomationErrorDetail) }
        : {}
    if (!detail.code && body?.code) detail.code = body.code
    const fields = error.fieldIssues
    if (!detail.fields?.length && fields.length) detail.fields = fields
    return new AutomationApiError(error.message, error.status, detail, error.outcomeUnknown)
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

type Query = Record<string, string | number | boolean | undefined>

interface CallOptions {
  query?: Query
  body?: unknown
  /** Validation, preview and simulation compute a result without applying it. */
  readOnly?: boolean
  /** Writes carry a derived key so a retry is the same intent. */
  idempotencyKey?: string
}

function isObjectResponse<T>(value: unknown): value is T {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObjectResponse<Record<string, unknown>>(value)
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string'
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'number' && Number.isFinite(value[key])
}

function isRuleKind(value: unknown): value is RuleKind {
  return value === 'automation' || value === 'scene' || value === 'alarm_policy'
}

function isRule(value: unknown): value is Rule {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'tenant_id') &&
    hasString(value, 'name') &&
    isRuleKind(value.kind) &&
    typeof value.enabled === 'boolean' &&
    hasNumber(value, 'revision') &&
    hasNumber(value, 'version') &&
    hasString(value, 'definition_hash') &&
    isRecord(value.definition) &&
    value.definition.kind === value.kind &&
    hasString(value, 'created_at') &&
    hasString(value, 'updated_at')
  )
}

function isFieldError(value: unknown): value is AutomationFieldError {
  return isRecord(value) && hasString(value, 'field') && hasString(value, 'code') && hasString(value, 'message')
}

function hasOptionalIssues(value: Record<string, unknown>): boolean {
  return value.issues === undefined || (Array.isArray(value.issues) && value.issues.every(isFieldError))
}

function isListRules(value: unknown): value is ListRulesResponse {
  return isRecord(value) && Array.isArray(value.rules) && value.rules.every(isRule) && hasNumber(value, 'total')
}

function isValidation(value: unknown): value is ValidationResponseWire {
  return (
    isRecord(value) &&
    typeof value.valid === 'boolean' &&
    (value.issues === undefined ||
      value.issues === null ||
      (Array.isArray(value.issues) && value.issues.every(isFieldError))) &&
    (value.normalized === undefined || isRecord(value.normalized))
  )
}

function isRunStep(value: unknown): value is RunStep {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasNumber(value, 'idx') &&
    hasString(value, 'kind') &&
    hasString(value, 'status') &&
    hasString(value, 'idempotency_key') &&
    hasNumber(value, 'attempt')
  )
}

function isRunTarget(value: unknown): value is RunTarget {
  return (
    isRecord(value) &&
    hasString(value, 'device_id') &&
    typeof value.selected === 'boolean' &&
    hasString(value, 'status')
  )
}

type RunWire = Omit<Run, 'steps' | 'targets' | 'outbox'> & {
  steps: RunStep[] | null
  targets: RunTarget[] | null
  outbox: RunOutbox[] | null
}

type ListRunsWire = Omit<ListRunsResponse, 'runs'> & { runs: RunWire[] }

function isRunOutbox(value: unknown): value is RunOutbox {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'kind') &&
    hasString(value, 'state') &&
    hasNumber(value, 'attempt') &&
    hasString(value, 'idempotency_key') &&
    (value.accepted_ref === undefined || typeof value.accepted_ref === 'string') &&
    (value.last_error === undefined || typeof value.last_error === 'string')
  )
}

function isNullableArray<T>(value: unknown, validate: (item: unknown) => item is T): value is T[] | null {
  return value === null || (Array.isArray(value) && value.every(validate))
}

function isRun(value: unknown): value is RunWire {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'rule_id') &&
    hasNumber(value, 'revision') &&
    hasString(value, 'definition_hash') &&
    hasString(value, 'scope_key') &&
    hasNumber(value, 'generation') &&
    hasString(value, 'status') &&
    hasString(value, 'started_at') &&
    isNullableArray(value.steps, isRunStep) &&
    isNullableArray(value.targets, isRunTarget) &&
    isNullableArray(value.outbox, isRunOutbox)
  )
}

function isListRuns(value: unknown): value is ListRunsWire {
  return (
    isRecord(value) &&
    Array.isArray(value.runs) &&
    value.runs.every(isRun) &&
    hasNumber(value, 'total') &&
    hasNumber(value, 'limit') &&
    hasNumber(value, 'offset')
  )
}

function normalizeRun(run: RunWire): Run {
  return { ...run, steps: run.steps ?? [], targets: run.targets ?? [], outbox: run.outbox ?? [] }
}

function isPreviewIssue(value: unknown): value is { field: string; code: string; message: string } {
  return isFieldError(value)
}

function hasOptionalArray<T>(
  value: Record<string, unknown>,
  key: string,
  validate: (item: unknown) => item is T
): boolean {
  return value[key] === undefined || (Array.isArray(value[key]) && value[key].every(validate))
}

function isChangePreview(value: unknown): value is ChangePreviewWire {
  if (
    !isRecord(value) ||
    !hasString(value, 'ruleId') ||
    !hasNumber(value, 'baseRevision') ||
    !hasNumber(value, 'baseVersion') ||
    !hasString(value, 'hashBefore') ||
    !hasString(value, 'hashAfter') ||
    typeof value.changed !== 'boolean' ||
    !isRecord(value.scope) ||
    !isRecord(value.runPolicy) ||
    typeof value.requiresConfirmation !== 'boolean' ||
    !hasString(value, 'token') ||
    !hasString(value, 'expiresAt')
  )
    return false
  const scope = value.scope
  const policy = value.runPolicy
  return (
    (scope.deviceIds === undefined ||
      (Array.isArray(scope.deviceIds) && scope.deviceIds.every(item => typeof item === 'string'))) &&
    hasNumber(scope, 'deviceCount') &&
    (scope.templateIds === undefined ||
      (Array.isArray(scope.templateIds) && scope.templateIds.every(item => typeof item === 'string'))) &&
    hasNumber(scope, 'templateDeviceCount') &&
    typeof scope.truncated === 'boolean' &&
    hasString(policy, 'mode') &&
    hasNumber(policy, 'maxSteps') &&
    hasString(policy, 'maxRunDuration') &&
    hasString(policy, 'deadline') &&
    (policy.ttl === undefined || typeof policy.ttl === 'string') &&
    hasOptionalArray(
      value,
      'dependencies',
      item =>
        isRecord(item) &&
        hasString(item, 'kind') &&
        hasString(item, 'id') &&
        typeof item.exists === 'boolean' &&
        (item.name === undefined || typeof item.name === 'string')
    ) &&
    hasOptionalArray(value, 'bindingIssues', isPreviewIssue) &&
    hasOptionalArray(value, 'issues', isPreviewIssue)
  )
}

function normalizeChangePreview(preview: ChangePreviewWire): ChangePreviewResponse {
  return {
    ...preview,
    scope: { ...preview.scope, deviceIds: preview.scope.deviceIds ?? [], templateIds: preview.scope.templateIds ?? [] },
    dependencies: preview.dependencies ?? [],
    bindingIssues: preview.bindingIssues ?? [],
    issues: preview.issues ?? []
  }
}

function isReason(value: unknown): value is ExplainReason {
  return (
    isRecord(value) &&
    hasString(value, 'code') &&
    hasString(value, 'message') &&
    (value.device_id === undefined || typeof value.device_id === 'string') &&
    (value.key === undefined || typeof value.key === 'string') &&
    (value.expected === undefined || typeof value.expected === 'string') &&
    (value.actual === undefined || typeof value.actual === 'string') &&
    (value.age === undefined || typeof value.age === 'string')
  )
}

function isSimStep(value: unknown): value is SimStep {
  return (
    isRecord(value) &&
    hasString(value, 'at') &&
    hasString(value, 'kind') &&
    (value.verdict === undefined || typeof value.verdict === 'string') &&
    (value.detail === undefined || typeof value.detail === 'string') &&
    (value.reasons === undefined ||
      value.reasons === null ||
      (Array.isArray(value.reasons) && value.reasons.every(isReason))) &&
    (value.actions === undefined ||
      value.actions === null ||
      (Array.isArray(value.actions) && value.actions.every(item => typeof item === 'string')))
  )
}

function isSimAction(value: unknown): value is SimAction {
  return (
    isRecord(value) &&
    hasString(value, 'path') &&
    hasString(value, 'kind') &&
    hasString(value, 'detail') &&
    hasString(value, 'outcome')
  )
}

type SimulateWire = Omit<SimulateResponse, 'steps' | 'actions' | 'notes'> & {
  steps: SimStep[] | null
  actions?: SimAction[] | null
  notes: string[] | null
}

function isSimulate(value: unknown): value is SimulateWire {
  return (
    isRecord(value) &&
    hasString(value, 'rule_id') &&
    hasNumber(value, 'revision') &&
    hasString(value, 'definition_hash') &&
    isNullableArray(value.steps, isSimStep) &&
    (value.actions === undefined || isNullableArray(value.actions, isSimAction)) &&
    hasNumber(value, 'would_run') &&
    hasNumber(value, 'side_effects') &&
    isNullableArray(value.notes, (note): note is string => typeof note === 'string') &&
    (value.ends_at === undefined || typeof value.ends_at === 'string')
  )
}

function normalizeSimulate(result: SimulateWire): SimulateResponse {
  return {
    ...result,
    steps: (result.steps ?? []).map(step => ({ ...step, reasons: step.reasons ?? [], actions: step.actions ?? [] })),
    actions: result.actions ?? [],
    notes: result.notes ?? []
  }
}

type ExplainWire = Omit<ExplainResponse, 'reasons' | 'runs'> & {
  reasons: ExplainReason[] | null
  runs: RunWire[] | null
}

function isExplain(value: unknown): value is ExplainWire {
  if (
    !isRecord(value) ||
    !hasString(value, 'rule_id') ||
    !hasString(value, 'device_id') ||
    !hasString(value, 'from') ||
    !hasString(value, 'to') ||
    !hasString(value, 'verdict') ||
    !isNullableArray(value.reasons, isReason) ||
    !isNullableArray(value.runs, isRun) ||
    !isRecord(value.evidence)
  )
    return false
  const evidence = value.evidence
  return (
    hasNumber(evidence, 'runs_in_window') &&
    typeof evidence.state_observed === 'boolean' &&
    typeof evidence.complete === 'boolean' &&
    hasString(evidence, 'note') &&
    (value.pending === undefined ||
      (isRecord(value.pending) &&
        hasString(value.pending, 'scope_key') &&
        hasString(value.pending, 'started_at') &&
        hasString(value.pending, 'deadline') &&
        hasString(value.pending, 'last_evidence_at') &&
        hasString(value.pending, 'require_processed_before') &&
        hasNumber(value.pending, 'defer_count') &&
        hasNumber(value.pending, 'remaining_ms'))) &&
    (value.input === undefined ||
      (isRecord(value.input) &&
        hasString(value.input, 'device_id') &&
        hasString(value.input, 'signal') &&
        hasString(value.input, 'key') &&
        hasString(value.input, 'value') &&
        hasString(value.input, 'quality') &&
        hasString(value.input, 'observed_at') &&
        hasNumber(value.input, 'age_ms')))
  )
}

function normalizeExplain(result: ExplainWire): ExplainResponse {
  return { ...result, reasons: result.reasons ?? [], runs: (result.runs ?? []).map(normalizeRun) }
}

function isEffectiveRule(value: unknown): value is EffectiveRule {
  return (
    isRecord(value) &&
    hasString(value, 'rule_id') &&
    hasString(value, 'rule_name') &&
    hasString(value, 'kind') &&
    typeof value.enabled === 'boolean' &&
    hasString(value, 'source')
  )
}

function isDeviceAutomation(value: unknown): value is DeviceAutomation {
  return (
    isRecord(value) &&
    hasString(value, 'device_id') &&
    Array.isArray(value.rules) &&
    value.rules.every(isEffectiveRule) &&
    hasOptionalIssues(value)
  )
}

function isBinding(value: unknown): value is Binding {
  return isRecord(value) && hasString(value, 'id') && hasString(value, 'rule_id')
}

function isTemplateBindings(value: unknown): value is TemplateBindings {
  return (
    isRecord(value) &&
    hasString(value, 'device_config_id') &&
    hasNumber(value, 'attached') &&
    hasNumber(value, 'detached') &&
    hasNumber(value, 'device_count') &&
    Array.isArray(value.bindings) &&
    value.bindings.every(isBinding) &&
    hasOptionalIssues(value)
  )
}

function isDeleteRuleResponse(value: unknown): value is DeleteRuleResponse {
  return (
    isRecord(value) &&
    hasString(value, 'rule_id') &&
    hasString(value, 'rule_name') &&
    hasNumber(value, 'detached_bindings') &&
    hasNumber(value, 'cleared_pending') &&
    typeof value.forced === 'boolean'
  )
}

function appendQuery(path: string, query: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const encoded = params.toString()
  return encoded ? `${path}${path.includes('?') ? '&' : '?'}${encoded}` : path
}

async function call<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  options: CallOptions = {},
  validate: (value: unknown) => value is T = isObjectResponse<T>
) {
  const mutating = method !== 'get' && !options.readOnly
  const requestId = options.idempotencyKey
  let body = options.body
  if (requestId && body && typeof body === 'object' && !Array.isArray(body)) {
    body = { ...(body as Record<string, unknown>), request_id: requestId }
  }

  let requestPath = appendQuery(path, options.query ?? {})
  if (requestId && method === 'delete') requestPath = appendQuery(requestPath, { request_id: requestId })
  const headers = new Headers()
  if (requestId) headers.set('Idempotency-Key', requestId)
  const init: RequestInit = { method: method.toUpperCase(), headers }
  if (body !== undefined) init.body = JSON.stringify(body)
  try {
    return await requester.request(requestPath, validate, init, mutating)
  } catch (error) {
    if (error instanceof AutomationNativeError) {
      throw AutomationApiError.fromNative(error)
    }
    if (!(error instanceof Error)) {
      throw new AutomationApiError(String((error as Error)?.message ?? '请求失败'), null, {})
    }
    throw new AutomationApiError(error.message || '请求失败', null, {}, mutating)
  }
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type RuleKind = 'automation' | 'scene' | 'alarm_policy'
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
  trigger: Trigger
  recovery?: Trigger
  freshness: Freshness
  targets: TargetSpec
  steps: Step[]
  queue?: { ttl?: string; max_depth?: number }
  parallel?: { max_concurrency?: number; ttl?: string }
  budget?: { max_steps?: number; max_duration?: string }
  params?: RuleParam[]
  /** Present only on kind=alarm_policy; unowned fields are carried through on edit. */
  alarm?: {
    key?: string
    sources: string[]
    allowed_sources?: string[]
    level?: 'H' | 'M' | 'L'
    dimension?: string
    [key: string]: unknown
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
}

export interface DeleteRuleResponse {
  rule_id: string
  rule_name: string
  detached_bindings: number
  cleared_pending: number
  forced: boolean
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
  state: string
  attempt: number
  idempotency_key: string
  accepted_ref?: string
  last_error?: string
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

export interface ExplainReason {
  code: string
  message: string
  device_id?: string
  key?: string
  expected?: string
  actual?: string
  age?: string
}

export interface SimStep {
  at: string
  kind: string
  verdict?: string
  detail?: string
  reasons?: ExplainReason[]
  actions?: string[]
}

export interface SimAction {
  path: string
  kind: string
  detail: string
  outcome: string
}

export interface SimSampleInput {
  at: string
  device_id?: string
  signal: string
  key: string
  value: string
  unit?: string
  quality?: string
}

export interface SimulateResponse {
  rule_id: string
  revision: number
  definition_hash: string
  steps: SimStep[]
  actions: SimAction[]
  would_run: number
  side_effects: number
  ends_at?: string
  notes: string[]
}

export interface PreviewScope {
  deviceIds: string[]
  deviceCount: number
  templateIds: string[]
  templateDeviceCount: number
  truncated: boolean
}

export interface PreviewDependency {
  kind: string
  id: string
  name?: string
  exists: boolean
}

export interface PreviewRunPolicy {
  mode: string
  maxSteps: number
  maxRunDuration: string
  deadline: string
  ttl?: string
}

export interface ChangePreviewResponse {
  ruleId: string
  baseRevision: number
  baseVersion: number
  hashBefore: string
  hashAfter: string
  changed: boolean
  scope: PreviewScope
  dependencies: PreviewDependency[]
  runPolicy: PreviewRunPolicy
  bindingIssues: { field: string; code: string; message: string }[]
  requiresConfirmation: boolean
  token: string
  expiresAt: string
  issues: { field: string; code: string; message: string }[]
}

interface ChangePreviewWire extends Omit<ChangePreviewResponse, 'scope' | 'dependencies' | 'bindingIssues' | 'issues'> {
  scope: Omit<PreviewScope, 'deviceIds' | 'templateIds'> & { deviceIds?: string[]; templateIds?: string[] }
  dependencies?: PreviewDependency[]
  bindingIssues?: ChangePreviewResponse['bindingIssues']
  issues?: ChangePreviewResponse['issues']
}

export interface ValidationResponse {
  valid: boolean
  normalized?: RuleDefinition
  issues?: { field: string; code: string; message: string }[]
}

type ValidationResponseWire = Omit<ValidationResponse, 'issues'> & { issues?: ValidationResponse['issues'] | null }

export interface ExplainResponse {
  rule_id: string
  device_id: string
  from: string
  to: string
  verdict: string
  reasons: ExplainReason[]
  runs: Run[]
  pending?: {
    scope_key: string
    started_at: string
    deadline: string
    last_evidence_at: string
    require_processed_before: string
    defer_count: number
    remaining_ms: number
  }
  input?: {
    device_id: string
    signal: string
    key: string
    value: string
    quality: string
    observed_at: string
    age_ms: number
  }
  evidence: { runs_in_window: number; state_observed: boolean; complete: boolean; note: string }
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
  return call<ListRulesResponse>('get', '/v1/rules', { query }, isListRules)
}

export function getRule(id: string) {
  return call<Rule>('get', `/v1/rules/${encodeURIComponent(id)}`, {}, isRule)
}

export async function validateRule(definition: RuleDefinition): Promise<ValidationResponse> {
  const response = await call<ValidationResponseWire>(
    'post',
    '/v1/rule-validation',
    { body: { definition }, readOnly: true },
    isValidation
  )
  return { ...response, issues: response.issues ?? [] }
}

export async function previewRuleChange(id: string, definition: RuleDefinition): Promise<ChangePreviewResponse> {
  const preview = await call<ChangePreviewWire>(
    'post',
    `/v1/rules/${encodeURIComponent(id)}/change-preview`,
    {
      body: { definition },
      readOnly: true
    },
    isChangePreview
  )
  return normalizeChangePreview(preview)
}

export function createRule(input: { name: string; definition: RuleDefinition; enabled: boolean }, idem?: string) {
  return call<Rule>('post', '/v1/rules', { body: input, idempotencyKey: idem ?? createAutomationRequestId() }, isRule)
}

export function updateRule(
  id: string,
  input: { name: string; definition: RuleDefinition; version: number; previewToken?: string; force?: boolean },
  idem?: string
) {
  return call<Rule>(
    'put',
    `/v1/rules/${encodeURIComponent(id)}`,
    {
      body: input,
      idempotencyKey: idem ?? createAutomationRequestId()
    },
    isRule
  )
}

export function setRuleEnabled(id: string, enabled: boolean, version: number) {
  return call<Rule>(
    'post',
    `/v1/rules/${encodeURIComponent(id)}/enabled`,
    {
      body: { enabled, version }
    },
    isRule
  )
}

export function deleteRule(id: string, force = false): Promise<DeleteRuleResponse> {
  return call<DeleteRuleResponse>(
    'delete',
    `/v1/rules/${encodeURIComponent(id)}`,
    {
      query: { force }
    },
    isDeleteRuleResponse
  )
}

export async function simulateRule(id: string, input: { samples: SimSampleInput[] }): Promise<SimulateResponse> {
  const result = await call<SimulateWire>(
    'post',
    `/v1/rules/${encodeURIComponent(id)}/simulate`,
    { body: input, readOnly: true },
    isSimulate
  )
  return normalizeSimulate(result)
}

export async function explainRule(
  id: string,
  query: { device_id?: string; from?: string; to?: string }
): Promise<ExplainResponse> {
  const result = await call<ExplainWire>('get', `/v1/rules/${encodeURIComponent(id)}/explain`, { query }, isExplain)
  return normalizeExplain(result)
}

export async function runRule(id: string, input: { device_id?: string } = {}, idem?: string): Promise<Run> {
  const run = await call<RunWire>(
    'post',
    `/v1/rules/${encodeURIComponent(id)}/run`,
    {
      body: input,
      idempotencyKey: idem ?? createAutomationRequestId()
    },
    isRun
  )
  return normalizeRun(run)
}

export async function listRuns(id: string, query: Query): Promise<ListRunsResponse> {
  const result = await call<ListRunsWire>('get', `/v1/rules/${encodeURIComponent(id)}/runs`, { query }, isListRuns)
  return { ...result, runs: result.runs.map(normalizeRun) }
}

export async function getRun(runId: string): Promise<Run> {
  const run = await call<RunWire>('get', `/v1/runs/${encodeURIComponent(runId)}`, {}, isRun)
  return normalizeRun(run)
}

// ---------------------------------------------------------------------------
// Contexts (device / template)
// ---------------------------------------------------------------------------

export function getDeviceAutomation(deviceId: string) {
  return call<DeviceAutomation>('get', `/v1/device-automation/${encodeURIComponent(deviceId)}`, {}, isDeviceAutomation)
}

export function getTemplateBindings(deviceConfigId: string) {
  return call<TemplateBindings>(
    'get',
    `/v1/device-configs/${encodeURIComponent(deviceConfigId)}/bindings`,
    {},
    isTemplateBindings
  )
}
