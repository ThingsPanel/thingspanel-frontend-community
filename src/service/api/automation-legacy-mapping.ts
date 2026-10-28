/**
 * 旧表单 ⇄ 新规则定义 的翻译。
 *
 * 页面（场景管理、场景编辑、场景联动、联动编辑）是围绕旧数据结构长出来的：
 * 一组「触发条件」（同组 AND、组间 OR）加一串「动作」。新引擎要的是
 * `definition`：目标集 + 触发组 + 步骤。两者的差别不是字段改名，而是
 * 「一条规则作用在哪些设备上」这件事从隐式变成了显式。
 *
 * 所以翻译集中在这一个文件里，页面只负责收集用户填的东西。这样做有三个好处：
 *
 * 1. 规则只有一份。页面各写各的，四个页面就会有四份互相矛盾的翻译。
 * 2. 可以被单独验证。这里的函数不碰网络，见 `scripts/check-automation-mapping.ts`。
 * 3. 后端 `automation/legacy/*.go` 是同一套映射的权威实现（升级脚本用的就是它）。
 *    两边的判断必须一致，否则「页面上新建的规则」和「升级脚本搬过来的规则」
 *    会长得不一样，同一个业务在两处表现不同是最难查的那类问题。
 *
 * 转不了的情况一律返回 issue，不猜。猜出来的规则会安静地做错事，而报出来的
 * 问题用户当场就能改。
 */

import type { Condition, ConditionGroup, RuleDefinition, Step } from './automation-rules'

export interface MappingIssue {
  field: string
  code: string
  message: string
}

export interface MappingResult<T> {
  value: T
  issues: MappingIssue[]
}

// ---------------------------------------------------------------------------
// 旧结构
// ---------------------------------------------------------------------------

/** 旧动作类型，取值与 scene_action_info.action_type 一致。 */
export const LegacyActionType = {
  singleDevice: '10',
  deviceConfig: '11',
  activateScene: '20',
  raiseAlarm: '30',
  service: '40'
} as const

/** 旧触发条件类型，取值与 device_trigger_condition.trigger_condition_type 一致。 */
export const LegacyConditionType = {
  singleDevice: '10',
  deviceConfig: '11',
  timeRange: '22'
} as const

/** 一条旧动作。页面提交前已经把 action_value 编码成 JSON 字符串。 */
export interface LegacyAction {
  action_type: string
  action_target: string
  action_param_type?: string | null
  action_param?: string | null
  action_value?: string | null
  remark?: string | null
  continue_on_failure?: boolean
}

/** 一条旧触发条件。 */
export interface LegacyCondition {
  trigger_conditions_type: string
  trigger_source: string
  trigger_param_type: string
  trigger_param: string
  trigger_operator?: string | null
  trigger_value?: string | null
}

/** 场景编辑页的表单。 */
export interface SceneForm {
  id?: string
  name: string | null
  description?: string | null
  actions: LegacyAction[]
}

/** 联动编辑页的表单。 */
export interface LinkageForm {
  id?: string
  name: string | null
  description?: string | null
  /** 'Y' / 'N'，旧控制台的开关写法。 */
  enabled?: string | null
  trigger_condition_groups: LegacyCondition[][]
  actions: LegacyAction[]
}

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

/** 新引擎的默认新鲜度窗口，与后端 legacy 映射保持一致。 */
const FRESHNESS = { max_age: '10m', max_gap: '10m' }

function issue(field: string, code: string, message: string): MappingIssue {
  return { field, code, message }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value).trim()
}

function uniqueSorted(ids: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(ids).filter(Boolean))).sort()
}

/**
 * 把旧的动作参数类型折成新引擎的三种写法。
 *
 * 页面里同一个概念有三套写法：`telemetry`、`c_telemetry`、数据库里的 `TEL`。
 * 这里一次收干净，下游只认 `telemetry` / `attribute` / `command`。
 */
