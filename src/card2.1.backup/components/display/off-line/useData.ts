import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useLoading } from '~/packages/hooks'
import { sumData, totalNumber } from '@/service/api'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useOfflineData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const value = ref<number | null>(null)
  const authStore = useAuthStore()

  const fetchData = async () => {
    startLoading()
    try {
      const response = authStore.userInfo.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber()

      if (response.data) {
        const total = response.data.device_total ?? 0
        const online = response.data.device_on ?? 0
        value.value = total - online
      } else {
        logger.warn('Offline data not found in response:', response)
        value.value = null
      }
    } catch (error) {
      logger.error('Error fetching offline data:', error)
      value.value = null
    } finally {
      endLoading()
    }
  }

  onMounted(fetchData)

  return { loading, value }
}
