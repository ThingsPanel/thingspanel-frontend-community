import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addWarningMessage, alarmHistory, editInfo } from '@/service/api/alarm-native'

const { createRule, updateRule, getRule, listAlarms, listRules } = vi.hoisted(() => ({
  createRule: vi.fn(),
  updateRule: vi.fn(),
  getRule: vi.fn(),
  listAlarms: vi.fn(),
  listRules: vi.fn()
}))
vi.mock('@/service/api/automation-rules', () => ({
  AutomationApiError: class extends Error {},
  createRule,
  updateRule,
  getRule,
  deleteRule: vi.fn(),
  listAlarms,
  listRules,
  ackAlarm: vi.fn(),
  setRuleEnabled: vi.fn()
}))
vi.mock('@/service/api/notification', () => ({ getNotificationGroupList: vi.fn() }))

describe('alarm notification selection', () => {
  beforeEach(() => {
    createRule.mockReset().mockResolvedValue({ id: 'rule-a' })
    updateRule.mockReset().mockResolvedValue({ id: 'rule-a' })
    getRule.mockReset()
    listAlarms.mockReset().mockResolvedValue({ alarms: [], total: 0 })
    listRules.mockReset().mockResolvedValue({ rules: [] })
  })

  it('stores default intent instead of silently omitting notification', async () => {
    await addWarningMessage({ name: 'Alarm', alarm_level: 'H', notification_group_id: '' })
    const definition = createRule.mock.calls[0][0].definition
    expect(definition.alarm.notify_use_default).toBe(true)
    expect(definition.trigger.for).toBe('0s')
    expect(definition.steps).toEqual([]) // Alarm transitions own delivery, not run steps.
  })

  it('keeps an explicit community alias distinct from a native group ID', async () => {
    await addWarningMessage({ name: 'Alarm', alarm_level: 'H', notification_group_id: 'alias-a' })
    expect(createRule.mock.calls[0][0].definition.alarm).toMatchObject({
      notify_use_default: false,
      notify_alias_id: 'alias-a'
    })
  })

  it('editing keeps the business key and the explicit unavailable selection', async () => {
    getRule.mockResolvedValue({
      id: 'rule-a',
      name: 'Alarm',
      version: 4,
      definition: { alarm: { key: 'stable', level: 'H' } }
    })
    await editInfo({ id: 'rule-a', name: 'Updated', notification_group_id: 'retired-alias' })
    expect(updateRule.mock.calls[0][1].definition.alarm).toMatchObject({
      key: 'stable',
      notify_alias_id: 'retired-alias',
      notify_use_default: false
    })
  })

  it('returns failure when creating the rule is rejected', async () => {
    createRule.mockRejectedValue(new Error('rejected'))
    const result = await addWarningMessage({ name: 'Alarm', alarm_level: 'H' })
    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
  })

  it('editing metadata preserves detector conditions, recovery, targets and execution settings', async () => {
    const condition = {
      source: 'device',
      device_id: 'device-a',
      signal: 'telemetry',
      key: 'temperature',
      operator: '>',
      value: '35'
    }
    const definition = {
      kind: 'alarm_policy',
      mode: 'single',
      scope: 'device',
      description: 'Before',
      trigger: { groups: [{ conditions: [condition] }], for: '10s' },
      recovery: { groups: [{ conditions: [{ ...condition, operator: '<', value: '30' }] }], for: '5s' },
      freshness: { max_age: '90s', max_gap: '90s' },
      targets: { device_ids: ['device-a'], max_targets: 1 },
      steps: [],
      budget: { max_steps: 32 },
      alarm: {
        key: 'stable-detector',
        sources: ['detector'],
        level: 'H',
        notify_alias_id: 'alias-a',
        notify_use_default: false
      }
    }
    const original = structuredClone(definition)
    getRule.mockResolvedValue({ id: 'rule-a', name: 'Alarm', version: 7, enabled: false, definition })

    await editInfo({ id: 'rule-a', name: 'Renamed', description: 'After', alarm_level: 'M' })

    expect(updateRule).toHaveBeenCalledWith('rule-a', {
      name: 'Renamed',
      version: 7,
      definition: { ...original, description: 'After', alarm: { ...original.alarm, level: 'M' } }
    })
    expect(definition).toEqual(original)

    await editInfo({ id: 'rule-a', name: 'Alarm', notification_group_id: '' })
    expect(updateRule.mock.lastCall?.[1].definition).toEqual({
      ...original,
      alarm: { ...original.alarm, notify_alias_id: undefined, notify_use_default: true }
    })
  })

  it('passes filters and pagination to the owner and preserves the full matching total', async () => {
    const alarms = [
      ['start', '2026-10-30T00:00:00Z', 'H'],
      ['end', '2026-10-30T02:00:00Z', 'H']
    ].map(([id, opened_at, level]) => ({ id, opened_at, level, policy_id: 'policy-1' }))
    listAlarms.mockResolvedValue({ alarms, total: 12 })
    const result = await alarmHistory({
      start_time: '2026-10-30T08:00:00+08:00',
      end_time: '2026-10-30T10:00:00+08:00',
      alarm_status: 'H',
      page: 2,
      page_size: 10
    })
    expect(result.error).toBeNull()
    expect(result.data.list.map((row: { id: string }) => row.id)).toEqual(['start', 'end'])
    expect(result.data.total).toBe(12)
    expect(listAlarms).toHaveBeenLastCalledWith({
      limit: 10,
      offset: 10,
      level: 'H',
      start_time: '2026-10-30T08:00:00+08:00',
      end_time: '2026-10-30T10:00:00+08:00'
    })
    listAlarms.mockResolvedValue({ alarms: [], total: 12 })
    const beyond = await alarmHistory({ page: 3, page_size: 10 })
    expect(beyond.data.list).toEqual([])
    expect(beyond.data.total).toBe(12)
  })
})
