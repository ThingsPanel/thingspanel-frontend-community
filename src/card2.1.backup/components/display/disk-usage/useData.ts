import { ref, onMounted, onUnmounted } from 'vue'
import { useLoading } from '~/packages/hooks'
import { getSystemMetricsCurrent } from '@/service/api/system-data'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useDiskUsageData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const value = ref<number | null>(null)
  const unit = ref<string>('%')
  let intervalId: number | null = null

  const fetchData = async () => {
    startLoading()
    try {
      const response = await getSystemMetricsCurrent()
      const diskUsagePercent = response?.data?.disk_usage // Changed to disk_usage
      if (typeof diskUsagePercent === 'number') {
        value.value = parseFloat(diskUsagePercent.toFixed(1))
      } else {
        logger.warn('Disk usage not found in response:', response)
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
