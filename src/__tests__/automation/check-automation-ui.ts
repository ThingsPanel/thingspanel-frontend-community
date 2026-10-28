/**
 * Checks for the pure automation UI logic.
 *
 * Run with:  npx tsx src/__tests__/automation/check-automation-ui.ts
 *            (or `npm run check:automation-ui`)
 *
 * This is a plain assertion script rather than a vitest suite because the
 * checked modules must stay free of browser and network dependencies, and
 * because it has to be runnable in an environment where the test runner is not
 * installed. The assertions are the same ones a unit test would make.
 */
import assert from 'node:assert/strict'
import {
  buildTimeline,
  describeMode,
  describeRunStatus,
  describeVerdict,
  durationFromText,
  durationSeconds,
  formatDuration,
  summarizeDefinition,
  toFormFieldErrors
} from '../../utils/automation/summary'
import {
  definitionToForm,
  emptyForm,
  emptyStep,
  formToDefinition,
  issuesToFieldMap,
  mergeDefinition,
  validateForm
} from '../../utils/automation/form'

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

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

check('a five minute hold reads as five minutes', () => {
  assert.equal(formatDuration('5m0s'), '5 分钟')
  assert.equal(formatDuration('300s'), '5 分钟')
  assert.equal(formatDuration('1h30m0s'), '1 小时 30 分钟')
})

check('zero means immediately, not "0 seconds"', () => {
  assert.equal(formatDuration('0s'), '立即')
  assert.equal(durationSeconds('0'), 0)
})

check('what a person types becomes a canonical duration', () => {
  assert.equal(durationFromText('5'), '300s')
  assert.equal(durationFromText('5m'), '300s')
  assert.equal(durationFromText('5分钟'), '300s')
  assert.equal(durationFromText('90秒'), '90s')
  assert.equal(durationFromText('2小时'), '7200s')
  assert.equal(durationFromText('1h30m'), '5400s')
})

check('an unreadable duration is refused instead of guessed', () => {
  assert.equal(durationFromText('五个分钟'), null)
  assert.equal(durationFromText('5 分钟'), '300s')
  assert.equal(durationFromText(''), null)
  assert.equal(durationSeconds('5 minutes'), null)
})

// ---------------------------------------------------------------------------
// Summary sentence
// ---------------------------------------------------------------------------

const thresholdRule = {
  kind: 'automation' as const,
  mode: 'single' as const,
  scope: 'device' as const,
  trigger: {
    groups: [
      {
        conditions: [
          {
            source: 'self' as const,
            signal: 'telemetry' as const,
            key: 'temperature',
            operator: '>',
            value: '30',
            unit: '℃'
          }
        ]
      }
    ],
    for: '5m0s'
  },
  freshness: { max_age: '10m0s', max_gap: '10m0s' },
  targets: { device_ids: ['dev-1'], max_targets: 200 },
  steps: [{ kind: 'action' as const, action: 'telemetry', identifier: 'switch', value: '1' }]
}

check('the summary says what will happen, in one sentence', () => {
  const text = summarizeDefinition(thresholdRule)
  assert.match(text, /temperature 高于 30℃/)
  assert.match(text, /连续满足 5 分钟/)
  assert.match(text, /switch = 1/)
  assert.match(text, /1 台设备/)
})

check('groups are OR-ed and conditions inside a group are AND-ed', () => {
  const text = summarizeDefinition({
    ...thresholdRule,
    trigger: {
      groups: [
        {
          conditions: [
            { source: 'self', signal: 'telemetry', key: 'temperature', operator: '>', value: '30', unit: '℃' },
            { source: 'self', signal: 'telemetry', key: 'humidity', operator: '<', value: '40', unit: '%' }
          ]
        },
        { conditions: [{ source: 'self', signal: 'telemetry', key: 'smoke', operator: '=', value: 'true' }] }
      ],
      for: '0s'
    }
  })
  assert.match(text, /temperature 高于 30℃ 并且 humidity 低于 40%/)
  assert.match(text, /或者 smoke 等于 true/)
  assert.ok(!text.includes('连续满足'), 'a zero hold must not claim a duration')
})

check('a non-default mode is spelled out, the default is not', () => {
  assert.ok(!summarizeDefinition(thresholdRule).includes('重复触发'))
  assert.match(summarizeDefinition({ ...thresholdRule, mode: 'queued' }), /排队/)
  assert.match(describeMode('parallel'), /并行/)
})

