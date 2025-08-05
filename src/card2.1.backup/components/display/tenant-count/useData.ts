import { ref, onMounted } from 'vue'
import { useLoading } from '~/packages/hooks'
import { tenant } from '@/service/api/system-data'

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(true)
  const value = ref(0)

  const fetchData = async () => {
    startLoading()
    try {
      const { data } = await tenant()
      if (data && typeof data.user_total === 'number') {
        value.value = data.user_total
      }
    } catch (error) {
      console.error('Failed to fetch tenant count:', error)
      value.value = 0
    } finally {
      endLoading()
    }
  }

  onMounted(fetchData)

  return { loading, value }
}
