/**
 * useHistoryBackfill — tp-02
 * 在 ThingsVis 就绪后立即为所有遥测字段拉取历史数据并推送到 ThingsVis 环形缓冲区。
 * 依赖 tp-01 补全的 PlatformField.dataType 类型定义。
 */

import type { Ref } from 'vue'
import type { PlatformField } from '@/utils/thingsvis/types'
import { telemetryDataHistoryList } from '@/service/api/device'

export interface HistoryPoint {
  value: number
  ts: number
}

/**
 * 历史数据回填 composable
 * @param deviceId 设备ID
 * @param platformFields 平台字段列表
 * @param pushHistory ThingsVisWidget.pushHistory 方法的引用
 */
export function useHistoryBackfill(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  pushHistory: (fieldId: string, history: HistoryPoint[]) => void
) {
  /**
   * 对所有遥测字段拉取最近1小时历史并推送到 ThingsVis 环形缓冲区。
   * 失败不阻塞，使用 Promise.allSettled 容错。
   */
  const backfill = async () => {
    const telemetryFields = platformFields.value.filter(f => f.dataType === 'telemetry')
    console.log('[useHistoryBackfill] backfill start', {
      deviceId: deviceId.value,
      platformFieldCount: platformFields.value.length,
      telemetryFieldIds: telemetryFields.map(field => field.id)
    })
    if (!telemetryFields.length) return

    const historyPromises = telemetryFields.map(async field => {
      try {
        const params = {
          device_id: deviceId.value,
          key: field.id,
          time_range: 'custom',
          start_time: Date.now() - 36000 * 1000, // 最近 1 小时
          end_time: Date.now(),
          aggregate_window: '1m', // 1分钟聚合
          aggregate_function: 'avg' // 平均值
        }
        console.log(`[useHistoryBackfill] ${field.id}: history api params`, params)
        const res = await telemetryDataHistoryList(params)

        // transformBackendResponse 返回 response.data.data
        // 实际结构: { data: [{ x: "ISO-date", y: number }] }
        const timeSeries = res?.data
        console.log(`[useHistoryBackfill] ${field.id}: history api response`, {
          isArray: Array.isArray(timeSeries),
          count: Array.isArray(timeSeries) ? timeSeries.length : 0,
          first: Array.isArray(timeSeries) ? timeSeries[0] : undefined,
        })
        if (Array.isArray(timeSeries) && timeSeries.length > 0) {
          const history: HistoryPoint[] = timeSeries
            .map((item: any) => ({
              value: Number(item.y ?? item.value ?? item.avg ?? 0),
              ts: new Date(item.x || item.time || item.ts || 0).getTime()
            }))
            .filter(p => !isNaN(p.ts) && !isNaN(p.value))

          if (history.length > 0) {
            console.log(`[useHistoryBackfill] ${field.id}: ${history.length} points backfilled`, {
              first: history[0],
              last: history[history.length - 1]
            })
            pushHistory(field.id, history)
          } else {
            console.warn(`[useHistoryBackfill] ${field.id}: normalized history is empty`)
          }
        } else {
          console.warn(`[useHistoryBackfill] ${field.id}: history api returned no array data`, res)
        }
      } catch (e) {
        console.warn(`[useHistoryBackfill] Failed to fetch history for ${field.id}:`, e)
      }
    })

    await Promise.allSettled(historyPromises)
  }

  return { backfill }
}
