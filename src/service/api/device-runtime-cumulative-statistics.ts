import { localStg } from '@/utils/storage'
import { createProxyPattern } from '~/env.config'
import type { DiagnosticCounter } from './device-diagnostics-native-transport'

export interface CumulativeDeviceStatistics {
  uplink: DiagnosticCounter
  downlink: DiagnosticCounter
  storage: DiagnosticCounter
}

function cumulativeCounter(value: unknown): DiagnosticCounter {
  if (value && typeof value === 'object' && 'success' in value && 'total' in value) {
    const { success, total } = value
    if (
      typeof success === 'number' &&
      typeof total === 'number' &&
      Number.isSafeInteger(success) &&
      Number.isSafeInteger(total) &&
      success >= 0 &&
      total >= success
    ) {
      return { success, total, complete: true, successRate: total > 0 ? success / total : null }
    }
  }
  return { success: null, total: null, successRate: null, complete: false }
}

export async function readCumulativeDeviceStatistics(deviceId: string): Promise<CumulativeDeviceStatistics | null> {
  const token = localStg.get('token')
  if (!token) return null
  const base = import.meta.env.VITE_HTTP_PROXY === 'Y' ? createProxyPattern() : '/api/v1'
  try {
    const response = await fetch(base + '/devices/' + encodeURIComponent(deviceId) + '/diagnostics', {
      headers: { 'x-token': String(token) },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(3000)
    })
    if (!response.ok) return null
    const body = await response.json()
    const data = body?.data
    if (body?.code !== 200 || data?.device_id !== deviceId || !data.stats) return null
    return {
      uplink: cumulativeCounter(data.stats.uplink),
      downlink: cumulativeCounter(data.stats.downlink),
      storage: cumulativeCounter(data.stats.storage)
    }
  } catch {
    return null
  }
}
