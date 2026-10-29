/**
 * The editable shape of a rule, and the two conversions around it.
 *
 * The form model is deliberately not the wire model. A form needs every field
 * present and every duration as the text a person typed; the wire model omits
 * defaults and carries canonical duration strings. Keeping the conversion in one
 * place means the list page, the editor and the tests all agree on what
 * "unchanged" looks like — which is what stops an edit from silently rewriting a
 * field the user never opened.
 *
 * Like `summary.ts`, this module imports nothing so it can be checked without a
 * browser.
 */

import type {
  Condition,
  ConditionGroup,
  RuleDefinition,
  RuleKind,
  RunMode,
  SignalKind,
  Step,
  TargetSpec
} from '@/service/api/automation-rules'
import { durationFromText, durationSeconds } from './summary'

export interface FormCondition {
  source: 'self' | 'device'
  device_id: string
  signal: SignalKind
  key: string
  operator: string
  value: string
  unit: string
}

export interface FormGroup {
  conditions: FormCondition[]
}

export interface FormStep {
  kind: Step['kind']
  device_ref: string
  action: 'telemetry' | 'attribute' | 'command'
  identifier: string
  value: string
  wait: string
  alarm_policy_id: string
  notification_policy_id: string
  continue_on_failure: boolean
  condition: FormGroup
  then: FormStep[]
  else: FormStep[]
}

export interface FormModel {
  name: string
  kind: RuleKind
  mode: RunMode
  scope: 'device' | 'rule'
  enabled: boolean
  /** Duration the condition must hold, as typed. Empty means "immediately". */
  holdFor: string
  maxAge: string
  maxGap: string
  groups: FormGroup[]
  steps: FormStep[]
  deviceIDs: string[]
  deviceConfigIDs: string[]
  areaIDs: string[]
  labels: string[]
  labelMatch: 'and' | 'or'
  maxTargets: number
  alarmKey: string
  alarmLevel: 'H' | 'M' | 'L' | ''
  alarmDimension: string
  alarmSources: string[]
  alarmAllowedSources: string[]
  alarmHasAllowedSources: boolean
  alarmExtra: Record<string, unknown>
}

export interface FormContext {
  kind?: RuleKind
  scope?: 'device' | 'rule'
  deviceID?: string
  deviceConfigID?: string
}

export const MAX_BRANCH_DEPTH = 2

export function emptyCondition(): FormCondition {
  return { source: 'self', device_id: '', signal: 'telemetry', key: '', operator: '>', value: '', unit: '' }
}

export function emptyStep(kind: Step['kind'] = 'action'): FormStep {
  return {
    kind,
    device_ref: 'target',
    action: 'telemetry',
    identifier: '',
    value: '',
    wait: '',
    alarm_policy_id: '',
    notification_policy_id: '',
    continue_on_failure: false,
    condition: { conditions: [emptyCondition()] },
    then: [],
    else: []
  }
}

/**
 * A new rule starts with one empty condition and one empty action, in the same
 * order the old form asked for them. An empty list with an "add" button makes
 * the first step of every new rule a click.
 */
export function emptyForm(context: FormContext = {}): FormModel {
  return {
    name: '',
    kind: context.kind ?? 'automation',
    mode: 'single',
    scope: context.scope ?? 'device',
    enabled: true,
    holdFor: '',
    maxAge: '90s',
    maxGap: '90s',
    groups: [{ conditions: [emptyCondition()] }],
    steps: context.kind === 'alarm_policy' ? [] : [emptyStep('action')],
    deviceIDs: context.deviceID ? [context.deviceID] : [],
    deviceConfigIDs: context.deviceConfigID ? [context.deviceConfigID] : [],
    areaIDs: [],
    labels: [],
    labelMatch: 'and',
    maxTargets: 200,
    alarmKey: '',
    alarmLevel: context.kind === 'alarm_policy' ? 'M' : '',
    alarmDimension: '',
    alarmSources: ['detector'],
    alarmAllowedSources: [],
    alarmHasAllowedSources: false,
    alarmExtra: {}
  }
}