export function normaliseActionKind(raw: unknown): 'telemetry' | 'attribute' | 'command' | null {
  switch (text(raw).toLowerCase()) {
    case 'telemetry':
    case 'c_telemetry':
    case 'tel':
      return 'telemetry'
    case 'attribute':
    case 'attributes':
    case 'c_attribute':
    case 'attr':
      return 'attribute'
    case 'command':
    case 'c_command':
    case 'cmd':
      return 'command'
    default:
      return null
  }
}

/**
 * 从旧 action_value 里取出「真正要写下去的那个值」。
 *
 * 旧结构把值和标识符一起编码进了 JSON：遥测/属性是 `{"humidity":2}`，命令是
 * `{"method":"...","params":{...}}`，而 `c_` 开头的那几种直接就是裸值。新引擎
 * 的 `value` 只放值本身，标识符单独一个字段，所以这里要把它们拆开。
 */
export function legacyActionValue(action: LegacyAction): string {
  const raw = action.action_value
  if (raw === null || raw === undefined || raw === '') return ''
  const rawText = String(raw)
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    // 裸值：c_telemetry / c_attribute / c_command 就是这么存的。
    return rawText
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return String(parsed)
  }
  const obj = parsed as Record<string, unknown>
  const kind = normaliseActionKind(action.action_param_type)
  if (kind === 'command') {
    const params = obj.params
    if (typeof params === 'string') return params
    if (params === undefined) return ''
    return JSON.stringify(params)
  }
  const identifier = text(action.action_param)
  if (identifier && Object.prototype.hasOwnProperty.call(obj, identifier)) {
    return String(obj[identifier])
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'value')) {
    return String(obj.value)
  }
  // 只有一层键、且键名与标识符对不上：旧数据里出现过这种，取唯一的值。
  const keys = Object.keys(obj)
  if (keys.length === 1) return String(obj[keys[0]])
  return rawText
}

/**
 * `legacyActionValue` 的逆过程：把标识符和值重新编码成旧结构的样子。
 *
 * 回显时必须和页面里 `dataEcho` / `echoActionData` 的解析方式对上，否则打开
 * 一条老规则会看到空值。
 */
export function encodeLegacyActionValue(action: LegacyAction, value: string): string {
  const kind = normaliseActionKind(action.action_param_type)
  if (kind === 'command') {
    return JSON.stringify({ method: text(action.action_param), params: value })
  }
  const identifier = text(action.action_param)
  return JSON.stringify({ [identifier || 'value']: value })
}

// ---------------------------------------------------------------------------
// 场景：只有动作，没有触发条件
// ---------------------------------------------------------------------------

/** 场景动作里代表「这一整类设备」的写法：新引擎用目标集展开，不写死 id。 */
const CONFIG_FANOUT_REF = 'target'

/**
 * 场景表单 → 规则定义。
 *
 * 场景在旧控制台里是一个按钮，所以新模型里没有触发组（trigger 为空），
 * 由「手动执行」入口跑。顺序就是用户排的顺序，不做排序。
 */
