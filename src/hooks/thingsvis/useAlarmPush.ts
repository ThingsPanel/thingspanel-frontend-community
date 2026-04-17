/**
 * useAlarmPush — tp-04
 * 获取设备当前告警状态并推送到 ThingsVis 事件字段。
 * 以低频轮询（30s）更新告警状态。
 * 依赖 tp-01 补全的 PlatformField.dataType = 'event'。
 */

import { type Ref } from 'vue'
import type { PlatformField } from '@/utils/thingsvis/types'
import { deviceAlarmStatus, deviceAlarmHistory } from '@/service/api/device'

export function useAlarmPush(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  /** 推送告警状态字段到 ThingsVis */
  pushData: (fields: Record<string, unknown>) => void,
  /** 推送告警历史到 ThingsVis 环形缓冲 */
  pushHistory: (fieldId: string, history: Array<{ value: unknown; ts: number }>) => void
) {
  let alarmTimer: ReturnType<typeof setInterval> | null = null

  const eventFields = () => platformFields.value.filter(f => f.dataType === 'event')

  /**
   * 拉取设备当前告警状态并推送到 ThingsVis。
   */
  const fetchAlarmStatus = async () => {
    const fields = eventFields()
    if (!fields.length) return

    try {
      const res = await deviceAlarmStatus({ device_id: deviceId.value })
      if (!res?.data) return

      const alarmFields: Record<string, unknown> = {}
      fields.forEach(field => {
        const alarm = (res.data as any[]).find((a: any) => a.alarm_name === field.id || a.key === field.id)
        if (alarm) {
          alarmFields[field.id] = {
            active: alarm.is_active ?? false,
            level: alarm.alarm_level,
            message: alarm.alarm_description,
            time: alarm.last_trigger_time
          }
        }
      })

      if (Object.keys(alarmFields).length > 0) {
        pushData(alarmFields)
      }
    } catch (e) {
      console.warn('[useAlarmPush] Failed to fetch alarm status:', e)
    }
  }

  /**
   * 回填告警历史到 ThingsVis 环形缓冲（最近 50 条）。
   * 在 ThingsVis ready 时调用一次。
   */
  const backfillAlarmHistory = async () => {
    const fields = eventFields()
    if (!fields.length) return

    for (const field of fields) {
      try {
        const res = await deviceAlarmHistory({
          device_id: deviceId.value,
          alarm_name: field.id,
          page: 1,
          page_size: 50
        })

        const list = res?.data?.list
        if (Array.isArray(list) && list.length > 0) {
          const history = list.map((item: any) => ({
            value: {
              active: item.is_active,
              level: item.alarm_level,
              message: item.alarm_description
            },
            ts: new Date(item.trigger_time || item.created_at || 0).getTime()
          }))
          pushHistory(field.id, history)
        }
      } catch (e) {
        console.warn(`[useAlarmPush] Failed to fetch alarm history for ${field.id}:`, e)
      }
    }
  }

  /**
   * 启动告警轮询（30s 间隔）并立即拉取一次状态。
   */
  const start = () => {
    if (!eventFields().length) return // 无事件字段则跳过
    fetchAlarmStatus()
    alarmTimer = setInterval(fetchAlarmStatus, 30000)
  }

  /**
   * 停止告警轮询，在 onBeforeUnmount 调用。
   */
  const stop = () => {
    if (alarmTimer) {
      clearInterval(alarmTimer)
      alarmTimer = null
    }
  }

  return { start, stop, backfillAlarmHistory }
}
