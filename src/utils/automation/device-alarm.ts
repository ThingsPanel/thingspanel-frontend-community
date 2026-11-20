import type { Condition, RuleDefinition, Trigger } from '@/service/api/automation-rules'
import { v4 as uuid } from 'uuid'

export function newAlarmCondition(): Condition {
  return { source: 'self', signal: 'telemetry', key: '', operator: '>', value: '' }
}

export function newAlarmTrigger(): Trigger {
  return { groups: [{ conditions: [newAlarmCondition()] }], for: '0s' }
}

export function newDeviceAlarm(deviceId: string, templateId: string): RuleDefinition {
  const scope = { device_ids: deviceId ? [deviceId] : [], device_config_ids: templateId ? [templateId] : [] }
  return {
    kind: 'alarm_policy',
    scope: 'device',
    mode: 'single',
    trigger: newAlarmTrigger(),
    trigger_scope: scope,
    targets: { ...scope, max_targets: deviceId ? 1 : 200 },
    steps: [],
    freshness: { max_age: '90s', max_gap: '90s' },
    alarm: { key: 'alarm-' + uuid(), sources: ['detector'], level: 'M', notify_use_default: false }
  }
}