export function sceneFormToDefinition(form: SceneForm): MappingResult<RuleDefinition> {
  const issues: MappingIssue[] = []
  const steps: Step[] = []
  const deviceIDs: string[] = []
  const configIDs: string[] = []

  form.actions.forEach((action, index) => {
    const field = `actions[${index}]`
    const target = text(action.action_target)

    switch (text(action.action_type)) {
      case LegacyActionType.singleDevice:
      case LegacyActionType.deviceConfig: {
        const kind = normaliseActionKind(action.action_param_type)
        if (!target) {
          issues.push(issue(field, 'action_target_missing', `第 ${index + 1} 个动作没有选择设备`))
          return
        }
        if (!text(action.action_param)) {
          issues.push(issue(field, 'action_param_missing', `第 ${index + 1} 个动作没有选择要下发的数据/命令`))
          return
        }
        if (!kind) {
          issues.push(issue(field, 'action_param_type_unknown', `第 ${index + 1} 个动作的类型无法识别，请重新选择`))
          return
        }
        const isConfig = text(action.action_type) === LegacyActionType.deviceConfig
        if (isConfig) {
          configIDs.push(target)
        } else {
          deviceIDs.push(target)
        }
        steps.push({
          kind: 'action',
          // 单台设备写死自己的 id：一个场景里「A 开阀、B 启泵」是常态，
          // 不写死就会把两条命令发给两台设备。
          device_ref: isConfig ? CONFIG_FANOUT_REF : target,
          action: kind,
          identifier: text(action.action_param),
          value: legacyActionValue(action),
          ...(action.continue_on_failure ? { continue_on_failure: true } : {})
        })
        return
      }

      case LegacyActionType.activateScene: {
        if (!target) {
          issues.push(issue(field, 'activate_scene_missing', `第 ${index + 1} 个动作没有选择要激活的场景`))
          return
        }
        steps.push({ kind: 'activate_scene', value: target })
        return
      }

      case LegacyActionType.raiseAlarm: {
        if (!target) {
          issues.push(issue(field, 'alarm_policy_missing', `第 ${index + 1} 个动作没有选择要触发的告警`))
          return
        }
        steps.push({ kind: 'alarm', alarm_policy_id: target, device_ref: 'target', value: 'qualified' })
        return
      }

      case LegacyActionType.service:
        issues.push(
          issue(
            field,
            'service_action_unsupported',
            `第 ${index + 1} 个动作是「服务」（调用外部接口），本次没有承接方；请改用通知策略或外部执行器`
          )
        )
        return

      default:
        issues.push(issue(field, 'action_type_unknown', `第 ${index + 1} 个动作的类型无法识别`))
    }
  })

  const uniqueDevices = uniqueSorted(deviceIDs)
  const uniqueConfigs = uniqueSorted(configIDs)

  if (steps.length === 0) {
    issues.push(issue('actions', 'empty_steps', '场景至少要有一个动作'))
  }
  if (uniqueDevices.length === 0 && uniqueConfigs.length === 0) {
    issues.push(issue('actions', 'no_targets', '场景里没有任何动作指向设备'))
  }
  // 「整类设备」在新模型里就是整条规则的目标集，所以它不能和单台设备混在一起：
  // 混在一起时，属于整类设备的那个动作会连单台设备一起下发。
  if (uniqueConfigs.length > 0 && (uniqueDevices.length > 0 || uniqueConfigs.length > 1)) {
    issues.push(
      issue(
        'actions',
        'mixed_device_and_config_actions',
        '这个场景同时用了「单个设备」和「单类设备」的动作。新模型里一条场景只能有一种目标，请拆成两个场景'
      )
    )
  }

  return {
    value: {
      kind: 'scene',
      mode: 'single',
      scope: 'rule',
      ...(text(form.description) ? { description: text(form.description) } : {}),
      trigger: { groups: [], for: '0s' },
      freshness: { ...FRESHNESS },
      targets: uniqueConfigs.length > 0 ? { device_config_ids: uniqueConfigs } : { device_ids: uniqueDevices },
      steps
    } as RuleDefinition,
    issues
  }
}

