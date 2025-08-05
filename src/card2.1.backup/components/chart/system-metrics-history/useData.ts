import { ref, onMounted } from 'vue'
import { getSystemMetricsHistory } from '@/service/api/system-data'
import dayjs from 'dayjs'

export function useData() {
  const loading = ref(true)
  const errorMsg = ref<string | null>(null)
  const chartData = ref<{
    timeAxis: string[]
    timestamps: number[]
    cpuData: number[]
    memData: number[]
    diskData: number[]
  }>({ timeAxis: [], timestamps: [], cpuData: [], memData: [], diskData: [] })

  const fetchData = async () => {
    loading.value = true
    errorMsg.value = null
    try {
      const response = await getSystemMetricsHistory({})
      if (response && Array.isArray(response.data)) {
        processApiData(response.data)
      } else {
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : 'Failed to load data'
    } finally {
      loading.value = false
    }
  }

  const processApiData = (apiData: any[]) => {
    const timeAxis: string[] = []
    const timestamps: number[] = []
    const cpuData: number[] = []
    const memData: number[] = []
    const diskData: number[] = []

    apiData.forEach(item => {
      const timestampMs = dayjs(item.timestamp).valueOf()
      timestamps.push(timestampMs)
      timeAxis.push(dayjs(timestampMs).format('HH:mm'))
      cpuData.push(Number(item.cpu?.toFixed(1)) || 0)
      memData.push(Number(item.memory?.toFixed(1)) || 0)
      diskData.push(Number(item.disk?.toFixed(1)) || 0)
    })

    chartData.value = { timeAxis, timestamps, cpuData, memData, diskData }
  }

  onMounted(fetchData)

  return { loading, errorMsg, chartData }
}
