/**
 * The words the automation pages show.
 *
 * Everything here is a pure function of the data the service already returned.
 * No component invents a sentence, and no page keeps its own copy of "what
 * status 3 means": the rule list, the run drawer and the device tab all call
 * these helpers, so one rule cannot be described two different ways.
 *
 * The module deliberately imports nothing. That keeps it usable from a plain
 * node check script as well as from Vue, and it keeps the wording reviewable
 * without starting a browser.
 */

export type Signal = 'telemetry' | 'attribute' | 'event' | 'status' | 'alarm'

export interface SummaryCondition {
  source?: string
  device_id?: string
  signal?: string
  key: string
  operator: string
  value: string
  unit?: string
}

export interface SummaryGroup {
  conditions: SummaryCondition[]
}

export interface SummaryStep {
  kind: string
  device_ref?: string
  action?: string
  identifier?: string
  value?: string
  wait?: string
  alarm_policy_id?: string
  notification_policy_id?: string
  continue_on_failure?: boolean
  then?: SummaryStep[]
  else?: SummaryStep[]
  condition?: SummaryGroup
  guard?: SummaryGroup
}

export interface SummaryDefinition {
  kind?: string
  mode?: string
  trigger?: { groups?: SummaryGroup[]; for?: string }
  freshness?: { max_age?: string; max_gap?: string; mode?: string; no_data?: string }
  targets?: {
    device_ids?: string[]
    device_config_ids?: string[]
    area_ids?: string[]
    labels?: string[]
    max_targets?: number
  }
  steps?: SummaryStep[]
  params?: { key: string }[]
}

export type Tone = 'ok' | 'warn' | 'bad' | 'info'

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

const UNIT_SECONDS: Record<string, number> = {
  ns: 1e-9,
  us: 1e-6,
  µs: 1e-6,
  ms: 1e-3,
  s: 1,
  m: 60,
  h: 3600
}

