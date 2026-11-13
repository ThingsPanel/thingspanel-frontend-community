// Exact built-in catalog copy only. Preserve custom or third-party descriptions.
const descriptions: Record<string, string> = {
  'Home Assistant device connector: HA state_changed events become ThingsPanel telemetry, platform commands call HA services.':
    '接入 Home Assistant 设备，同步设备状态，并通过平台下发控制指令。',
  'HTTP device uplink; direct downlink and long polling; devices are created from HTTP templates in ThingsPanel.':
    '通过 HTTP 上报设备数据，支持直接下发和长轮询；使用 HTTP 模板创建设备。'
}
export function catalogDescription(description: string, locale: string): string {
  return locale.toLowerCase().startsWith('zh') ? (descriptions[description] ?? description) : description
}
export function healthLabel(health: string | undefined, locale: string): string {
  const labels: Record<string, [string, string]> = {
    ok: ['正常', 'Healthy'],
    degraded: ['异常', 'Degraded'],
    error: ['故障', 'Error']
  }
  return health ? (labels[health]?.[locale.toLowerCase().startsWith('zh') ? 0 : 1] ?? health) : '—'
}
