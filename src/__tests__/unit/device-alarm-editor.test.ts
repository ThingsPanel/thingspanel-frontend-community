import { describe, expect, it } from 'vitest'
import { newAlarmTrigger, newDeviceAlarm } from '@/utils/automation/device-alarm'

describe('new detector rule', () => {
  it.each([
    ['device', '', 'device_ids'],
    ['', 'template', 'device_config_ids']
  ] as const)('retains both detector scope and target budget for %s %s', (device, template, key) => {
    const rule = newDeviceAlarm(device, template)
    expect(rule.trigger_scope?.[key]).toEqual([device || template])
    expect(rule.targets[key]).toEqual(rule.trigger_scope?.[key])
    expect(rule.targets.max_targets).toBeGreaterThan(0)
    expect(rule.steps).toEqual([])
    expect(rule.alarm?.sources).toEqual(['detector'])
  })
  it('keeps recovery conditions independent of the trigger', () => {
    const rule = newDeviceAlarm('device', '')
    rule.recovery = newAlarmTrigger()
    rule.recovery.groups[0].conditions[0].value = '30'
    expect(rule.trigger.groups[0].conditions[0].value).toBe('')
  })
})
