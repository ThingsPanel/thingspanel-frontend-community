import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addWarningMessage, editInfo } from '@/service/api/alarm-native'

const { createRule, updateRule, getRule } = vi.hoisted(() => ({
  createRule: vi.fn(),
  updateRule: vi.fn(),
  getRule: vi.fn()
}))
vi.mock('@/service/api/automation-rules', () => ({
  AutomationApiError: class extends Error {},
  createRule,
  updateRule,
  getRule,
  deleteRule: vi.fn(),
  listAlarms: vi.fn(),
  listRules: vi.fn(),
  ackAlarm: vi.fn(),
  setRuleEnabled: vi.fn()
}))
vi.mock('@/service/api/notification', () => ({ getNotificationGroupList: vi.fn() }))

describe('alarm notification selection', () => {
  beforeEach(() => {
    createRule.mockReset().mockResolvedValue({ id: 'rule-a' })
    updateRule.mockReset().mockResolvedValue({ id: 'rule-a' })
    getRule.mockReset()
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
})
