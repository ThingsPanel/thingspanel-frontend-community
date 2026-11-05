export function alarmLifecycleLabel(row: { state?: string; acked_at?: string | null }) {
  if (row.state === 'active') return row.acked_at ? '已确认 · 未恢复' : '未确认 · 未恢复'
  return ({ cleared: '已恢复', acked: '已确认' } as Record<string, string>)[row.state || ''] || ''
}
export function canAcknowledgeAlarm(row: { state?: string; acked_at?: string | null }) {
  return row.state === 'active' && !row.acked_at
}
export function formatAlarmEvidence(value: string | undefined) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed.reasons))
      return parsed.reasons
        .map(
          (item: any) =>
            `${item.key || '条件'}：当前值 ${item.actual ?? '--'}，条件 ${item.expected || item.message || '--'}`
        )
        .join('；')
  } catch {
    /* Plain descriptions remain readable. */
  }
  return value
}