/** 规则定义 → 场景表单，用于编辑页回显。 */
export function definitionToSceneForm(definition: RuleDefinition, name: string, id = ''): SceneForm {
  const configID = definition.targets?.device_config_ids?.[0] ?? ''
  const actions: LegacyAction[] = []

  ;(definition.steps ?? []).forEach(step => {
    if (step.kind === 'action') {
      const isConfig = step.device_ref === CONFIG_FANOUT_REF || (!step.device_ref && !!configID)
      const action: LegacyAction = {
        action_type: isConfig ? LegacyActionType.deviceConfig : LegacyActionType.singleDevice,
        action_target: isConfig ? configID : text(step.device_ref),
        action_param_type: step.action ?? 'telemetry',
        action_param: step.identifier ?? '',
        action_value: ''
      }
      action.action_value = encodeLegacyActionValue(action, step.value ?? '')
      if (step.continue_on_failure) action.continue_on_failure = true
      actions.push(action)
      return
    }
    if (step.kind === 'activate_scene') {
      actions.push({
        action_type: LegacyActionType.activateScene,
        action_target: text(step.value),
        action_param_type: null,
        action_param: null,
        action_value: null
      })
      return
    }
    if (step.kind === 'alarm') {
      actions.push({
        action_type: LegacyActionType.raiseAlarm,
        action_target: text(step.alarm_policy_id),
        action_param_type: null,
        action_param: null,
        action_value: null
      })
      return
    }
    // 新模型里比旧场景多的步骤（等待、通知、分支）在旧表单里没有位置。
    // 打开这类场景时页面会提示「这条场景含有页面不支持编辑的步骤」，而不是
    // 悄悄把步骤丢掉再保存 —— 丢一次就等于删掉用户配的东西。
  })

  return {
    id,
    name,
    description: definition.description ?? '',
    actions
  }
}

/** 这条规则里是否有旧场景表单表达不了的步骤。 */
export function sceneStepsBeyondForm(definition: RuleDefinition): string[] {
  const extra: string[] = []
  ;(definition.steps ?? []).forEach((step, index) => {
    if (step.kind === 'action' || step.kind === 'activate_scene' || step.kind === 'alarm') return
    extra.push(`第 ${index + 1} 步（${step.kind}）`)
  })
  return extra
}

// ---------------------------------------------------------------------------
// 联动：触发条件组 + 动作
// ---------------------------------------------------------------------------

function conditionSignal(paramType: unknown): Condition['signal'] | null {
  switch (text(paramType).toLowerCase()) {
    case 'telemetry':
    case 'tel':
      return 'telemetry'
    case 'attribute':
    case 'attributes':
    case 'attr':
      return 'attribute'
    case 'event':
    case 'evt':
      return 'event'
    case 'status':
      return 'status'
    default:
      return null
  }
}

/**
 * 一条旧触发条件 → 新条件。
 *
 * 这里和 `automation/legacy/automation.go` 的 buildCondition 逐条对应：
 * 时间范围属于排程、状态「全部」表示任意上下线、事件字段级匹配需要按字段重建，
 * 这三种在新模型里都不是「条件」，所以报出来而不是硬塞。
 */
function buildCondition(
  raw: LegacyCondition,
  index: number,
  groupIndex: number
): { condition?: Condition; issue?: MappingIssue } {
  const field = `trigger_condition_groups[${groupIndex}][${index}]`
  const type = text(raw.trigger_conditions_type)

  if (type === LegacyConditionType.timeRange) {
    return {
      issue: issue(
        field,
        'time_range_needs_schedule',
        '「时间范围」在新模型里属于排程，不是触发条件；请到排程里建一条定时规则'
      )
    }
  }
  if (type !== LegacyConditionType.singleDevice && type !== LegacyConditionType.deviceConfig) {
    return { issue: issue(field, 'unknown_condition_type', `触发条件类型 ${type} 无法识别`) }
  }

  const source = text(raw.trigger_source)
  if (!source) {
    return { issue: issue(field, 'condition_source_missing', '触发条件没有选择设备或设备类型') }
  }

  const signal = conditionSignal(raw.trigger_param_type)
  if (!signal) {
    return { issue: issue(field, 'condition_signal_unknown', '触发条件的参数类型无法识别') }
  }

  const base: Condition = {
    source: type === LegacyConditionType.singleDevice ? 'device' : 'self',
    signal,
    key: '',
    operator: '',
    value: ''
  }
  if (base.source === 'device') base.device_id = source

  if (signal === 'status') {
    const state = text(raw.trigger_param).toUpperCase()
    if (state === 'ON-LINE' || state === 'ONLINE') {
      base.key = 'online'
      base.operator = '='
      base.value = '1'
      return { condition: base }
    }
    if (state === 'OFF-LINE' || state === 'OFFLINE') {
      base.key = 'online'
      base.operator = '='
      base.value = '0'
      return { condition: base }
    }
    return {
      issue: issue(
        field,
        'status_any_transition_unsupported',
        '状态条件用的是「全部」，也就是任意上下线都算；新模型没有这个条件，请改成明确的「在线」或「离线」'
      )
    }
  }

  if (signal === 'event') {
    const value = text(raw.trigger_value)
    if (value.startsWith('{')) {
      return {
        issue: issue(
          field,
          'event_field_match_unsupported',
          '这个事件条件按事件里的字段做匹配，新模型需要按字段重建，页面暂不支持'
        )
      }
    }
    if (!text(raw.trigger_param)) {
      return { issue: issue(field, 'condition_param_missing', '事件条件没有选择事件') }
    }
    base.key = text(raw.trigger_param)
    base.operator = '='
    base.value = value
    return { condition: base }
  }

  if (!text(raw.trigger_param)) {
    return { issue: issue(field, 'condition_param_missing', '触发条件没有选择数据/属性') }
  }
  const operator = text(raw.trigger_operator) || '='
  if (!['=', '!=', '>', '<', '>=', '<=', 'between', 'in', 'exists'].includes(operator)) {
    return { issue: issue(field, 'operator_unsupported', `比较符「${operator}」新模型不支持`) }
  }
  base.key = text(raw.trigger_param)
  base.operator = operator
  base.value = text(raw.trigger_value)
  return { condition: base }
}

