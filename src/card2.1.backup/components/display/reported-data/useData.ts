import { ref, onMounted, onUnmounted } from 'vue'
import { getLatestTelemetryData } from '@/service/api'

interface TelemetryItem {
  key: string
  label: string | null
  unit: string | null
  value: any
}
export interface DeviceData {
  device_id: string
  device_name: string
  is_online: number
  last_push_time: string
  telemetry_data: TelemetryItem[]
}

const REFRESH_INTERVAL = 6000

export function useData() {
  const devices = ref<DeviceData[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const isRefreshing = ref(true)
  const isFetchingUpdate = ref(false)
  let refreshIntervalId: ReturnType<typeof setInterval> | null = null

  const fetchData = async (initialLoad = false) => {
    if (initialLoad) loading.value = true
    else isFetchingUpdate.value = true
    error.value = null

    try {
      const response = await getLatestTelemetryData()
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch data')
      }
      devices.value = Array.isArray(response.data) ? response.data : []
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('An unknown error occurred')
      devices.value = []
    } finally {
      if (initialLoad) loading.value = false
      isFetchingUpdate.value = false
    }
  }

  const stopPolling = () => {
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId)
      refreshIntervalId = null
    }
  }

  const startPolling = () => {
    stopPolling()
    if (isRefreshing.value) {
      refreshIntervalId = setInterval(() => fetchData(false), REFRESH_INTERVAL)
    }
  }

  const toggleRefresh = () => {
    isRefreshing.value = !isRefreshing.value
    if (isRefreshing.value) {
      fetchData(false)
      startPolling()
    } else {
      stopPolling()
    }
  }

  onMounted(() => {
    fetchData(true)
    startPolling()
  })

  onUnmounted(stopPolling)

  return { devices, loading, error, isRefreshing, isFetchingUpdate, toggleRefresh }
}
