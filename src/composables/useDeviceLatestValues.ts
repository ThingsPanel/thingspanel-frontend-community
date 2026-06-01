import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { deviceApi } from '@/service/thingmodel/device'

export function useDeviceLatestValues(deviceId: Ref<string>) {
  const values = ref<Record<string, any>>({})
  const loading = ref(false)

  const fetchLatest = async () => {
    if (!deviceId.value) return
    loading.value = true
    try {
      const data = await deviceApi.latest(deviceId.value)
      values.value = data as Record<string, any>
    } catch {
      // ignore
    } finally {
      loading.value = false
    }
  }

  fetchLatest()
  const timer = setInterval(fetchLatest, 5000)
  onUnmounted(() => clearInterval(timer))

  return { values, loading, fetchLatest }
}
