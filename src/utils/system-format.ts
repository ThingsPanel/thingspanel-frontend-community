export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`
}
