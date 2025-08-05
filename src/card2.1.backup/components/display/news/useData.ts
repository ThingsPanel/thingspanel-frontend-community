import { ref, onMounted } from 'vue'
import { useLoading } from '~/packages/hooks'
import { tenantNum } from '@/service/api'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useNewsData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const value = ref<number | null>(null)

  const fetchData = async () => {
    startLoading()
    try {
      const response = await tenantNum()
      if (response.data) {
        value.value = response.data?.msg ?? 0
      } else {
        logger.warn('News data not found in response:', response)
        value.value = null
      }
    } catch (error) {
      logger.error('Error fetching news data:', error)
      value.value = null
    } finally {
      endLoading()
    }
  }

  onMounted(fetchData)

  return { loading, value }
}
