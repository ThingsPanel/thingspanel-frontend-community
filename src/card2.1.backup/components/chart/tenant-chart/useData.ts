import { ref, onMounted } from 'vue'
import { tenant } from '@/service/api/system-data'

export function useData() {
  const loading = ref(true)
  const errorMsg = ref<string | null>(null)
  const stats = ref({
    user_total: 0,
    user_added_yesterday: 0,
    user_added_month: 0
  })
  const chartData = ref<{
    monthLabels: string[]
    userCounts: number[]
  }>({ monthLabels: [], userCounts: [] })

  const fetchData = async () => {
    loading.value = true
    errorMsg.value = null
    try {
      const response = await tenant()
      if (response && response.data) {
        stats.value = {
          user_total: response.data.user_total || 0,
          user_added_yesterday: response.data.user_added_yesterday || 0,
          user_added_month: response.data.user_added_month || 0
        }
        if (Array.isArray(response.data.user_list_month)) {
          processChartData(response.data.user_list_month)
        }
      } else {
        throw new Error('Invalid data format')
      }
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : 'Failed to load data'
    } finally {
      loading.value = false
    }
  }

  const processChartData = (userListMonth: { mon: number; num: number }[]) => {
    userListMonth.sort((a, b) => a.mon - b.mon)
    chartData.value = {
      monthLabels: userListMonth.map(item => String(item.mon)),
      userCounts: userListMonth.map(item => item.num || 0)
    }
  }

  onMounted(fetchData)

  return { loading, errorMsg, stats, chartData }
}
