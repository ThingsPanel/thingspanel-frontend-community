import { ref, onMounted, computed } from 'vue'
import { useLoading } from '~/packages/hooks'
import { getOnlineDeviceTrend } from '@/service/api/system-data'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('useOnlineTrendData')

export function useData() {
  const { loading, startLoading, endLoading } = useLoading(false)
  const onlineData = ref<[number, number][]>([])
  const offlineData = ref<[number, number][]>([])

  const fetchData = async () => {
    startLoading()
    try {
      const response = await getOnlineDeviceTrend()
      if (response && response.data && response.data.points) {
        onlineData.value = response.data.points.map((p: any) => [new Date(p.timestamp).getTime(), p.device_online])
        offlineData.value = response.data.points.map((p: any) => [new Date(p.timestamp).getTime(), p.device_offline])
      }
    } catch (error) {
      logger.error('Failed to fetch device trend data:', error)
    } finally {
      endLoading()
    }
  }

  const onlineRate = computed(() => {
    const lastOnline = onlineData.value[onlineData.value.length - 1]?.[1] ?? 0
    const lastOffline = offlineData.value[offlineData.value.length - 1]?.[1] ?? 0
    const total = lastOnline + lastOffline
    return total > 0 ? Math.round((lastOnline / total) * 100) : 0
  })

  const onlineRateText = computed(() => {
    return `${$t('card.onlineRate')} ${onlineRate.value}%`
  })

  onMounted(fetchData)

  return { loading, onlineData, offlineData, onlineRateText }
}
