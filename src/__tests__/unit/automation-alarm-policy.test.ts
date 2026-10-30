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
    listAlarms.mockReset().mockResolvedValue({ alarms: [] })
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

  it('filters alarm instants across timezones with inclusive boundaries and the selected level', async () => {
    const alarms = [
      ['before', '2026-10-29T23:59:59Z', 'H'],
      ['start', '2026-10-30T00:00:00Z', 'H'],
      ['other-level', '2026-10-30T09:00:00+08:00', 'M'],
      ['end', '2026-10-30T02:00:00Z', 'H'],
      ['after', '2026-10-30T02:00:01Z', 'H']
    ].map(([id, opened_at, level]) => ({ id, opened_at, level, policy_id: 'policy-1' }))
    listAlarms.mockResolvedValue({ alarms })
    const result = await alarmHistory({
      start_time: '2026-10-30T08:00:00+08:00',
      end_time: '2026-10-30T10:00:00+08:00',
      alarm_status: 'H'
    })
    expect(result.error).toBeNull()
    expect(result.data.list.map((row: { id: string }) => row.id)).toEqual(['start', 'end'])
    expect(result.data.total).toBe(2)
    const reset = await alarmHistory({})
    expect(reset.data.total).toBe(5)
  })
})
