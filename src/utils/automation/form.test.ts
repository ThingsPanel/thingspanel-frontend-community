import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { RuleDefinition } from '@/service/api/automation-rules'
import { changeFormKind, definitionToForm, emptyForm, formToDefinition, mergeDefinition, validateForm } from './form'

function validAlarmForm() {
  const form = emptyForm({ kind: 'alarm_policy', deviceID: 'device-1' })
  form.name = 'High temperature'
  form.groups[0].conditions[0] = {
    source: 'self',
    device_id: '',
    signal: 'telemetry',
    key: 'temperature',
    operator: '>',
    value: '80',
    unit: '°C'
  }
  return form
}

test('new alarm policies default to detector source, optional rule-id key, level, and no action steps', () => {
  const form = validAlarmForm()
  const definition = formToDefinition(form)
  assert.equal(form.alarmLevel, 'M')
  assert.deepEqual(definition.alarm, { sources: ['detector'], level: 'M' })
  assert.deepEqual(definition.steps, [])
  assert.ok(!validateForm(form).some(issue => issue.field === 'definition.steps'))
})

test('editing event policies preserves source whitelist and every unowned alarm field', () => {
  const original: RuleDefinition = {
    kind: 'alarm_policy',
    mode: 'single',
    scope: 'device',
    trigger: {
      groups: [
        { conditions: [{ source: 'self', signal: 'telemetry', key: 'temperature', operator: '>', value: '80' }] }
      ],
      for: '0s'
    },
    freshness: { max_age: '90s', max_gap: '90s' },
    targets: { device_ids: ['device-1'], max_targets: 200 },
    steps: [],
    alarm: {
      key: 'temperature.high',
      sources: ['event'],
      allowed_sources: ['scene:cooling'],
      level: 'H',
      dimension: 'line-a',
      notify_policy_id: 'notify-1',
      extension: { keep: true }
    }
  }
  const form = definitionToForm(original, 'High temperature')
  form.alarmLevel = 'L'
  const updated = mergeDefinition(original, formToDefinition(form))
  assert.deepEqual(updated.alarm, {
    notify_policy_id: 'notify-1',
    extension: { keep: true },
    sources: ['event'],
    key: 'temperature.high',
    level: 'L',
    dimension: 'line-a',
    allowed_sources: ['scene:cooling']
  })
})

test('switching into alarm policy clears action steps and switching back starts with a fresh action', () => {
  const automation = emptyForm()
  automation.steps[0].identifier = 'old-action'
  const alarm = changeFormKind(automation, 'alarm_policy')
  assert.deepEqual(alarm.steps, [])
  assert.deepEqual(formToDefinition(alarm).steps, [])

  const backToAutomation = changeFormKind(alarm, 'automation')
  assert.equal(backToAutomation.steps.length, 1)
  assert.equal(backToAutomation.steps[0].identifier, '')
})

test('changing an alarm policy to another kind does not carry its alarm spec forward', () => {
  const original: RuleDefinition = {
    kind: 'alarm_policy',
    mode: 'single',
    scope: 'device',
    trigger: {
      groups: [{ conditions: [{ source: 'self', signal: 'telemetry', key: 'x', operator: '>', value: '1' }] }],
      for: '0s'
    },
    freshness: { max_age: '90s', max_gap: '90s' },
    targets: { device_ids: ['device-1'], max_targets: 200 },
    steps: [],
    alarm: { sources: ['detector'], level: 'M' }
  }
  const form = changeFormKind(definitionToForm(original), 'automation')
  const updated = mergeDefinition(original, formToDefinition(form))
  assert.equal(updated.kind, 'automation')
  assert.equal(updated.alarm, undefined)
})
