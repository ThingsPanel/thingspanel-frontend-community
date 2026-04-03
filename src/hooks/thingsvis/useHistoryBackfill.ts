import type { Ref } from 'vue'
import { telemetryHistoryData } from '@/service/api/device'
import type { PlatformField } from '@/utils/thingsvis/types'

export interface HistoryPoint {
  value: number
  ts: number
}

export function useHistoryBackfill(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  pushHistory: (fieldId: string, history: HistoryPoint[]) => void
) {
  const backfill = async () => {
    const telemetryFields = platformFields.value.filter(field => field.dataType === 'telemetry')
    if (!telemetryFields.length) return

    const endTime = Date.now()
    const startTime = endTime - 24 * 60 * 60 * 1000

    const historyPromises = telemetryFields.map(async field => {
      try {
        const res = await telemetryHistoryData({
          device_id: deviceId.value,
          key: field.id,
          start_time: startTime,
          end_time: endTime
        })

        const timeSeries = Array.isArray(res?.data?.list) ? res.data.list : []
        if (timeSeries.length === 0) return

        const history: HistoryPoint[] = timeSeries
          .map((item: any) => ({
            value: Number(item.value ?? item.y ?? item.avg ?? 0),
            ts: Number(item.ts ?? item.x ?? item.time ?? 0)
          }))
          .filter(point => !Number.isNaN(point.ts) && !Number.isNaN(point.value))

        if (history.length > 0) {
          pushHistory(field.id, history)
        }
      } catch (error) {
        console.warn(`[useHistoryBackfill] Failed to fetch history for ${field.id}:`, error)
      }
    })

    await Promise.allSettled(historyPromises)
  }

  return { backfill }
}