function buildSteps(
  actions: LegacyAction[],
  fieldPrefix: string
): { steps: Step[]; deviceIDs: string[]; configIDs: string[]; issues: MappingIssue[] } {
  const steps: Step[] = []
  const deviceIDs: string[] = []
  const configIDs: string[] = []
  const issues: MappingIssue[] = []

  actions.forEach((action, index) => {
    const field = `${fieldPrefix}[${index}]`
    const target = text(action.action_target)

    switch (text(action.action_type)) {
      case LegacyActionType.singleDevice:
      case LegacyActionType.deviceConfig: {
        const kind = normaliseActionKind(action.action_param_type)
        if (!target || !text(action.action_param) || !kind) {
          issues.push(issue(field, 'action_incomplete', `第 ${index + 1} 个动作填写不完整`))
          return
        }
        const isConfig = text(action.action_type) === LegacyActionType.deviceConfig
        if (isConfig) configIDs.push(target)
        else deviceIDs.push(target)
        steps.push({
          kind: 'action',
          device_ref: isConfig ? CONFIG_FANOUT_REF : target,
          action: kind,
          identifier: text(action.action_param),
          value: legacyActionValue(action),
          ...(action.continue_on_failure ? { continue_on_failure: true } : {})
        })
        return
      }
      case LegacyActionType.activateScene:
        if (!target) {
          issues.push(issue(field, 'activate_scene_missing', `第 ${index + 1} 个动作没有选择场景`))
          return
        }
        steps.push({ kind: 'activate_scene', value: target })
        return
      case LegacyActionType.raiseAlarm:
        if (!target) {
          issues.push(issue(field, 'alarm_policy_missing', `第 ${index + 1} 个动作没有选择告警`))
          return
        }
        steps.push({ kind: 'alarm', alarm_policy_id: target, device_ref: 'target', value: 'qualified' })
        return
      case LegacyActionType.service:
        issues.push(
          issue(
            field,
            'service_action_unsupported',
            `第 ${index + 1} 个动作是「服务」（调用外部接口），本次没有承接方；请改用通知策略或外部执行器`
          )
        )
        return
      default:
        issues.push(issue(field, 'action_type_unknown', `第 ${index + 1} 个动作的类型无法识别`))
    }
  })

  return { steps, deviceIDs, configIDs, issues }
}