check('a manual scene says so instead of pretending to have a condition', () => {
  const text = summarizeDefinition({
    kind: 'scene',
    steps: [{ kind: 'action', action: 'telemetry', identifier: 'switch', value: '1' }]
  })
  assert.match(text, /手动执行/)
})

check('a branch step is described with both arms', () => {
  const text = summarizeDefinition({
    ...thresholdRule,
    steps: [
      {
        kind: 'branch',
        condition: {
          conditions: [{ source: 'self', signal: 'telemetry', key: 'temperature', operator: '>', value: '40' }]
        },
        then: [{ kind: 'action', action: 'command', identifier: 'stop' }],
        else: [{ kind: 'wait', wait: '1m0s' }]
      }
    ]
  })
  assert.match(text, /如果 temperature 高于 40/)
  assert.match(text, /下发命令 stop/)
  assert.match(text, /否则 等待 1 分钟/)
})

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

check('"no data" is not reported as "condition not met"', () => {
  const noData = describeVerdict('no_data')
  const notMet = describeVerdict('condition_not_met')
  assert.notEqual(noData.label, notMet.label)
  assert.match(noData.hint ?? '', /上报|在线/)
  assert.equal(noData.tone, 'warn')
})

check('"undetermined" tells the reader what to check next', () => {
  const described = describeVerdict('undetermined')
  assert.match(described.hint ?? '', /时钟|质量/)
})

check('a partial success is not shown as success', () => {
  assert.equal(describeRunStatus('partial').label, '部分成功')
  assert.equal(describeRunStatus('partial').tone, 'warn')
  assert.equal(describeRunStatus('succeeded').tone, 'ok')
})

check('an unknown dispatch outcome is not shown as a failure', () => {
  const timeline = buildTimeline({
    status: 'failed',
    steps: [{ idx: 0, kind: 'action', status: 'unknown', attempt: 2 }],
    targets: [{ device_id: 'dev-1', selected: true, status: 'unknown' }]
  })
  const step = timeline.find(entry => entry.key === 'step-0')
  assert.ok(step, 'the step must appear in the timeline')
  assert.match(step!.title, /结果未知/)
  assert.match(step!.title, /第 2 次尝试/)
  assert.equal(step!.tone, 'warn')
})

check('an excluded device says why it was excluded', () => {
  const timeline = buildTimeline({
    status: 'succeeded',
    targets: [{ device_id: 'dev-9', selected: false, status: 'skipped', reason_code: 'no_capability' }]
  })
  const entry = timeline.find(item => item.key === 'target-dev-9')
  assert.match(entry!.title, /未选中/)
  assert.match(entry!.detail ?? '', /no_capability/)
})

check('the timeline keeps steps in execution order', () => {
  const timeline = buildTimeline({
    status: 'succeeded',
    steps: [
      { idx: 2, kind: 'notify', status: 'succeeded' },
      { idx: 0, kind: 'action', status: 'succeeded' },
      { idx: 1, kind: 'wait', status: 'succeeded' }
    ]
  })
  const steps = timeline.filter(entry => entry.key.startsWith('step-')).map(entry => entry.key)
  assert.deepEqual(steps, ['step-0', 'step-1', 'step-2'])
})

// ---------------------------------------------------------------------------
// Field errors
// ---------------------------------------------------------------------------

check('server field errors land on the form path the input uses', () => {
  const map = toFormFieldErrors([
    { field: 'trigger.groups', code: 'empty_trigger', message: '至少需要一组触发条件' },
    { field: 'steps[0].identifier', code: 'required', message: '请选择指标' }
  ])
  assert.equal(map['definition.trigger.groups'], '至少需要一组触发条件')
  assert.equal(map['definition.steps[0].identifier'], '请选择指标')
})

check('one field keeps one message', () => {
  const map = toFormFieldErrors([
    { field: 'steps[0].value', code: 'a', message: '第一条' },
    { field: 'steps[0].value', code: 'b', message: '第二条' }
  ])
  assert.equal(Object.keys(map).length, 1)
  assert.equal(map['definition.steps[0].value'], '第一条')
})

// ---------------------------------------------------------------------------
// Form <-> definition round trip
// ---------------------------------------------------------------------------

check('a definition survives a trip through the form unchanged', () => {
  const form = definitionToForm(thresholdRule, '高温提醒', true)
  const back = formToDefinition(form)
  assert.deepEqual(back.trigger.groups, thresholdRule.trigger.groups)
  assert.equal(back.trigger.for, '5m0s')
  assert.deepEqual(back.steps, thresholdRule.steps)
  assert.deepEqual(back.targets.device_ids, ['dev-1'])
})