function conditionToForm(condition: Condition): FormCondition {
  return {
    source: condition.source === 'device' ? 'device' : 'self',
    device_id: condition.device_id ?? '',
    signal: (condition.signal ?? 'telemetry') as SignalKind,
    key: condition.key ?? '',
    operator: condition.operator || '>',
    value: condition.value ?? '',
    unit: condition.unit ?? ''
  }
}

function conditionToWire(condition: FormCondition): Condition {
  const out: Condition = {
    source: condition.source,
    signal: condition.signal,
    key: condition.key.trim(),
    operator: condition.operator,
    value: String(condition.value ?? '').trim()
  }
  if (condition.source === 'device' && condition.device_id.trim()) out.device_id = condition.device_id.trim()
  if (condition.unit.trim()) out.unit = condition.unit.trim()
  return out
}

function groupToForm(group?: ConditionGroup): FormGroup {
  const conditions = (group?.conditions ?? []).map(conditionToForm)
  return { conditions: conditions.length ? conditions : [emptyCondition()] }
}

function groupToWire(group: FormGroup): ConditionGroup {
  return { conditions: group.conditions.filter(hasContent).map(conditionToWire) }
}

function hasContent(condition: FormCondition): boolean {
  return Boolean(condition.key && String(condition.key).trim())
}

function stepToForm(step: Step): FormStep {
  const base = emptyStep(step.kind)
  return {
    ...base,
    device_ref: step.device_ref ?? 'target',
    action: (step.action as FormStep['action']) ?? 'telemetry',
    identifier: step.identifier ?? '',
    value: step.value ?? '',
    wait: step.wait ?? '',
    alarm_policy_id: step.alarm_policy_id ?? '',
    notification_policy_id: step.notification_policy_id ?? '',
    continue_on_failure: Boolean(step.continue_on_failure),
    condition: groupToForm(step.condition),
    then: (step.then ?? []).map(stepToForm),
    else: (step.else ?? []).map(stepToForm)
  }
}

function stepToWire(step: FormStep): Step {
  const out: Step = { kind: step.kind }
  switch (step.kind) {
    case 'action':
      // "target" is what an absent device_ref already means, so it is left out.
      // Writing it back would make an untouched rule differ from itself.
      if (step.device_ref && step.device_ref !== 'target') out.device_ref = step.device_ref
      out.action = step.action
      out.identifier = step.identifier.trim()
      out.value = String(step.value ?? '').trim()
      break
    case 'wait':
      out.wait = durationFromText(step.wait) ?? '0s'
      break
    case 'alarm':
      out.alarm_policy_id = step.alarm_policy_id.trim()
      break
    case 'notify':
      out.notification_policy_id = step.notification_policy_id.trim()
      break
    case 'activate_scene':
      out.device_ref = step.device_ref.trim()
      break
    case 'branch':
      out.condition = groupToWire(step.condition)
      out.then = step.then.map(stepToWire)
      out.else = step.else.map(stepToWire)
      break
    default:
      break
  }
  if (step.continue_on_failure) out.continue_on_failure = true
  return out
}

/** Wire definition -> editable model. Unknown fields are dropped, not guessed. */
export function definitionToForm(definition: RuleDefinition, name = '', enabled = true): FormModel {
  const trigger = definition.trigger
  const alarm = definition.alarm
  const alarmOwnedKeys = new Set(['key', 'sources', 'allowed_sources', 'level', 'dimension'])
  return {
    name,
    kind: definition.kind,
    mode: definition.mode,
    scope: definition.scope,
    enabled,
    holdFor: trigger?.for && durationSeconds(trigger.for) ? trigger.for : '',
    maxAge: definition.freshness?.max_age ?? '90s',
    maxGap: definition.freshness?.max_gap ?? '90s',
    groups: (trigger?.groups ?? []).map(group => groupToForm(group)),
    steps: (definition.steps ?? []).map(stepToForm),
    deviceIDs: definition.targets?.device_ids ?? [],
    deviceConfigIDs: definition.targets?.device_config_ids ?? [],
    areaIDs: definition.targets?.area_ids ?? [],
    labels: definition.targets?.labels ?? [],
    labelMatch: definition.targets?.label_match === 'or' ? 'or' : 'and',
    maxTargets: definition.targets?.max_targets || 200,
    alarmKey: alarm?.key ?? '',
    alarmLevel: alarm?.level ?? '',
    alarmDimension: alarm?.dimension ?? '',
    alarmSources: alarm ? [...(alarm.sources ?? [])] : ['detector'],
    alarmAllowedSources: [...(alarm?.allowed_sources ?? [])],
    alarmHasAllowedSources: Boolean(alarm && Object.prototype.hasOwnProperty.call(alarm, 'allowed_sources')),
    alarmExtra: Object.fromEntries(Object.entries(alarm ?? {}).filter(([key]) => !alarmOwnedKeys.has(key)))
  }
}

