import type { Device } from '@/service/api/device-native'

export interface DeviceListSummary {
  runtimeSummary?: {
    connectivity: 'online' | 'offline' | 'unknown'
    observedAt: string | null
    lastTelemetryAt: string | null
    available: boolean
  } | null
  alarmSummary?: {
    state: 'active' | 'none' | 'unknown'
    activeCount: number | null
    observedAt: string | null
    available: boolean
  } | null
}

/** Keep unknown/unavailable distinct from an observed offline or no-alarm result. */
export function deviceListRow(device: Device & DeviceListSummary) {
  const runtime = device.runtimeSummary
  const alarm = device.alarmSummary
  const timestamp = runtime?.available ? runtime.lastTelemetryAt : null
  const validTimestamp = typeof timestamp === 'string' && Number.isFinite(Date.parse(timestamp))
  return {
    ...device,
    device_number: device.deviceNumber,
    device_type: device.deviceKind === 'standalone' ? '1' : device.deviceKind === 'gateway' ? '2' : '3',
    device_config_id: device.templateId ?? '',
    runtime_available: runtime?.available === true,
    alarm_available: alarm?.available === true,
    telemetry_available: runtime?.available === true && (timestamp === null || validTimestamp),
    is_online:
      runtime?.available && runtime.connectivity === 'online'
        ? 1
        : runtime?.available && runtime.connectivity === 'offline'
          ? 0
          : undefined,
    warn_status:
      alarm?.available && alarm.state === 'active' ? 'Y' : alarm?.available && alarm.state === 'none' ? 'N' : undefined,
    ts: validTimestamp ? timestamp : null
  }
}

export function connectivityLabel(row: { is_online?: number; runtime_available?: boolean }) {
  if (row.is_online === 1) return 'custom.devicePage.online'
  if (row.is_online === 0) return 'custom.devicePage.offline'
  return row.runtime_available ? 'custom.devicePage.connectivityUnknown' : 'custom.devicePage.summaryUnavailable'
}

export function alarmLabel(row: { warn_status?: string; alarm_available?: boolean }) {
  if (row.warn_status === 'Y') return 'custom.devicePage.alarmed'
  if (row.warn_status === 'N') return 'custom.devicePage.notAlarmed'
  return row.alarm_available ? 'custom.devicePage.alarmStateUnknown' : 'custom.devicePage.summaryUnavailable'
}

export function absentTelemetryLabel(row: { runtime_available?: boolean; telemetry_available?: boolean }) {
  return (row.telemetry_available ?? row.runtime_available)
    ? 'custom.devicePage.noTelemetryReported'
    : 'custom.devicePage.summaryUnavailable'
}