check('an empty condition row is dropped, not sent as a blank', () => {
  const form = emptyForm()
  form.name = '新规则'
  form.groups[0].conditions.push({
    source: 'self',
    device_id: '',
    signal: 'telemetry',
    key: '',
    operator: '>',
    value: '',
    unit: ''
  })
  const definition = formToDefinition(form)
  assert.equal(definition.trigger.groups.length, 0)
})

check('a branch step keeps its arms through the round trip', () => {
  const form = emptyForm()
  form.name = '分支规则'
  form.groups[0].conditions[0].key = 'temperature'
  form.groups[0].conditions[0].value = '30'
  const branch = emptyStep('branch')
  branch.condition.conditions[0] = { ...branch.condition.conditions[0], key: 'temperature', value: '40' }
  branch.then = [emptyStep('action')]
  branch.then[0].identifier = 'switch'
  branch.then[0].value = '0'
  branch.else = [emptyStep('wait')]
  branch.else[0].wait = '1m'
  form.steps = [branch]
  const definition = formToDefinition(form)
  assert.equal(definition.steps[0].kind, 'branch')
  assert.equal(definition.steps[0].then?.[0].identifier, 'switch')
  assert.equal(definition.steps[0].else?.[0].wait, '60s')
})

check('a wait typed as "1m" is sent as a duration, not as text', () => {
  const form = emptyForm()
  form.name = 'x'
  form.groups[0].conditions[0].key = 'k'
  form.groups[0].conditions[0].value = '1'
  form.steps = [emptyStep('wait')]
  form.steps[0].wait = '1m'
  assert.equal(formToDefinition(form).steps[0].wait, '60s')
})

check('a save keeps the parts of the rule this form does not edit', () => {
  const original = {
    ...thresholdRule,
    params: [{ key: 'limit', type: 'number' as const, default: '30' }],
    queue: { ttl: '2m0s', max_depth: 10 },
    alarm: { key: 'high-temp', sources: ['detector' as const] }
  }
  const edited = formToDefinition(definitionToForm(original, '高温提醒', true))
  const merged = mergeDefinition(original, edited)
  assert.deepEqual(merged.params, original.params, 'parameter slots must survive a save')
  assert.deepEqual(merged.queue, original.queue)
  assert.deepEqual(merged.alarm, original.alarm)
})

check('a new rule has nothing to merge and is sent as typed', () => {
  const form = emptyForm()
  form.name = 'x'
  form.groups[0].conditions[0].key = 'k'
  form.groups[0].conditions[0].value = '1'
  const definition = formToDefinition(form)
  assert.deepEqual(mergeDefinition(null, definition), definition)
})

// ---------------------------------------------------------------------------
// Pre-flight validation
// ---------------------------------------------------------------------------

check('an unnamed rule is refused before the request', () => {
  const issues = validateForm(emptyForm())
  assert.ok(issues.some(issue => issue.field === 'name'))
})

check('a rule with no condition is refused, a scene is not', () => {
  const form = emptyForm()
  form.name = '有名字'
  form.steps[0].identifier = 'switch'
  assert.ok(validateForm(form).some(issue => issue.code === 'empty_trigger'))

  const scene = { ...form, kind: 'scene' as const }
  assert.ok(!validateForm(scene).some(issue => issue.code === 'empty_trigger'))
})

check('a condition without a value points at that input', () => {
  const form = emptyForm()
  form.name = 'x'
  form.groups[0].conditions[0].key = 'temperature'
  form.steps[0].identifier = 'switch'
  const map = issuesToFieldMap(validateForm(form))
  assert.equal(map['definition.trigger.groups[0].conditions[0].value'], '请填写比较值')
})

check('a branch without an action says which arm is empty', () => {
  const form = emptyForm()
  form.name = 'x'
  form.groups[0].conditions[0] = { ...form.groups[0].conditions[0], key: 'k', value: '1' }
  const branch = emptyStep('branch')
  branch.condition.conditions[0] = { ...branch.condition.conditions[0], key: 'k', value: '2' }
  form.steps = [branch]
  const map = issuesToFieldMap(validateForm(form))
  assert.equal(map['definition.steps[0].then'], '分支成立时至少要有一个动作')
})

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`automation UI checks: ${passed} passed, ${failures.length} failed`)
  failures.forEach(failure => console.error('  ✗ ' + failure))
  process.exit(1)
}
console.log(`automation UI checks: ${passed} passed, 0 failed`)
