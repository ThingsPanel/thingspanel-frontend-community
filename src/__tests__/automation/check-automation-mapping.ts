/**
 * 旧表单 ⇄ 新规则定义 的翻译自检。
 *
 * 运行：npx tsx src/__tests__/automation/check-automation-mapping.ts
 *      （或 npm run check:automation-mapping）
 *
 * 这些断言和后端 `automation/legacy/*.go` 的用例一一对应。两边必须同时绿：
 * 升级脚本搬过来的规则和页面上新建的规则，必须是同一种东西。
 */
import assert from 'node:assert/strict'
import {
  definitionToLinkageForm,
  definitionToSceneForm,
  linkageFormToDefinition,
  sceneFormToDefinition
} from '../../service/api/automation-legacy-mapping'
import type { LegacyAction, LinkageForm, SceneForm } from '../../service/api/automation-legacy-mapping'

let passed = 0
const failures: string[] = []

function check(name: string, fn: () => void) {
  try {
    fn()
    passed += 1
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`)
  }
}

function deviceAction(target: string, param: string, value: string, kind = 'telemetry'): LegacyAction {
  return {
    action_type: '10',
    action_target: target,
    action_param_type: kind,
    action_param: param,
    action_value: JSON.stringify({ [param]: value })
  }
}

function configAction(target: string, param: string, value: string): LegacyAction {
  return { ...deviceAction(target, param, value), action_type: '11' }
}

function condition(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    trigger_conditions_type: '10',
    trigger_source: 'dev-a',
    trigger_param_type: 'telemetry',
    trigger_param: 'temperature',
    trigger_operator: '>',
    trigger_value: '30',
    ...overrides
  } as any
}

// ---------------------------------------------------------------------------
// 场景
// ---------------------------------------------------------------------------

check('场景：无等待必须发送合法的零时长，不能发送空字符串', () => {
  const { value, issues } = sceneFormToDefinition({ name: '零等待', actions: [deviceAction('dev-a', 'switch', '1')] })
  assert.deepEqual(issues, [])
  assert.equal(JSON.parse(JSON.stringify(value)).trigger.for, '0s')
})

check('联动：无等待必须发送合法的零时长，不能发送空字符串', () => {
  const { value, issues } = linkageFormToDefinition({
    name: '零等待',
    trigger_condition_groups: [[condition()]],
    actions: [deviceAction('dev-a', 'switch', '1')]
  })
  assert.deepEqual(issues, [])
  assert.equal(JSON.parse(JSON.stringify(value)).trigger.for, '0s')
})

check('场景：单台设备的动作，目标集就是那台设备', () => {
  const form: SceneForm = { name: '开灯', actions: [deviceAction('dev-1', 'switch', '1')] }
  const { value, issues } = sceneFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.equal(value.kind, 'scene')
  assert.equal(value.scope, 'rule')
  assert.deepEqual(value.targets.device_ids, ['dev-1'])
  assert.deepEqual(value.steps, [
    { kind: 'action', device_ref: 'dev-1', action: 'telemetry', identifier: 'switch', value: '1' }
  ])
})

check('场景：一个场景动两台设备，每步只发给自己那台', () => {
  const form: SceneForm = {
    name: '开阀启泵',
    actions: [deviceAction('dev-a', 'valve', '1'), deviceAction('dev-b', 'pump', '1')]
  }
  const { value, issues } = sceneFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.deepEqual(value.targets.device_ids, ['dev-a', 'dev-b'])
  assert.equal(value.steps[0].device_ref, 'dev-a')
  assert.equal(value.steps[1].device_ref, 'dev-b')
})

check('场景：整类设备的动作变成目标集，不再写死设备 id', () => {
  const form: SceneForm = { name: '全部关灯', actions: [configAction('cfg-1', 'switch', '0')] }
  const { value, issues } = sceneFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.deepEqual(value.targets.device_config_ids, ['cfg-1'])
  assert.equal(value.steps[0].device_ref, 'target')
})

check('场景：单台设备和整类设备混在一个场景里，报错而不是猜', () => {
  const form: SceneForm = {
    name: '混',
    actions: [deviceAction('dev-1', 'switch', '1'), configAction('cfg-1', 'switch', '0')]
  }
  const { issues } = sceneFormToDefinition(form)
  assert.ok(issues.some(item => item.code === 'mixed_device_and_config_actions'))
})

check('场景：命令的值从 {method, params} 里取出来', () => {
  const action: LegacyAction = {
    action_type: '10',
    action_target: 'dev-1',
    action_param_type: 'command',
    action_param: 'ReSet',
    action_value: JSON.stringify({ method: 'ReSet', params: '{"switch":1}' })
  }
  const { value } = sceneFormToDefinition({ name: '命令', actions: [action] })
  assert.equal(value.steps[0].action, 'command')
  assert.equal(value.steps[0].identifier, 'ReSet')
  assert.equal(value.steps[0].value, '{"switch":1}')
})

check('场景：服务型动作没有承接方，报错', () => {
  const action: LegacyAction = { action_type: '40', action_target: 'svc-1' }
  const { issues } = sceneFormToDefinition({ name: '服务', actions: [action] })
  assert.ok(issues.some(item => item.code === 'service_action_unsupported'))
})

check('场景：没有动作、没有目标都要报出来', () => {
  const { issues } = sceneFormToDefinition({ name: '空', actions: [] })
  assert.ok(issues.some(item => item.code === 'empty_steps'))
  assert.ok(issues.some(item => item.code === 'no_targets'))
})

check('场景：表单 → 定义 → 表单，值和标识符都还在', () => {
  const form: SceneForm = {
    name: '开灯',
    description: '检修时用',
    actions: [deviceAction('dev-1', 'switch', '1'), deviceAction('dev-1', 'mode', 'auto', 'attributes')]
  }
  const first = sceneFormToDefinition(form)
  assert.deepEqual(first.issues, [])
  const back = definitionToSceneForm(first.value, form.name ?? '')
  assert.equal(back.description, '检修时用')
  assert.equal(back.actions.length, 2)
  assert.equal(back.actions[0].action_target, 'dev-1')
  assert.equal(back.actions[0].action_param, 'switch')
  assert.equal(back.actions[0].action_value, JSON.stringify({ switch: '1' }))
  assert.equal(back.actions[1].action_param_type, 'attribute')

  const second = sceneFormToDefinition(back)
  assert.deepEqual(second.value.steps, first.value.steps)
})

// ---------------------------------------------------------------------------
// 联动
// ---------------------------------------------------------------------------

check('联动：组内与、组间或，顺序不重排', () => {
  const form: LinkageForm = {
    name: '联动',
    trigger_condition_groups: [
      [condition(), condition({ trigger_param: 'humidity', trigger_operator: '>=', trigger_value: '60' })],
      [condition({ trigger_source: 'dev-b', trigger_param: 'smoke', trigger_value: '1' })]
    ],
    actions: [deviceAction('dev-c', 'switch', '1')]
  }
  const { value, issues } = linkageFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.equal(value.trigger.groups.length, 2)
  assert.equal(value.trigger.groups[0].conditions.length, 2)
  assert.equal(value.trigger.groups[0].conditions[0].key, 'temperature')
  assert.equal(value.trigger.groups[0].conditions[1].operator, '>=')
  assert.equal(value.trigger.groups[1].conditions[0].device_id, 'dev-b')
})

check('联动：单个设备触发，条件写死设备，动作写死目标，整条只跑一次', () => {
  const form: LinkageForm = {
    name: '联动',
    trigger_condition_groups: [[condition()]],
    actions: [deviceAction('dev-b', 'switch', '1')]
  }
  const { value, issues } = linkageFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.equal(value.scope, 'rule')
  assert.equal(value.trigger.groups[0].conditions[0].source, 'device')
  assert.equal(value.trigger.groups[0].conditions[0].device_id, 'dev-a')
  assert.deepEqual(value.targets.device_ids, ['dev-a', 'dev-b'])
  assert.equal(value.steps[0].device_ref, 'dev-b')
})

check('联动：整类设备触发，条件作用在自己身上，按设备隔离', () => {
  const form: LinkageForm = {
    name: '整类',
    trigger_condition_groups: [[condition({ trigger_conditions_type: '11', trigger_source: 'cfg-1' })]],
    actions: [configAction('cfg-1', 'switch', '1')]
  }
  const { value, issues } = linkageFormToDefinition(form)
  assert.deepEqual(issues, [])
  assert.equal(value.scope, 'device')
  assert.deepEqual(value.targets.device_config_ids, ['cfg-1'])
  assert.equal(value.trigger.groups[0].conditions[0].source, 'self')
  assert.equal(value.steps[0].device_ref, 'target')
})

check('联动：整类设备触发却点名单台设备，报错', () => {
  const form: LinkageForm = {
    name: '错配',
    trigger_condition_groups: [[condition({ trigger_conditions_type: '11', trigger_source: 'cfg-1' })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  }
  const { issues } = linkageFormToDefinition(form)
  assert.ok(issues.some(item => item.code === 'action_device_needs_config_trigger'))
})

check('联动：单个设备和整类设备混在触发里，报错', () => {
  const form: LinkageForm = {
    name: '混',
    trigger_condition_groups: [[condition(), condition({ trigger_conditions_type: '11', trigger_source: 'cfg-1' })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  }
  const { issues } = linkageFormToDefinition(form)
  assert.ok(issues.some(item => item.code === 'mixed_trigger_sources'))
})

check('联动：时间范围属于排程，报错并说清楚去哪建', () => {
  const form: LinkageForm = {
    name: '时间段',
    trigger_condition_groups: [
      [condition({ trigger_conditions_type: '22', trigger_value: '1234567|08:00:00+08:00|18:00:00+08:00' })]
    ],
    actions: [deviceAction('dev-1', 'switch', '1')]
  }
  const { issues } = linkageFormToDefinition(form)
  const found = issues.find(item => item.code === 'time_range_needs_schedule')
  assert.ok(found)
  assert.ok(found!.message.includes('排程'))
})

check('联动：在线/离线变成 online=1/0，不用旧比较符', () => {
  const online = linkageFormToDefinition({
    name: '上线',
    trigger_condition_groups: [
      [
        condition({
          trigger_param_type: 'status',
          trigger_param: 'ON-LINE',
          trigger_operator: null,
          trigger_value: null
        })
      ]
    ],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.deepEqual(online.issues, [])
  const cond = online.value.trigger.groups[0].conditions[0]
  assert.equal(cond.signal, 'status')
  assert.equal(cond.key, 'online')
  assert.equal(cond.operator, '=')
  assert.equal(cond.value, '1')
})

check('联动：状态「全部」新模型没有，报错', () => {
  const { issues } = linkageFormToDefinition({
    name: '任意变化',
    trigger_condition_groups: [[condition({ trigger_param_type: 'status', trigger_param: 'ALL' })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.ok(issues.some(item => item.code === 'status_any_transition_unsupported'))
})

check('联动：事件按名字触发可以转，按字段匹配不行', () => {
  const plain = linkageFormToDefinition({
    name: '事件',
    trigger_condition_groups: [
      [condition({ trigger_param_type: 'event', trigger_param: 'alarm', trigger_operator: null, trigger_value: '1' })]
    ],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.deepEqual(plain.issues, [])
  assert.equal(plain.value.trigger.groups[0].conditions[0].key, 'alarm')

  const byField = linkageFormToDefinition({
    name: '事件字段',
    trigger_condition_groups: [
      [
        condition({
          trigger_param_type: 'event',
          trigger_param: 'alarm',
          trigger_value: '{"match_mode":"field","conditions":[]}'
        })
      ]
    ],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.ok(byField.issues.some(item => item.code === 'event_field_match_unsupported'))
})

check('联动：比较符留空按旧引擎的行为补成等于', () => {
  const { value, issues } = linkageFormToDefinition({
    name: '空比较符',
    trigger_condition_groups: [[condition({ trigger_operator: null })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.deepEqual(issues, [])
  assert.equal(value.trigger.groups[0].conditions[0].operator, '=')
})

check('联动：区间条件原样保留 min-max', () => {
  const { value } = linkageFormToDefinition({
    name: '区间',
    trigger_condition_groups: [[condition({ trigger_operator: 'between', trigger_value: '10-20' })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.equal(value.trigger.groups[0].conditions[0].operator, 'between')
  assert.equal(value.trigger.groups[0].conditions[0].value, '10-20')
})

check('联动：定义 → 表单 → 定义，条件和动作都稳定', () => {
  const form: LinkageForm = {
    name: '联动',
    description: '说明',
    enabled: 'N',
    trigger_condition_groups: [
      [condition(), condition({ trigger_param: 'humidity', trigger_operator: '<=', trigger_value: '40' })]
    ],
    actions: [deviceAction('dev-b', 'switch', '1')]
  }
  const first = linkageFormToDefinition(form)
  assert.deepEqual(first.issues, [])
  const back = definitionToLinkageForm(first.value, form.name ?? '', false)
  assert.equal(back.description, '说明')
  assert.equal(back.enabled, 'N')
  assert.equal(back.trigger_condition_groups.length, 1)
  assert.equal(back.trigger_condition_groups[0].length, 2)
  assert.equal(back.actions[0].action_target, 'dev-b')

  const second = linkageFormToDefinition(back)
  assert.deepEqual(second.value.trigger, first.value.trigger)
  assert.deepEqual(second.value.steps, first.value.steps)
  assert.deepEqual(second.value.targets, first.value.targets)
})

check('联动：一条触发条件都转不了时不留空组', () => {
  const { value, issues } = linkageFormToDefinition({
    name: '只有时间范围',
    trigger_condition_groups: [[condition({ trigger_conditions_type: '22' })]],
    actions: [deviceAction('dev-1', 'switch', '1')]
  })
  assert.ok(issues.length > 0)
  assert.deepEqual(value.trigger.groups, [])
})

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`automation mapping checks: ${passed} passed, ${failures.length} failed`)
  failures.forEach(failure => console.error('  ✗ ' + failure))
  process.exit(1)
}
console.log(`automation mapping checks: ${passed} passed, 0 failed`)
