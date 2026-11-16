import { describe, expect, it } from 'vitest'
import type { Device } from '@/service/api/device-native'
import { alarmLabel, connectivityLabel, deviceListRow, absentTelemetryLabel } from '@/service/api/device-list-rows'

const device = { id: 'device', deviceNumber: 'sensor-1', deviceKind: 'standalone', templateId: 'template' } as Device
const runtime = {
  connectivity: 'online' as const,
  available: true,
  observedAt: '2026-11-16T10:00:00Z',
  lastTelemetryAt: '2026-11-16T09:00:00Z'
}
const alarm = { state: 'active' as const, available: true, activeCount: 2, observedAt: '2026-11-16T10:00:00Z' }

describe('native device list summary rows', () => {
  it('uses owner facts, including the actual telemetry time rather than query time', () => {
    const row = deviceListRow({ ...device, runtimeSummary: runtime, alarmSummary: alarm })
    expect(row).toMatchObject({
      is_online: 1,
      warn_status: 'Y',
      ts: '2026-11-16T09:00:00Z',
      device_config_id: 'template'
    })
    expect(connectivityLabel(row)).toBe('custom.devicePage.online')
    expect(alarmLabel(row)).toBe('custom.devicePage.alarmed')
  })
  it('preserves known offline and no active alarms', () => {
    const row = deviceListRow({
      ...device,
      runtimeSummary: { ...runtime, connectivity: 'offline' },
      alarmSummary: { ...alarm, state: 'none', activeCount: 0 }
    })
    expect(row.is_online).toBe(0)
    expect(row.warn_status).toBe('N')
    expect(connectivityLabel(row)).toBe('custom.devicePage.offline')
    expect(alarmLabel(row)).toBe('custom.devicePage.notAlarmed')
  })
  it('does not turn absent summaries into offline or no alarms', () => {
    const row = deviceListRow(device)
    expect(row.is_online).toBeUndefined()
    expect(row.warn_status).toBeUndefined()
    expect(row.ts).toBeNull()
    expect(connectivityLabel(row)).toBe('custom.devicePage.summaryUnavailable')
    expect(alarmLabel(row)).toBe('custom.devicePage.summaryUnavailable')
  })
  it('distinguishes observed unknown from unavailable and no telemetry from a timestamp', () => {
    const row = deviceListRow({
      ...device,
      runtimeSummary: { ...runtime, connectivity: 'unknown', lastTelemetryAt: null },
      alarmSummary: { ...alarm, state: 'unknown', activeCount: null }
    })
    expect(connectivityLabel(row)).toBe('custom.devicePage.connectivityUnknown')
    expect(alarmLabel(row)).toBe('custom.devicePage.alarmStateUnknown')
    expect(absentTelemetryLabel(row)).toBe('custom.devicePage.noTelemetryReported')
    expect(row.ts).toBeNull()
  })
  it('does not display stale state from an unavailable owner', () => {
    const row = deviceListRow({
      ...device,
      runtimeSummary: { ...runtime, available: false },
      alarmSummary: { ...alarm, available: false }
    })
    expect(row.is_online).toBeUndefined()
    expect(row.warn_status).toBeUndefined()
    expect(row.ts).toBeNull()
  })
  it('rejects malformed report dates instead of rendering Invalid Date', () => {
    const row = deviceListRow({ ...device, runtimeSummary: { ...runtime, lastTelemetryAt: 'bad-date' } })
    expect(row.ts).toBeNull()
    expect(absentTelemetryLabel(row)).toBe('custom.devicePage.summaryUnavailable')
  })
})
