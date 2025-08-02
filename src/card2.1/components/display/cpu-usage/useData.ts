import { ref, onMounted, onUnmounted } from 'vue'
import { useLoading } from '~/packages/hooks'
import { getSystemMetricsCurrent } from '@/service/api/system-data'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useCpuUsageData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const value = ref<number | null>(null)
  const unit = ref<string>('%')
  let intervalId: number | null = null

  const fetchData = async () => {
    startLoading()
    try {
      const response = await getSystemMetricsCurrent()
      const cpuUsagePercent = response?.data?.cpu_usage
      if (typeof cpuUsagePercent === 'number') {
        value.value = parseFloat(cpuUsagePercent.toFixed(1))
      } else {
        logger.warn('CPU usage not found in response:', response)
        value.value = null
      }
    } catch (error) {
      logger.error('Error fetching system metrics:', error)
      value.value = null
    } finally {
      endLoading()
    }
  }

  onMounted(() => {
    fetchData()
    // Set an interval to refresh data every 30 seconds
    intervalId = window.setInterval(fetchData, 30000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return { loading, value, unit }
}