/** Seconds in a Go duration string ("1h30m0s"). Returns null when unparsable. */
export function durationSeconds(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (text === '' || text === '0' || text === '0s') return 0
  const pattern = /(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/g
  let total = 0
  let consumed = 0
  let match = pattern.exec(text)
  while (match) {
    total += Number(match[1]) * UNIT_SECONDS[match[2]]
    consumed += match[0].length
    match = pattern.exec(text)
  }
  // Reject leftovers so "5 minutes" is not silently read as 5 seconds.
  if (consumed !== text.replace(/^[+-]/, '').length) return null
  return total
}

/** "5m0s" -> "5 分钟". Zero is "立即", because that is what for=0 means. */
export function formatDuration(value: string | undefined | null, options: { zero?: string } = {}): string {
  const seconds = durationSeconds(value)
  if (seconds === null) return String(value ?? '')
  if (seconds === 0) return options.zero ?? '立即'
  const parts: string[] = []
  let rest = Math.round(seconds)
  const days = Math.floor(rest / 86400)
  if (days > 0) {
    parts.push(`${days} 天`)
    rest -= days * 86400
  }
  const hours = Math.floor(rest / 3600)
  if (hours > 0) {
    parts.push(`${hours} 小时`)
    rest -= hours * 3600
  }
  const minutes = Math.floor(rest / 60)
  if (minutes > 0) {
    parts.push(`${minutes} 分钟`)
    rest -= minutes * 60
  }
  if (rest > 0) parts.push(`${rest} 秒`)
  return parts.join(' ')
}

/**
 * Turns what a person typed into a Go duration.
 *
 * Accepts "90s", "5m", "1h30m" and the Chinese forms "90秒" / "5分钟" / "2小时".
 * A bare number means minutes, because "持续 5" on a rule form is read as
 * minutes by every operator we asked — and guessing seconds there is how a
 * five-minute confirmation becomes a five-second one.
 */
export function durationFromText(input: string): string | null {
  const text = String(input ?? '').trim()
  if (text === '') return null
  if (text === '0') return '0s'
  const chinese: Record<string, string> = { 秒: 's', 分钟: 'm', 分: 'm', 小时: 'h', 天: 'h' }
  let normalized = text.replace(/\s+/g, '')
  Object.entries(chinese).forEach(([word, unit]) => {
    const amount = new RegExp(`(\\d+(?:\\.\\d+)?)${word}`, 'g')
    if (word === '天') {
      normalized = normalized.replace(amount, (_all, n) => `${Number(n) * 24}h`)
      return
    }
    normalized = normalized.replace(amount, `$1${unit}`)
  })
  if (/^\d+(?:\.\d+)?$/.test(normalized)) normalized = `${normalized}m`
  if (durationSeconds(normalized) === null) return null
  // Re-emit in the canonical Go form so the server and the UI agree.
  const seconds = durationSeconds(normalized) as number
  return `${Math.round(seconds)}s`
}

// ---------------------------------------------------------------------------
// Conditions and steps
// ---------------------------------------------------------------------------

const OPERATOR_WORDS: Record<string, string> = {
  '=': '等于',
  '!=': '不等于',
  '>': '高于',
  '<': '低于',
  '>=': '不低于',
  '<=': '不高于',
  between: '介于',
  in: '属于',
  exists: '存在'
}

const SIGNAL_WORDS: Record<string, string> = {
  telemetry: '遥测',
  attribute: '属性',
  event: '事件',
  status: '在线状态',
  alarm: '告警'
}

export function operatorWords(operator: string): string {
  return OPERATOR_WORDS[operator] ?? operator
}

export function signalWords(signal: string | undefined): string {
  if (!signal) return '遥测'
  return SIGNAL_WORDS[signal] ?? signal
}

/** "温度 高于 30℃" — the reading is quoted so a unit never floats away from it. */
export function describeCondition(condition: SummaryCondition): string {
  const name = condition.key || '(未选指标)'
  const signal = condition.signal && condition.signal !== 'telemetry' ? `${signalWords(condition.signal)} ` : ''
  const who = condition.source === 'device' && condition.device_id ? `设备 ${condition.device_id} 的 ` : ''
  const unit = condition.unit ? condition.unit : ''
  const op = condition.operator
  if (op === 'between') return `${who}${signal}${name} 介于 ${condition.value}`
  if (op === 'exists') return `${who}${signal}${name} ${condition.value === 'true' ? '存在' : '不存在'}`
  return `${who}${signal}${name} ${operatorWords(op)} ${condition.value}${unit}`
}

export function describeGroup(group: SummaryGroup): string {
  const parts = (group.conditions ?? []).map(describeCondition).filter(Boolean)
  if (parts.length === 0) return '(空条件)'
  return parts.join(' 并且 ')
}

/** Groups are OR-ed; conditions inside a group are AND-ed. */
export function describeTrigger(trigger: SummaryDefinition['trigger']): string {
  const groups = (trigger?.groups ?? []).filter(group => (group.conditions ?? []).length > 0)
  if (groups.length === 0) return '手动执行'
  return groups.map(describeGroup).join(' 或者 ')
}

/**
 * One step, in the words of the person who wrote it.
 *
 * `indent` is off by default: in a one-sentence summary a leading space before
 * the branch arms reads as a typo. The run timeline asks for the indent because
 * there the nesting is the point.
 */
export function describeStep(step: SummaryStep, depth = 0, options: { indent?: boolean } = {}): string {
  const prefix = options.indent && depth > 0 ? '　'.repeat(depth) : ''
  switch (step.kind) {
    case 'action': {
      const who = step.device_ref && step.device_ref !== 'target' ? `${step.device_ref} ` : ''
      const what = step.action === 'command' ? '下发命令' : step.action === 'attribute' ? '写属性' : '写遥测'
      const value = step.value ? ` = ${step.value}` : ''
      const guard = step.guard ? `（前提：${describeGroup(step.guard)}）` : ''
      return `${prefix}${who}${what} ${step.identifier ?? ''}${value}${guard}`
    }
    case 'wait':
      return `${prefix}等待 ${formatDuration(step.wait)}`
    case 'alarm':
      return `${prefix}触发告警 ${step.alarm_policy_id ?? ''}`.trim()
    case 'notify':
      return `${prefix}发送通知 ${step.notification_policy_id ?? ''}`.trim()
    case 'activate_scene':
      return `${prefix}激活场景 ${step.device_ref ?? ''}`.trim()
    case 'branch': {
      const head = `${prefix}如果 ${describeGroup(step.condition ?? { conditions: [] })}`
      const then = (step.then ?? []).map(item => describeStep(item, depth + 1, options)).join('；')
      const otherwise = (step.else ?? []).map(item => describeStep(item, depth + 1, options)).join('；')
      const tail = otherwise ? `，否则 ${otherwise}` : ''
      return `${head}，就 ${then}${tail}`
    }
    default:
      return `${prefix}${step.kind}`
  }
}

export function describeMode(mode: string | undefined): string {
  switch (mode) {
    case 'restart':
      return '重来（中止旧的，重新开始）'
    case 'queued':
      return '排队（等这次跑完再跑）'
    case 'parallel':
      return '并行（各跑一份）'
    case 'single':
    default:
      return '忽略（还在执行时忽略新的触发）'
  }
}

export function describeTargets(targets: SummaryDefinition['targets']): string {
  if (!targets) return '未指定目标'
  const parts: string[] = []
  if (targets.device_ids?.length) parts.push(`${targets.device_ids.length} 台设备`)
  if (targets.device_config_ids?.length) parts.push(`${targets.device_config_ids.length} 个设备模板`)
  if (targets.area_ids?.length) parts.push(`${targets.area_ids.length} 个区域`)
  if (targets.labels?.length) parts.push(`标签 ${targets.labels.join('、')}`)
  if (parts.length === 0) return '未指定目标'
  const limit = targets.max_targets ? `，上限 ${targets.max_targets} 台` : ''
  return `${parts.join(' + ')}${limit}`
}

/**
 * One sentence that a non-developer can check against what they meant.
 *
 * It is the sentence shown under the rule name in the list and in the editor
 * preview, so "save" has something to compare against besides a green toast.
 */
export function summarizeDefinition(definition: SummaryDefinition): string {
  const trigger = describeTrigger(definition.trigger)
  const hold = definition.trigger?.for
  const holdText = hold && durationSeconds(hold) ? `，连续满足 ${formatDuration(hold)}` : ''
  const steps = (definition.steps ?? []).map(step => describeStep(step)).filter(Boolean)
  const then = steps.length ? steps.join('；') : '（没有动作）'
  const scope = definition.targets ? `，作用于${describeTargets(definition.targets)}` : ''
  const mode = definition.mode && definition.mode !== 'single' ? `；重复触发时${describeMode(definition.mode)}` : ''
  return `当 ${trigger}${holdText} 时，${then}${scope}${mode}。`
}

// ---------------------------------------------------------------------------
// Verdicts, runs and steps
// ---------------------------------------------------------------------------

export interface Description {
  label: string
  hint?: string
  tone: Tone
}

/**
 * Why a rule did or did not fire.
 *
 * `undetermined` and `no_data` are separate from `condition_not_met` on purpose:
 * "we know it was false" and "we could not tell" lead to different next steps,
 * and merging them tells the customer to check a threshold when the real
 * problem is a device that stopped reporting.
 */
export function describeVerdict(verdict: string): Description {
  switch (verdict) {
    case 'fired':
      return { label: '已触发', hint: '条件成立并已执行', tone: 'ok' }
    case 'waiting_for_duration':
      return {
        label: '正在计时',
        hint: '条件已经成立，还在等持续时长满足；未满足前不会执行动作',
        tone: 'info'
      }
    case 'condition_not_met':
      return { label: '条件不成立', hint: '最近一次读数没有满足条件', tone: 'info' }
    case 'no_data':
      return {
        label: '没有数据',
        hint: '这段时间内设备没有上报，无法判断条件是否成立；先检查设备是否在线或上报间隔',
        tone: 'warn'
      }
    case 'undetermined':
      return {
        label: '无法判断',
        hint: '数据质量或时间戳不足，系统不会把不确定当成不成立；请检查设备时钟与上报质量',
        tone: 'warn'
      }
    case 'not_fired':
      return { label: '没有触发', hint: '这段时间内没有满足条件的记录', tone: 'info' }
    default:
      return { label: verdict || '未知', hint: '未识别的判定结果，请查看原始记录', tone: 'warn' }
  }
}

export function describeRunStatus(status: string, reasonCode?: string): Description {
  switch (status) {
    case 'succeeded':
    case 'success':
      return { label: '成功', tone: 'ok' }
    case 'running':
      return { label: '执行中', hint: '还在执行，稍后刷新可看后续步骤', tone: 'info' }
    case 'waiting':
      return { label: '等待中', hint: '卡在等待步骤，到时间会自动继续', tone: 'info' }
    case 'queued':
      return { label: '排队中', hint: '同一条规则还在执行，这次按排队策略等待', tone: 'info' }
    case 'partial':
      return { label: '部分成功', hint: '部分设备或步骤没有完成，展开可看是哪一步', tone: 'warn' }
    case 'failed':
      return { label: '失败', hint: reasonCode ? `原因代码：${reasonCode}` : '有步骤没有完成', tone: 'bad' }
    case 'expired':
      return { label: '已超时', hint: '超过允许的执行时限，未完成的步骤不会再执行', tone: 'warn' }
    case 'cancelled':
      return { label: '已取消', hint: '被新的触发或人工操作中止', tone: 'warn' }
    default:
      return { label: status || '未知', tone: 'warn' }
  }
}

export function describeStepStatus(status: string): Description {
  switch (status) {
    case 'succeeded':
    case 'done':
      return { label: '完成', tone: 'ok' }
    case 'running':
      return { label: '进行中', tone: 'info' }
    case 'pending':
      return { label: '未开始', tone: 'info' }
    case 'waiting':
      return { label: '等待中', tone: 'info' }
    case 'skipped':
      return { label: '已跳过', tone: 'info' }
    case 'failed':
      return { label: '失败', tone: 'bad' }
    case 'unknown':
      return { label: '结果未知', hint: '命令已发出但没有收到确认，先查设备再决定是否重试', tone: 'warn' }
    default:
      return { label: status || '未知', tone: 'warn' }
  }
}

export function describeTarget(target: { selected: boolean; status: string; reason_code?: string }): Description {
  if (!target.selected) {
    return {
      label: '未选中',
      hint: target.reason_code ? `原因：${target.reason_code}` : '这台设备没有进入本次执行范围',
      tone: 'info'
    }
  }
  return describeStepStatus(target.status)
}

export interface TimelineEntry {
  key: string
  title: string
  detail?: string
  tone: Tone
}

/**
 * The run as a timeline a support engineer can read top to bottom.
 *
 * Steps, per-device dispatch results and outbound intents are three different
 * kinds of evidence; keeping them in one list with explicit titles is what makes
 * "which device did not get the command" answerable without opening the
 * database.
 */
export function buildTimeline(run: {
  status: string
  reason_code?: string
  started_at?: string
  finished_at?: string
  steps?: { idx: number; kind: string; status: string; attempt?: number; detail?: string }[]
  targets?: { device_id: string; selected: boolean; status: string; reason_code?: string }[]
  outbox?: {
    id: string
    kind: string
    state: string
    attempt: number
    idempotency_key: string
    accepted_ref?: string
    last_error?: string
  }[]
}): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const overall = describeRunStatus(run.status, run.reason_code)
  entries.push({
    key: 'run',
    title: `本次执行：${overall.label}`,
    detail: overall.hint,
    tone: overall.tone
  })
  const steps = [...(run.steps ?? [])].sort((a, b) => a.idx - b.idx)
  steps.forEach(step => {
    const described = describeStepStatus(step.status)
    const attempt = step.attempt && step.attempt > 1 ? `（第 ${step.attempt} 次尝试）` : ''
    entries.push({
      key: `step-${step.idx}`,
      title: `第 ${step.idx + 1} 步 ${step.kind}：${described.label}${attempt}`,
      detail: step.detail,
      tone: described.tone
    })
  })
  ;(run.targets ?? []).forEach(target => {
    const described = describeTarget(target)
    entries.push({
      key: `target-${target.device_id}`,
      title: `设备 ${target.device_id}：${described.label}`,
      detail: described.hint,
      tone: described.tone
    })
  })
  ;(run.outbox ?? []).forEach(intent => {
    const outboxStates: Record<string, Description> = {
      pending: { label: '等待投递', tone: 'info' },
      dispatched: { label: '已投递，等待结果', tone: 'info' },
      accepted: { label: '已受理', hint: '受理不代表设备已执行', tone: 'ok' },
      failed: { label: '投递失败', tone: 'bad' },
      cancelled: { label: '已取消', tone: 'info' },
      unresolved: { label: '结果待核对', tone: 'warn' }
    }
    const described = outboxStates[intent.state] ?? { label: intent.state || '状态未知', tone: 'warn' as const }
    const evidence = [
      `幂等键：${intent.idempotency_key}`,
      intent.attempt > 0 ? `尝试次数：${intent.attempt}` : '',
      intent.accepted_ref ? `受理凭据：${intent.accepted_ref}` : '',
      intent.last_error ? `最近错误：${intent.last_error}` : ''
    ].filter(Boolean)
    entries.push({
      key: `outbox-${intent.id}`,
      title: `外发 ${intent.kind}：${described.label}`,
      detail: [described.hint, ...evidence].filter(Boolean).join('；'),
      tone: described.tone
    })
  })
  return entries
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface WireIssue {
  field: string
  code: string
  message: string
}

/**
 * Puts server field errors where the form can show them.
 *
 * The service reports paths relative to the definition ("trigger.groups",
 * "steps[0].value"). The form uses "definition." + the same path, so the only
 * work here is prefixing and picking the first message per field — showing three
 * messages under one input makes the user read the same problem three times.
 */
export function toFormFieldErrors(issues: WireIssue[] | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  ;(issues ?? []).forEach(issue => {
    if (!issue?.field) return
    const path = issue.field.startsWith('definition.') ? issue.field : `definition.${issue.field}`
    if (!out[path]) out[path] = issue.message
  })
  return out
}

/** The message to show above the form: one sentence, not the whole list. */
export function firstIssueMessage(issues: WireIssue[] | undefined): string | null {
  const first = (issues ?? []).find(issue => issue?.message)
  return first ? first.message : null
}
