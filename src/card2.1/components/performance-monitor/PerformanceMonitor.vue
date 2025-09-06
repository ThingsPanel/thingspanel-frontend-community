<!--
🚀 性能监控面板
提供属性系统的实时性能监控和优化建议
-->
<template>
  <n-card class="performance-monitor" :bordered="false">
    <template #header>
      <n-space align="center">
        <n-icon size="20">
          <dashboard-icon />
        </n-icon>
        <span>{{ $t('performance.monitor.title') }}</span>
        <n-tag :type="getOverallStatusType()" size="small">
          {{ getOverallStatusText() }}
        </n-tag>
      </n-space>
    </template>

    <template #header-extra>
      <n-space>
        <n-button size="small" :loading="isRefreshing" @click="refreshData">
          {{ $t('common.refresh') }}
        </n-button>

        <n-button size="small" type="warning" :disabled="!hasData" @click="clearData">
          {{ $t('performance.monitor.clearData') }}
        </n-button>
      </n-space>
    </template>

    <!-- 核心性能指标 -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" class="metrics-grid">
      <n-grid-item>
        <n-statistic
          :label="$t('performance.metrics.propertyParsing')"
          :value="performanceData.metrics.propertyParsingTime"
          suffix="ms"
          :precision="1"
        >
          <template #prefix>
            <n-icon :color="getMetricColor('propertyParsingTime')">
              <search-icon />
            </n-icon>
          </template>
        </n-statistic>
      </n-grid-item>

      <n-grid-item>
        <n-statistic
          :label="$t('performance.metrics.configMerge')"
          :value="performanceData.metrics.configMergeTime"
          suffix="ms"
          :precision="1"
        >
          <template #prefix>
            <n-icon :color="getMetricColor('configMergeTime')">
              <merge-icon />
            </n-icon>
          </template>
        </n-statistic>
      </n-grid-item>

      <n-grid-item>
        <n-statistic
          :label="$t('performance.metrics.componentRender')"
          :value="performanceData.metrics.componentRenderTime"
          suffix="ms"
          :precision="1"
        >
          <template #prefix>
            <n-icon :color="getMetricColor('componentRenderTime')">
              <render-icon />
            </n-icon>
          </template>
        </n-statistic>
      </n-grid-item>

      <n-grid-item>
        <n-statistic :label="$t('performance.metrics.totalOperations')" :value="totalOperations">
          <template #prefix>
            <n-icon color="#18a058">
              <stats-icon />
            </n-icon>
          </template>
        </n-statistic>
      </n-grid-item>
    </n-grid>

    <!-- 缓存统计 -->
    <n-divider />
    <n-space vertical>
      <n-text strong>{{ $t('performance.cache.title') }}</n-text>
      <n-grid :cols="3" :x-gap="16">
        <n-grid-item>
          <n-progress type="circle" :percentage="getCacheUsagePercentage('configCache')" :stroke-width="6" :size="80">
            <span class="cache-label">配置缓存</span>
          </n-progress>
          <n-text depth="3" style="display: block; text-align: center; margin-top: 8px">
            {{ performanceData.cacheStats.configCache }} / 1000
          </n-text>
        </n-grid-item>

        <n-grid-item>
          <n-progress type="circle" :percentage="getCacheUsagePercentage('propertyCache')" :stroke-width="6" :size="80">
            <span class="cache-label">属性缓存</span>
          </n-progress>
          <n-text depth="3" style="display: block; text-align: center; margin-top: 8px">
            {{ performanceData.cacheStats.propertyCache }} / 1000
          </n-text>
        </n-grid-item>

        <n-grid-item>
          <n-progress type="circle" :percentage="getCacheUsagePercentage('pathCache')" :stroke-width="6" :size="80">
            <span class="cache-label">路径缓存</span>
          </n-progress>
          <n-text depth="3" style="display: block; text-align: center; margin-top: 8px">
            {{ performanceData.cacheStats.pathCache }} / 1000
          </n-text>
        </n-grid-item>
      </n-grid>
    </n-space>

    <!-- 性能警报 -->
    <template v-if="performanceData.alerts && performanceData.alerts.length > 0">
      <n-divider />
      <n-space vertical>
        <n-text strong>{{ $t('performance.alerts.title') }}</n-text>
        <n-alert
          v-for="alert in recentAlerts"
          :key="alert.timestamp"
          :type="alert.level"
          :title="alert.message"
          closable
          @close="dismissAlert(alert)"
        >
          <n-space vertical size="small">
            <n-text depth="3">{{ formatTimestamp(alert.timestamp) }}</n-text>
            <n-space vertical size="small">
              <n-text strong>{{ $t('performance.alerts.suggestions') }}</n-text>
              <n-ul>
                <n-li v-for="suggestion in alert.suggestions" :key="suggestion">
                  {{ suggestion }}
                </n-li>
              </n-ul>
            </n-space>
          </n-space>
        </n-alert>
      </n-space>
    </template>

    <!-- 优化建议 -->
    <template v-if="performanceData.recommendations && performanceData.recommendations.length > 0">
      <n-divider />
      <n-space vertical>
        <n-text strong>{{ $t('performance.recommendations.title') }}</n-text>
        <n-list>
          <n-list-item v-for="recommendation in performanceData.recommendations" :key="recommendation">
            <n-thing>
              <template #avatar>
                <n-icon size="18" color="#f0a020">
                  <bulb-icon />
                </n-icon>
              </template>
              <n-text>{{ recommendation }}</n-text>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-space>
    </template>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 🚀 性能监控面板组件
 * 实时显示属性系统的性能指标和优化建议
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NSpace,
  NIcon,
  NTag,
  NButton,
  NGrid,
  NGridItem,
  NStatistic,
  NDivider,
  NText,
  NProgress,
  NAlert,
  NList,
  NListItem,
  NThing,
  NUl,
  NLi
} from 'naive-ui'
import {
  SpeedometerOutline as DashboardIcon,
  SearchOutline as SearchIcon,
  GitMergeOutline as MergeIcon,
  ColorPaletteOutline as RenderIcon,
  StatsChartOutline as StatsIcon,
  BulbOutline as BulbIcon
} from '@vicons/ionicons5'

