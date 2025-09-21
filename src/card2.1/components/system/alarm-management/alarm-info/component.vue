<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <Icon icon="mdi:alert-circle-outline" class="text-lg text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.alarmInfo.title', '告警信息') }}
        </h3>
      </div>
      <n-button
        text
        size="small"
        type="primary"
        class="hover:bg-blue-50 dark:hover:bg-blue-900 px-3 py-1 rounded-lg transition-colors"
        @click="viewAllAlarms"
      >
        <template #icon>
          <Icon icon="mdi:arrow-right" />
        </template>
        {{ $t('card.alarmInfo.viewAll', '查看全部') }}
      </n-button>
    </div>

    <!-- 数据表格区域 -->
    <div class="flex-1 p-4 overflow-hidden">
      <div class="h-full">
        <n-spin :show="loading">
          <n-data-table
            v-if="!loading"
            :columns="columns"
            :data="alarmList"
            :bordered="false"
            striped
            size="small"
            flex-height
            class="h-full rounded-lg"
            :scroll-x="600"
          />
          <div v-if="!loading && alarmList.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Icon icon="mdi:shield-check-outline" class="text-4xl mb-2 text-green-500" />
            <span class="text-sm">{{ $t('card.alarmInfo.noAlarms') }}</span>
          </div>
        </n-spin>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 告警信息组件
 * 显示最新的告警信息列表，包含告警名称、状态、内容和时间
 */
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { NSpin, NTag, NButton, NDataTable } from 'naive-ui'
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

/**
 * 格式化时间显示
 */
const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

/**
 * 获取告警状态信息
 */
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

/**
 * 数据表格列定义
 */
const columns: DataTableColumns<AlarmData> = [
  {
    key: 'name',
    title: $t('generate.alarm-name'),
    width: 140,
    ellipsis: {
      tooltip: true
    },
    render(row) {
      return h('div', { class: 'font-medium text-gray-900 dark:text-gray-100' }, row.name)
    }
  },
  {
    key: 'alarm_status',
    title: $t('generate.alarm-status'),
    width: 80,
    render(row) {
      const statusInfo = getStatusInfo(row.alarm_status)
      return h(NTag, {
        type: statusInfo.type,
        size: 'small',
        round: true,
        class: 'font-medium'
      }, { default: () => statusInfo.label })
    }
  },
  {
    key: 'content',
    title: $t('generate.alarm-content'),
    ellipsis: {
      tooltip: true
    },
    render(row) {
      return h('div', { class: 'text-gray-700 dark:text-gray-300 text-sm' }, row.content)
    }
  },
  {
    key: 'create_at',
    title: $t('common.alarm_time'),
    width: 80,
    render(row) {
      return h('div', { class: 'text-gray-600 dark:text-gray-400 text-xs' }, formatTime(row.create_at))
    }
  }
]

/**
 * 获取告警数据
 */
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      page_size: 8, // 减少数量以适应卡片大小
      alarm_status: '',
      start_time: '',
      end_time: ''
    }
    const { data } = await alarmHistory(params)
    alarmList.value = data?.list || []
  } catch (error) {
    console.error('获取告警历史失败:', error)
    alarmList.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 查看所有告警
 */
const viewAllAlarms = () => {
  router.push('/alarm/warning-message')
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'AlarmInfoCard21'
})
</script>

<style scoped>
/* 自定义表格样式 */
:deep(.n-data-table-thead) {
  background-color: theme('colors.gray.50');
}

:deep(.dark .n-data-table-thead) {
  background-color: theme('colors.gray.700');
}

:deep(.n-data-table-tbody .n-data-table-tr:hover) {
  background-color: theme('colors.blue.50');
}

:deep(.dark .n-data-table-tbody .n-data-table-tr:hover) {
  background-color: theme('colors.blue.900/20');
}

/* 优化表格行高和间距 */
:deep(.n-data-table-td) {
  padding: 8px 12px;
}

:deep(.n-data-table-th) {
  padding: 10px 12px;
  font-weight: 600;
}
</style>