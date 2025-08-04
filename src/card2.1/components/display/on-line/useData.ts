import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useLoading } from '~/packages/hooks'
import { sumData, totalNumber } from '@/service/api'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useOnlineData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const value = ref<number | null>(null)
  const authStore = useAuthStore()

  const fetchData = async () => {
    startLoading()
    try {
      const response = authStore.userInfo.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber()

      if (response.data) {
        value.value = response.data.device_on ?? 0
      } else {
        logger.warn('Online data not found in response:', response)
        value.value = null
      }
    } catch (error) {
      logger.error('Error fetching online data:', error)
      value.value = null
    } finally {
      endLoading()
    }
  }

  onMounted(fetchData)

  return { loading, value }
}
