import { type Ref } from 'vue'
import { deviceAlarmStatus } from '@/service/api/device'
import type { PlatformField } from '@/utils/thingsvis/types'

export function useAlarmPush(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  pushData: (fields: Record<string, unknown>) => void
) {
  let alarmTimer: ReturnType<typeof setInterval> | null = null

  const eventFields = () => platformFields.value.filter(field => field.dataType === 'event')

  const fetchAlarmStatus = async () => {
    const fields = eventFields()
    if (!fields.length || !deviceId.value) return

    try {
      const res = await deviceAlarmStatus({ device_id: deviceId.value })
      if (!Array.isArray(res?.data)) return

      const alarmFields: Record<string, unknown> = {}
      fields.forEach(field => {
        const alarm = res.data.find((item: any) => item.alarm_name === field.id || item.key === field.id)
        if (!alarm) return

        alarmFields[field.id] = {
          active: alarm.is_active ?? false,
          level: alarm.alarm_level,
          message: alarm.alarm_description,
          time: alarm.last_trigger_time
        }
      })

      if (Object.keys(alarmFields).length > 0) {
        pushData(alarmFields)
      }
    } catch (error) {
      console.warn('[useAlarmPush] Failed to fetch alarm status:', error)
    }
  }

  const start = () => {
    if (!eventFields().length) return
    void fetchAlarmStatus()
    alarmTimer = setInterval(fetchAlarmStatus, 30000)
  }

  const stop = () => {
    if (!alarmTimer) return
    clearInterval(alarmTimer)
    alarmTimer = null
  }

  return { start, stop }
}