/**
 * 联动表单 → 规则定义。
 *
 * 目标集的推导是整个翻译里唯一「不能猜」的地方，规则和后端 applyTargets 一致：
 *
 * - 触发条件全是「单类设备」：目标集就是这个设备类型，条件作用在「自己」身上，
 *   运行按设备隔离。这是旧控制台里「整类设备」的原意。
 * - 触发条件全是「单个设备」：目标集是所有被点名的设备（触发里的 + 动作里的），
 *   条件写死设备 id，动作写死各自的目标。
 * - 两者混用、或多个设备类型：新模型一条规则只能有一个目标集，报错让用户拆。
 */
export function linkageFormToDefinition(form: LinkageForm): MappingResult<RuleDefinition> {
  const issues: MappingIssue[] = []
  const groups: ConditionGroup[] = []
  const conditionDevices: string[] = []
  const conditionConfigs: string[] = []

  form.trigger_condition_groups.forEach((group, groupIndex) => {
    const conditions: Condition[] = []
    group.forEach((raw, index) => {
      const built = buildCondition(raw, index, groupIndex)
      if (built.issue) {
        issues.push(built.issue)
        return
      }
      if (!built.condition) return
      conditions.push(built.condition)
      const type = text(raw.trigger_conditions_type)
      if (type === LegacyConditionType.deviceConfig) conditionConfigs.push(text(raw.trigger_source))
      else conditionDevices.push(text(raw.trigger_source))
    })
    // 整组都转不了就不留空组：空组会被当成「无条件通过」。
    if (conditions.length > 0) groups.push({ conditions })
  })

  if (groups.length === 0 && issues.length === 0) {
    issues.push(issue('trigger_condition_groups', 'empty_trigger', '联动至少要有一个触发条件'))
  }

  const actionPart = buildSteps(form.actions, 'actions')
  issues.push(...actionPart.issues)
  if (actionPart.steps.length === 0) {
    issues.push(issue('actions', 'empty_steps', '联动至少要有一个动作'))
  }

  const uniqueCondDevices = uniqueSorted(conditionDevices)
  const uniqueCondConfigs = uniqueSorted(conditionConfigs)
  const uniqueActionDevices = uniqueSorted(actionPart.deviceIDs)
  const uniqueActionConfigs = uniqueSorted(actionPart.configIDs)

  let targets: RuleDefinition['targets'] = {}
  let scope: RuleDefinition['scope'] = 'device'

  if (uniqueCondConfigs.length > 0 && uniqueCondDevices.length > 0) {
    issues.push(
      issue(
        'trigger_condition_groups',
        'mixed_trigger_sources',
        '触发条件同时用了「单个设备」和「单类设备」。新模型里这是两种目标集，不能放进同一条联动，请拆开'
      )
    )
  } else if (uniqueCondConfigs.length > 1) {
    issues.push(
      issue(
        'trigger_condition_groups',
        'multiple_config_triggers',
        `触发条件引用了 ${uniqueCondConfigs.length} 个设备类型，一条联动只能有一个目标集`
      )
    )
  } else if (uniqueCondConfigs.length === 1) {
    const only = uniqueCondConfigs[0]
    const mismatched = uniqueActionConfigs.filter(id => id !== only)
    if (mismatched.length > 0) {
      issues.push(
        issue(
          'actions',
          'action_config_differs_from_trigger',
          '动作作用的设备类型和触发条件的设备类型不是同一个；新模型里「整类设备动作」就是这条联动的目标集，两者必须一致'
        )
      )
    }
    if (uniqueActionDevices.length > 0) {
      issues.push(
        issue(
          'actions',
          'action_device_needs_config_trigger',
          '触发条件是整类设备，动作却点名了单台设备。请把动作也改成整类设备，或把触发条件改成单台设备'
        )
      )
    }
    targets = { device_config_ids: [only] }
    // 整类设备触发：一条规则，每台设备各自判定、各自执行。
    scope = 'device'
  } else {
    if (uniqueActionConfigs.length > 0) {
      issues.push(
        issue(
          'actions',
          'action_config_needs_config_trigger',
          '动作作用在整类设备上，但触发条件是单个设备。新模型里整类设备动作需要一个目标集，请改用设备类型触发'
        )
      )
    }
    targets = { device_ids: uniqueSorted([...uniqueCondDevices, ...uniqueActionDevices]) }
    // 条件点名了具体设备：整条联动只跑一次，不按设备拆。
    scope = 'rule'
  }

  return {
    value: {
      kind: 'automation',
      mode: 'single',
      scope,
      ...(text(form.description) ? { description: text(form.description) } : {}),
      trigger: { groups, for: '0s' },
      freshness: { ...FRESHNESS },
      targets,
      steps: actionPart.steps
    } as RuleDefinition,
    issues
  }
}

