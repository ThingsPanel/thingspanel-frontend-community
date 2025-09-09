<template>
  <div class="alarm-info-card">
    <!-- 主要内容区域 -->
    <div class="card-container">
      <!-- 标题栏 -->
      <div class="header">
        <h3 class="title">{{ displayTitle }}</h3>
        <n-button v-if="showViewAllButton" text size="small" type="primary" @click="viewAllAlarms">
          {{ $t('card.alarmInfo.viewAll') }}
        </n-button>
      </div>

      <!-- 数据表格区域 -->
      <div class="content">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-container">
          <n-spin size="medium" />
          <span class="loading-text">{{ $t('common.loading') }}</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
          <n-alert type="error" :title="$t('common.error')" size="small">
            {{ error }}
          </n-alert>
          <n-button size="small" @click="fetchAlarmData">
            {{ $t('common.retry') }}
          </n-button>
        </div>

        <!-- 数据表格 -->
        <n-data-table
          v-else
          :columns="tableColumns"
          :data="alarmList"
          :bordered="false"
          striped
          size="small"
          flex-height
          class="alarm-table"
          :scroll-x="360"
        />

        <!-- 刷新状态指示 -->
        <div v-if="isRefreshing && !isLoading" class="refresh-indicator">
          <n-spin size="small" />
          <span class="refresh-text">{{ $t('common.refreshing') }}</span>
        </div>

        <!-- 最后更新时间 -->
        <div v-if="lastUpdateTime" class="last-update">
          {{ $t('common.lastUpdate') }}: {{ formatUpdateTime(lastUpdateTime) }}
        </div>
      </div>
    </div>

    <!-- 调试信息面板 -->
    <div v-if="showDebug" class="debug-panel">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <n-code :code="debugInfo" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 告警信息统计卡片组件 (Card2.1)
 * 迁移自 builtin-card/alarm-info，实现自包含的告警信息展示功能
 * - 移除外部数据源依赖，组件内部获取数据
 * - 支持自动刷新和错误处理
 * - 完全集成主题系统和国际化
 */

import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { NDataTable, NSpin, NButton, NTag, NAlert, NCollapse, NCollapseItem, NCode, NTooltip } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { createLogger } from '@/utils/logger'
import { alarmHistory } from '@/service/api/alarm'

// 组件属性接口
interface Props {
  rawDataSources?: any // Card2.1 标准数据绑定接口
  title?: string // 自定义标题
  pageSize?: number // 显示条数
  refreshInterval?: number // 刷新间隔(毫秒)
  showViewAllButton?: boolean // 是否显示查看全部按钮
  enableAutoRefresh?: boolean // 是否启用自动刷新
  showDebug?: boolean // 是否显示调试信息
}

// 告警数据接口
interface AlarmData {
  id: string
  create_at: string
  name: string
  content: string
  alarm_status: string
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  title: '',
  pageSize: 10,
  refreshInterval: 60000, // 默认1分钟
  showViewAllButton: true,
  enableAutoRefresh: true,
  showDebug: false
})

// 路由和国际化
const router = useRouter()
const { t } = useI18n()
const logger = createLogger('AlarmInfoCard')

// 响应式数据
const alarmList = ref<AlarmData[]>([])
const isLoading = ref<boolean>(true)
const isRefreshing = ref<boolean>(false)
const lastUpdateTime = ref<Date | null>(null)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)

// 计算属性
const displayTitle = computed(() => {
  return props.title || t('card.alarmInfo.title')
})

const debugInfo = computed(() => {
  return JSON.stringify(
    {
      alarmCount: alarmList.value.length,
      isLoading: isLoading.value,
      isRefreshing: isRefreshing.value,
      lastUpdateTime: lastUpdateTime.value,
      error: error.value,
      refreshInterval: props.refreshInterval,
      pageSize: props.pageSize,
      enableAutoRefresh: props.enableAutoRefresh,
      rawDataSources: props.rawDataSources
    },
    null,
    2
  )
})

// 时间格式化
const formatTime = (time: string): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const formatUpdateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// 获取告警状态信息
const getStatusInfo = (
  status: string
): { label: string; type: 'default' | 'error' | 'warning' | 'info' | 'success' } => {
  switch (status) {
    case 'H':
      return { label: t('common.highAlarm'), type: 'error' }
    case 'M':
      return { label: t('common.intermediateAlarm'), type: 'warning' }
    case 'L':
      return { label: t('common.lowAlarm'), type: 'info' }
    case 'N':
      return { label: t('common.normal'), type: 'success' }
    default:
      return { label: status, type: 'default' }
  }
}

