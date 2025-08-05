import { ref, onMounted, h, computed } from 'vue'
import { NTag, NTooltip } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import { alarmHistory } from '@/service/api/alarm'
import { $t } from '@/locales'

export interface AlarmData {
  id: string
  create_at: string
  name: string
  content: string
  alarm_status: string
}

export function useData() {
  const loading = ref(true)
  const alarmList = ref<AlarmData[]>([])

  const formatTime = (time: string) => {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  }

  const getStatusInfo = (
    status: string
  ): { label: string; type: 'default' | 'error' | 'warning' | 'info' | 'success' } => {
    switch (status) {
      case 'H':
        return { label: $t('common.highAlarm'), type: 'error' }
      case 'M':
        return { label: $t('common.intermediateAlarm'), type: 'warning' }
      case 'L':
        return { label: $t('common.lowAlarm'), type: 'info' }
      case 'N':
        return { label: $t('common.normal'), type: 'success' }
      default:
        return { label: status, type: 'default' }
    }
  }

  const columns = computed<DataTableColumns<AlarmData>>(() => [
    {
      key: 'name',
      title: $t('generate.alarm-name'),
      width: 170,
      ellipsis: { tooltip: true }
    },
    {
      key: 'alarm_status',
      title: $t('generate.alarm-status'),
      width: 90,
      render(row) {
        const statusInfo = getStatusInfo(row.alarm_status)
        return h(NTag, { type: statusInfo.type, size: 'small', round: true }, { default: () => statusInfo.label })
      }
    },
    {
      key: 'content',
      title: $t('generate.alarm-content'),
      ellipsis: { tooltip: true }
    },
    {
      key: 'create_at',
      title: $t('common.alarm_time'),
      width: 180,
      render(row) {
        return formatTime(row.create_at)
      }
    }
  ])

  const fetchData = async () => {
    loading.value = true
    try {
      const params = { page: 1, page_size: 10, alarm_status: '', start_time: '', end_time: '' }
      const { data } = await alarmHistory(params)
      alarmList.value = data?.list || []
    } catch (error) {
      console.error('Failed to fetch alarm history:', error)
      alarmList.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchData)

  return { loading, alarmList, columns, fetchData }
}
