<template>
  <div class="p-4 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
    <div class="flex justify-between items-center mb-3 flex-shrink-0">
      <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
        {{ $t('card.alarmInfo.title', '告警信息') }}
      </h3>
      <NButton text size="small" type="primary" @click="viewAllAlarms">
        {{ $t('card.alarmInfo.viewAll', '查看全部') }}
      </NButton>
    </div>
    <div class="flex-grow overflow-auto relative">
      <n-data-table
        v-if="!loading"
        :columns="columns"
        :data="alarmList"
        :bordered="false"
        striped
        size="small"
        flex-height
        class="h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NSpin, NTag, NButton, NDataTable, NTooltip } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import { alarmHistory } from '@/service/api/alarm'
import { $t } from '@/locales'

interface AlarmData {
  id: string
  create_at: string
  name: string
  content: string
  alarm_status: string
}

const loading = ref(true)
const alarmList = ref<AlarmData[]>([])
const router = useRouter()

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

const columns: DataTableColumns<AlarmData> = [
  {
    key: 'name',
    title: $t('generate.alarm-name'),
    width: 170,
    ellipsis: {
      tooltip: true
    }
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
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'create_at',
    title: $t('common.alarm_time'),
    width: 180,
    render(row) {
      return formatTime(row.create_at)
    }
  }
]

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      page_size: 10,
      alarm_status: '',
      start_time: '',
      end_time: ''
    }
    const { data } = await alarmHistory(params)
    alarmList.value = data?.list || []
    loading.value = false
  } catch (error) {
    console.error('Failed to fetch alarm history:', error)
    alarmList.value = []
  }
}

const viewAllAlarms = () => {
  router.push('/alarm/warning-message')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped></style>
