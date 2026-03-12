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
    if (!telemetryFields.length) return

    const historyPromises = telemetryFields.map(async field => {
      try {
        const res = await telemetryDataHistoryList({
          device_id: deviceId.value,
          key: field.id,
          time_range: 'custom',
          start_time: Date.now() - 3600 * 1000, // 最近 1 小时
          end_time: Date.now(),
          aggregate_window: '1m', // 1分钟聚合
          aggregate_function: 'avg' // 平均值
        })

        const list = res?.data?.list
        if (Array.isArray(list) && list.length > 0) {
          const history: HistoryPoint[] = list
            .map((item: any) => ({
              value: Number(item.value ?? item.avg ?? item.y ?? 0),
              ts: new Date(item.time || item.x || item.ts || 0).getTime()
            }))
            .filter(p => !isNaN(p.ts) && !isNaN(p.value))

          if (history.length > 0) {
            pushHistory(field.id, history)
          }
        }
      } catch (e) {
        console.warn(`[useHistoryBackfill] Failed to fetch history for ${field.id}:`, e)
      }
    })

    await Promise.allSettled(historyPromises)
  }

  return { backfill }
}