import { performanceOptimizer } from '@/card2.1/core/performance-optimizer'
import type { PerformanceAlert } from '@/card2.1/core/performance-optimizer'

const { t } = useI18n()

// 响应式数据
const performanceData = ref({
  metrics: {
    propertyParsingTime: 0,
    configMergeTime: 0,
    componentRenderTime: 0,
    operationStats: {
      propertyLookups: 0,
      configMerges: 0,
      pathParses: 0
    }
  },
  alerts: [] as PerformanceAlert[],
  recommendations: [] as string[],
  cacheStats: {
    configCache: 0,
    propertyCache: 0,
    pathCache: 0
  }
})

const isRefreshing = ref(false)
const dismissedAlerts = ref(new Set<number>())

// 计算属性
const totalOperations = computed(() => {
  const stats = performanceData.value.metrics.operationStats
  return (stats?.propertyLookups || 0) + (stats?.configMerges || 0) + (stats?.pathParses || 0)
})

const hasData = computed(() => {
  return (
    totalOperations.value > 0 ||
    performanceData.value.alerts.length > 0 ||
    Object.values(performanceData.value.cacheStats).some(v => v > 0)
  )
})

const recentAlerts = computed(() => {
  return performanceData.value.alerts.filter(alert => !dismissedAlerts.value.has(alert.timestamp)).slice(-5) // 只显示最近5条
})

/**
 * 获取整体状态类型
 */
const getOverallStatusType = (): 'success' | 'warning' | 'error' => {
  const alerts = performanceData.value.alerts
  if (alerts.some(alert => alert.level === 'error')) return 'error'
  if (alerts.some(alert => alert.level === 'warning')) return 'warning'
  return 'success'
}

/**
 * 获取整体状态文本
 */
const getOverallStatusText = (): string => {
  const type = getOverallStatusType()
  switch (type) {
    case 'error':
      return t('performance.status.critical')
    case 'warning':
      return t('performance.status.warning')
    case 'success':
    default:
      return t('performance.status.good')
  }
}

/**
 * 获取指标颜色
 */
const getMetricColor = (metricType: string): string => {
  const value = performanceData.value.metrics[metricType as keyof typeof performanceData.value.metrics] as number

  // 根据不同指标设置不同的阈值
  let threshold = 50 // 默认阈值 50ms
  if (metricType === 'configMergeTime') threshold = 30
  if (metricType === 'componentRenderTime') threshold = 100

  if (value > threshold * 2) return '#d03050' // 红色
  if (value > threshold) return '#f0a020' // 橙色
  return '#18a058' // 绿色
}

/**
 * 获取缓存使用百分比
 */
const getCacheUsagePercentage = (cacheType: keyof typeof performanceData.value.cacheStats): number => {
  const usage = performanceData.value.cacheStats[cacheType]
  return Math.min((usage / 1000) * 100, 100)
}

/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

/**
 * 刷新性能数据
 */
const refreshData = async (): Promise<void> => {
  isRefreshing.value = true

  try {
    // 获取最新的性能报告
    const report = performanceOptimizer.getPerformanceReport()
    performanceData.value = {
      metrics: report.metrics,
      alerts: report.alerts,
      recommendations: report.recommendations,
      cacheStats: report.cacheStats
    }

    console.log('🎯 [PerformanceMonitor] 性能数据已刷新', report)
  } catch (error) {
    console.error('🚨 [PerformanceMonitor] 刷新性能数据失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 清理性能数据
 */
const clearData = (): void => {
  performanceOptimizer.clearPerformanceData()
  dismissedAlerts.value.clear()
  refreshData()
}

/**
 * 忽略警报
 */
const dismissAlert = (alert: PerformanceAlert): void => {
  dismissedAlerts.value.add(alert.timestamp)
}

// 定时刷新数据
let refreshTimer: NodeJS.Timeout | null = null

onMounted(() => {
  // 初始化数据
  refreshData()

  // 每5秒自动刷新
  refreshTimer = setInterval(refreshData, 5000)

  console.log('🎯 [PerformanceMonitor] 性能监控面板已初始化')
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.performance-monitor {
  min-height: 400px;
}

.metrics-grid {
  margin-bottom: 16px;
}

.cache-label {
  font-size: 12px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .metrics-grid :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .metrics-grid :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}
</style>
