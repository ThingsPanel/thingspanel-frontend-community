export interface DiagnosticMetricView {
  rate: string
  counts: string
  pending: number | null
}

export function diagnosticMetricView(value: unknown): DiagnosticMetricView {
  const missing = { rate: '--', counts: '--', pending: null }
  if (!value || typeof value !== 'object') return missing
  const row = value as Record<string, unknown>
  const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
  if (!count(row.total) || !count(row.success) || row.success > row.total) return missing
  if (row.failed !== undefined && (!count(row.failed) || row.failed + row.success > row.total)) return missing
  if (row.pending !== undefined && (!count(row.pending) || row.pending + row.success > row.total)) return missing
  if (count(row.failed) && count(row.pending) && row.failed + row.pending + row.success !== row.total) return missing
  return {
    rate: row.total === 0 ? '--' : `${((row.success / row.total) * 100).toFixed(1)}%`,
    counts: `${row.success}/${row.total}`,
    pending: count(row.pending) ? row.pending : null
  }
}

export function emptyDiagnosticMetrics() {
  return {
    uplink: diagnosticMetricView(null),
    downlink: diagnosticMetricView(null),
    storage: diagnosticMetricView(null)
  }
}
