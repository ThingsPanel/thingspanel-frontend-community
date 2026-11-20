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
    if (!Array.isArray(parsed?.reasons)) return ''
    const labels: Record<string, string> = { temperature: '温度', humidity: '湿度' }
    return parsed.reasons
      .filter((reason: unknown) => reason && typeof reason === 'object')
      .map((reason: { key?: string; actual?: string | number; expected?: string; message?: string }) => {
        const key = reason.key || '条件'
        const parts: string[] = []
        if (reason.actual != null) parts.push(`当前值 ${reason.actual}`)
        if (reason.expected) parts.push(`条件 ${reason.expected}`)
        return parts.length ? `${labels[key] || key}：${parts.join('，')}` : reason.message || ''
      })
      .filter(Boolean)
      .join('；')
  } catch {
    return /^[{[]/.test(value.trimStart()) ? '' : value
  }
}