/** Switching kinds clears stale actions when entering an alarm policy. */
export function changeFormKind(form: FormModel, kind: RuleKind): FormModel {
  if (kind === form.kind) return form
  return {
    ...form,
    kind,
    alarmLevel: kind === 'alarm_policy' && !form.alarmLevel ? 'M' : form.alarmLevel,
    steps: kind === 'alarm_policy' ? [] : form.kind === 'alarm_policy' ? [emptyStep('action')] : form.steps,
    alarmSources: form.alarmSources.length ? form.alarmSources : ['detector']
  }
}

/**
 * Keeps a duration exactly as it was written when it already is a duration.
 *
 * The point is that opening a rule and saving it without touching anything must
 * not rewrite `5m0s` into `300s`: the two mean the same thing, but a field the
 * user never edited changing on save is the kind of surprise that makes people
 * stop trusting the form. Only free text ("5分钟", a bare "5") is converted.
 */
function normalizeDuration(text: string, fallback: string): string {
  const trimmed = String(text ?? '').trim()
  if (trimmed && durationSeconds(trimmed) !== null) return trimmed
  const parsed = durationFromText(trimmed)
  return parsed ?? fallback
}

/** Editable model -> wire definition. The server normalizes and validates. */
export function formToDefinition(form: FormModel): RuleDefinition {
  const targets: TargetSpec = {}
  if (form.deviceIDs.length) targets.device_ids = [...form.deviceIDs]
  if (form.deviceConfigIDs.length) targets.device_config_ids = [...form.deviceConfigIDs]
  if (form.areaIDs.length) targets.area_ids = [...form.areaIDs]
  if (form.labels.length) {
    targets.labels = [...form.labels]
    targets.label_match = form.labelMatch
  }
  if (form.maxTargets) targets.max_targets = form.maxTargets

  const definition: RuleDefinition = {
    kind: form.kind,
    mode: form.mode,
    scope: form.scope,
    trigger: {
      groups: form.groups.map(groupToWire).filter(group => group.conditions.length > 0),
      for: normalizeDuration(form.holdFor, '0s')
    },
    freshness: {
      max_age: normalizeDuration(form.maxAge, '90s'),
      max_gap: normalizeDuration(form.maxGap, '90s')
    },
    targets,
    steps: form.kind === 'alarm_policy' ? [] : form.steps.map(stepToWire)
  }
  if (form.kind === 'alarm_policy') {
    const alarm: NonNullable<RuleDefinition['alarm']> = {
      ...form.alarmExtra,
      sources: [...form.alarmSources]
    }
    if (form.alarmKey.trim()) alarm.key = form.alarmKey.trim()
    if (form.alarmLevel) alarm.level = form.alarmLevel
    if (form.alarmDimension.trim()) alarm.dimension = form.alarmDimension.trim()
    if (form.alarmHasAllowedSources || form.alarmAllowedSources.length) {
      alarm.allowed_sources = [...form.alarmAllowedSources]
    }
    definition.alarm = alarm
  }
  return definition
}

/**
 * Puts back the parts of a rule this form does not edit.
 *
 * The editor covers conditions, steps, targets, mode and freshness. A rule may
 * also carry parameter slots, a recovery trigger, queue/parallel limits, a budget
 * and an alarm spec. Building the payload from the form alone would drop those
 * silently — the save would succeed and the rule would come back weaker than it
 * went in. Anything the form does not own is carried over from what was loaded.
 */
