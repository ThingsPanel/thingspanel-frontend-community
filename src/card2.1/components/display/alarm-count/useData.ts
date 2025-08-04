import { reactive, onMounted } from 'vue'
import { getAlarmCount } from '@/service/api'

export function useData() {
  const data = reactive({
    alarmTotal: 0,
    loading: true,
    error: null as Error | null
  })

  const fetchData = async () => {
    data.loading = true
    try {
      const response = await getAlarmCount()
      if (response && typeof response.data.alarm_device_total === 'number') {
        data.alarmTotal = response.data.alarm_device_total
      } else {
        console.error('Alarm count data is missing or not a number.')
        data.alarmTotal = 0
      }
    } catch (e: any) {
      console.error('Error fetching alarm count data:', e)
      data.error = e
      data.alarmTotal = 0
    } finally {
      data.loading = false
    }
  }

  onMounted(fetchData)

  return { data, fetchData }
}
