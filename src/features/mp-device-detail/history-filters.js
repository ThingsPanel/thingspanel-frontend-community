// Match the web device-history selector: longer ranges require coarser buckets.
export const historyWindows = [
  { value: 'no_aggregate', label: '不聚合', maxHours: 1 },
  { value: '30s', label: '30秒', maxHours: 3 },
  { value: '1m', label: '1分钟', maxHours: 6 },
  { value: '2m', label: '2分钟', maxHours: 12 },
  { value: '5m', label: '5分钟', maxHours: 24 },
  { value: '10m', label: '10分钟', maxHours: 72 },
  { value: '30m', label: '30分钟', maxHours: 168 },
  { value: '1h', label: '1小时', maxHours: 360 },
  { value: '3h', label: '3小时', maxHours: 720 },
  { value: '6h', label: '6小时', maxHours: 1440 },
  { value: '1d', label: '1天', maxHours: 2160 },
  { value: '7d', label: '7天', maxHours: 4320 },
  { value: '1mo', label: '1个月', maxHours: Infinity }
]

export function historyWindowOptions(durationMs) {
  const hours = durationMs / 3600000
  const minimum = Number.isFinite(hours) && hours > 0
    ? historyWindows.findIndex(option => hours <= option.maxHours)
    : 0
  return historyWindows.map((option, index) => ({ ...option, disabled: index < minimum }))
}

export function resolveHistoryWindow(durationMs, requested) {
  const options = historyWindowOptions(durationMs)
  return options.find(option => option.value === requested && !option.disabled)?.value
    || options.find(option => !option.disabled).value
}
