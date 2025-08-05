import { reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { sumData, totalNumber } from '@/service/api'

export function useData() {
  const authStore = useAuthStore()

  const data = reactive({
    deviceTotal: 0,
    loading: true,
    error: null as Error | null
  })

  const fetchData = async () => {
    data.loading = true
    try {
      const response = await (authStore.userInfo.authority === 'TENANT_ADMIN' ? sumData() : totalNumber())
      if (response && typeof response.data.device_total === 'number') {
        data.deviceTotal = response.data.device_total
      } else {
        console.error('Data does not contain the required properties or they are not numbers.')
        data.deviceTotal = 0
      }
    } catch (e: any) {
      console.error('Error fetching data:', e)
      data.error = e
      data.deviceTotal = 0
    } finally {
      data.loading = false
    }
  }

  onMounted(fetchData)

  return { data, fetchData }
}