/** 规则定义 → 联动表单，用于编辑页回显。 */
export function definitionToLinkageForm(
  definition: RuleDefinition,
  name: string,
  enabled: boolean,
  id = ''
): LinkageForm {
  const configID = definition.targets?.device_config_ids?.[0] ?? ''
  const groups: LegacyCondition[][] = (definition.trigger?.groups ?? []).map(group =>
    (group.conditions ?? []).map(condition => {
      const raw: LegacyCondition = {
        trigger_conditions_type:
          condition.source === 'self' ? LegacyConditionType.deviceConfig : LegacyConditionType.singleDevice,
        trigger_source: condition.source === 'self' ? configID : text(condition.device_id),
        trigger_param_type: condition.signal,
        trigger_param: condition.key,
        trigger_operator: condition.operator,
        trigger_value: condition.value
      }
      if (condition.signal === 'status') {
        raw.trigger_param = condition.value === '1' ? 'ON-LINE' : 'OFF-LINE'
        raw.trigger_param_type = 'status'
        raw.trigger_operator = null
        raw.trigger_value = null
      }
      return raw
    })
  )

  const actions: LegacyAction[] = (definition.steps ?? []).flatMap(step => {
    if (step.kind === 'action') {
      const isConfig = step.device_ref === CONFIG_FANOUT_REF || (!step.device_ref && !!configID)
      const action: LegacyAction = {
        action_type: isConfig ? LegacyActionType.deviceConfig : LegacyActionType.singleDevice,
        action_target: isConfig ? configID : text(step.device_ref),
        action_param_type: step.action ?? 'telemetry',
        action_param: step.identifier ?? '',
        action_value: ''
      }
      action.action_value = encodeLegacyActionValue(action, step.value ?? '')
      if (step.continue_on_failure) action.continue_on_failure = true
      return [action]
    }
    if (step.kind === 'activate_scene') {
      return [
        {
          action_type: LegacyActionType.activateScene,
          action_target: text(step.value),
          action_param_type: null,
          action_param: null,
          action_value: null
        }
      ]
    }
    if (step.kind === 'alarm') {
      return [
        {
          action_type: LegacyActionType.raiseAlarm,
          action_target: text(step.alarm_policy_id),
          action_param_type: null,
          action_param: null,
          action_value: null
        }
      ]
    }
    return []
  })

  return {
    id,
    name,
    description: definition.description ?? '',
    enabled: enabled ? 'Y' : 'N',
    trigger_condition_groups: groups,
    actions
  }
}

/** 这条联动里是否有旧表单表达不了的步骤或条件。 */
export function linkageBeyondForm(definition: RuleDefinition): string[] {
  const extra: string[] = []
  ;(definition.steps ?? []).forEach((step, index) => {
    if (step.kind === 'action' || step.kind === 'activate_scene' || step.kind === 'alarm') return
    extra.push(`第 ${index + 1} 步（${step.kind}）`)
  })
  if (definition.recovery) extra.push('恢复条件')
  if ((definition.trigger?.for ?? '') !== '' && definition.trigger.for !== '0s') {
    extra.push(`持续时间（${definition.trigger.for}）`)
  }
  return extra
}
