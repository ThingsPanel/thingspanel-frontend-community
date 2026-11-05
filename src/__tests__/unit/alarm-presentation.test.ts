import { describe, expect, it } from 'vitest'
import { alarmLifecycleLabel, canAcknowledgeAlarm, formatAlarmEvidence } from '@/utils/alarm-presentation'
describe('alarm lifecycle presentation', () => {
  it('keeps severity separate from lifecycle and confirmation', () => {
    expect(alarmLifecycleLabel({ state: 'active' })).toBe('未确认 · 未恢复')
    expect(alarmLifecycleLabel({ state: 'active', acked_at: '2026-11-05' })).toBe('已确认 · 未恢复')
    expect(alarmLifecycleLabel({ state: 'cleared' })).toBe('已恢复')
    expect(canAcknowledgeAlarm({ state: 'active' })).toBe(true)
    expect(canAcknowledgeAlarm({ state: 'active', acked_at: 'time' })).toBe(false)
    expect(canAcknowledgeAlarm({ state: 'cleared' })).toBe(false)
  })
  it('formats condition evidence without losing zero or plain descriptions', () => {
    expect(
      formatAlarmEvidence(JSON.stringify({ reasons: [{ key: 'temperature', actual: 0, expected: '> 30' }] }))
    ).toBe('temperature：当前值 0，条件 > 30')
    expect(formatAlarmEvidence('普通说明')).toBe('普通说明')
  })
})