// 数据表格列定义
const tableColumns = computed<DataTableColumns<AlarmData>>(() => [
  {
    key: 'name',
    title: t('generate.alarm-name'),
    width: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'alarm_status',
    title: t('generate.alarm-status'),
    width: 80,
    render(row) {
      const statusInfo = getStatusInfo(row.alarm_status)
      return h(
        NTag,
        {
          type: statusInfo.type,
          size: 'small',
          round: true
        },
        {
          default: () => statusInfo.label
        }
      )
    }
  },
  {
    key: 'content',
    title: t('generate.alarm-content'),
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'create_at',
    title: t('common.alarm_time'),
    width: 140,
    render(row) {
      return formatTime(row.create_at)
    }
  }
])

/**
 * 获取告警数据
 * 调用告警历史API获取最新告警信息
 */
const fetchAlarmData = async (): Promise<void> => {
  try {
    // 设置刷新状态，但初次加载设置loading状态
    if (alarmList.value.length === 0) {
      isLoading.value = true
    } else {
      isRefreshing.value = true
    }
    error.value = null

    logger.info('开始获取告警信息数据', {
      pageSize: props.pageSize
    })

    // 调用告警历史API
    const params = {
      page: 1,
      page_size: props.pageSize,
      alarm_status: '',
      start_time: '',
      end_time: ''
    }

    const response = await alarmHistory(params)

    if (response?.data?.list && Array.isArray(response.data.list)) {
      alarmList.value = response.data.list
      lastUpdateTime.value = new Date()

      logger.info('告警数据获取成功', {
        alarmCount: alarmList.value.length,
        updateTime: lastUpdateTime.value
      })
    } else {
      throw new Error('API返回数据格式错误：缺少 list 字段')
    }
  } catch (err: any) {
    const errorMessage = err.message || '获取告警数据失败'
    error.value = errorMessage
    logger.error('获取告警数据出错', err)

    // 如果是首次加载失败，设置空数组避免显示错误
    if (alarmList.value.length === 0) {
      alarmList.value = []
    }
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

/**
 * 启动自动刷新定时器
 */
const startAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  if (props.enableAutoRefresh && props.refreshInterval > 0) {
    refreshTimer.value = window.setInterval(() => {
      fetchAlarmData()
    }, props.refreshInterval)

    logger.info('启动自动刷新', {
      interval: props.refreshInterval
    })
  }
}

/**
 * 停止自动刷新定时器
 */
const stopAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
    logger.info('停止自动刷新')
  }
}

/**
 * 查看全部告警
 * 跳转到告警管理页面
 */
const viewAllAlarms = (): void => {
  router.push('/alarm/warning-message')
  logger.info('跳转到告警管理页面')
}

// 监听相关props变化
watch(
  () => [props.refreshInterval, props.enableAutoRefresh],
  () => {
    startAutoRefresh()
  },
  { immediate: false }
)

watch(
  () => props.pageSize,
  () => {
    // 页面大小变化时重新获取数据
    fetchAlarmData()
  },
  { immediate: false }
)

// 生命周期钩子
onMounted(async () => {
  logger.info('AlarmInfoCard 组件挂载')

  // 初始数据加载
  await fetchAlarmData()

  // 启动自动刷新
  startAutoRefresh()
})

onUnmounted(() => {
  logger.info('AlarmInfoCard 组件卸载')
  stopAutoRefresh()
})

// 监听 rawDataSources 变化（用于调试）
watch(
  () => props.rawDataSources,
  newRawDataSources => {
    logger.debug('接收到 rawDataSources 更新', {
      rawDataSources: newRawDataSources
    })
  },
  { deep: true }
)
</script>

<style scoped>
.alarm-info-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-color);
  border: 1px solid var(--border-color);
}

.card-container {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-color-2);
}

.loading-text {
  font-size: 12px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}

.alarm-table {
  flex: 1;
  min-height: 0;
}

.alarm-table :deep(.n-data-table-wrapper) {
  height: 100%;
}

.alarm-table :deep(.n-data-table-base-table) {
  height: 100%;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-color-3);
  margin-top: 8px;
  position: absolute;
  bottom: -20px;
  left: 0;
}

.refresh-text {
  font-size: 11px;
}

.last-update {
  font-size: 11px;
  color: var(--text-color-3);
  margin-top: 4px;
  text-align: right;
}

.debug-panel {
  margin-top: 8px;
  padding: 8px;
  background: var(--card-color);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .card-container {
    padding: 12px;
  }

  .title {
    font-size: 14px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 小尺寸适配 */
@container (max-width: 350px) {
  .card-container {
    padding: 10px;
  }

  .title {
    font-size: 13px;
  }

  .alarm-table :deep(.n-data-table) {
    font-size: 12px;
  }
}

/* 主题适配 */
[data-theme='dark'] .debug-panel {
  background: var(--card-color-dark, #333);
  border-color: var(--border-color-dark, #555);
}
</style>