export function mergeDefinition(original: RuleDefinition | null, edited: RuleDefinition): RuleDefinition {
  if (!original) return edited
  const out: RuleDefinition = { ...edited }
  if (!out.params?.length && original.params?.length) out.params = original.params
  if (!out.recovery && original.recovery) out.recovery = original.recovery
  if (!out.queue && original.queue) out.queue = original.queue
  if (!out.parallel && original.parallel) out.parallel = original.parallel
  if (!out.budget && original.budget) out.budget = original.budget
  if (out.kind === 'alarm_policy') {
    if (!out.alarm && original.alarm) out.alarm = original.alarm
  } else {
    delete out.alarm
  }
  return out
}

export interface FormIssue {
  field: string
  code: string
  message: string
}

/**
 * The checks that can be made before a round trip.
 *
 * These do not replace the server's validation — they exist so the obvious
 * mistakes do not need a network round trip to be reported, and so a rule that
 * is still half-filled does not get sent at all. Every message names the input
 * it belongs to.
 */
export function validateForm(form: FormModel): FormIssue[] {
  const issues: FormIssue[] = []
  if (!form.name.trim()) {
    issues.push({ field: 'name', code: 'required', message: '请填写规则名称' })
  }
  const filledGroups = form.groups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => group.conditions.some(hasContent))
  if (filledGroups.length === 0 && form.kind !== 'scene') {
    issues.push({ field: 'definition.trigger.groups', code: 'empty_trigger', message: '至少需要一条触发条件' })
  }
  filledGroups.forEach(({ group, index }) => {
    group.conditions.forEach((condition, position) => {
      if (!hasContent(condition)) return
      if (!String(condition.value ?? '').trim() && condition.operator !== 'exists') {
        issues.push({
          field: `definition.trigger.groups[${index}].conditions[${position}].value`,
          code: 'required',
          message: '请填写比较值'
        })
      }
      if (condition.source === 'device' && !condition.device_id.trim()) {
        issues.push({
          field: `definition.trigger.groups[${index}].conditions[${position}].device_id`,
          code: 'required',
          message: '跨设备条件需要指定设备'
        })
      }
    })
  })
  if (form.steps.length === 0 && form.kind !== 'alarm_policy') {
    issues.push({ field: 'definition.steps', code: 'empty_steps', message: '至少需要一个执行动作' })
  }
  form.steps.forEach((step, index) => {
    const field = `definition.steps[${index}]`
    if (step.kind === 'action' && !step.identifier.trim()) {
      issues.push({ field: `${field}.identifier`, code: 'required', message: '请选择要写入的指标或命令' })
    }
    if (step.kind === 'wait' && durationFromText(step.wait) === null) {
      issues.push({ field: `${field}.wait`, code: 'invalid_duration', message: '等待时长格式不正确，例如 30s、5m' })
    }
    if (step.kind === 'branch') {
      if (!step.condition.conditions.some(hasContent)) {
        issues.push({ field: `${field}.condition`, code: 'empty_condition', message: '分支条件不能为空' })
      }
      if (step.then.length === 0) {
        issues.push({ field: `${field}.then`, code: 'empty_then', message: '分支成立时至少要有一个动作' })
      }
    }
  })
  if (form.holdFor.trim() && durationFromText(form.holdFor) === null) {
    issues.push({ field: 'definition.trigger.for', code: 'invalid_duration', message: '持续时长格式不正确，例如 5m' })
  }
  if (form.mode === 'queued' || form.mode === 'parallel') {
    if (!form.maxTargets || form.maxTargets <= 0) {
      issues.push({ field: 'definition.targets.max_targets', code: 'required', message: '请填写目标设备上限' })
    }
  }
  return issues
}

export function issuesToFieldMap(issues: FormIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  issues.forEach(issue => {
    if (!out[issue.field]) out[issue.field] = issue.message
  })
  return out
}
