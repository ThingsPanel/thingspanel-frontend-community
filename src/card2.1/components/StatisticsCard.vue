<template>
  <div class="statistics-card">
    <!-- 组件标题 -->
    <div v-if="showTitle" class="component-title">
      <n-icon size="16" class="title-icon">
        <StatsChartOutline />
      </n-icon>
      <span class="title-text">{{ title || '统计概览' }}</span>
      <div class="title-actions">
        <n-button size="tiny" quaternary @click="refreshStats">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 统计内容 -->
    <div class="stats-content">
      <div v-if="!hasData" class="no-data">
        <n-empty size="small" description="暂无统计数据">
          <template #icon>
            <n-icon><AnalyticsOutline /></n-icon>
          </template>
          <template #extra>
            <n-text depth="3">请配置多个数据源</n-text>
          </template>
        </n-empty>
      </div>

      <div v-else class="stats-grid">
        <!-- 主要统计指标 -->
        <div class="main-stats">
          <div v-for="stat in mainStats" :key="stat.key" class="stat-card">
            <div class="stat-header">
              <n-icon size="14" :color="stat.color">
                <component :is="stat.icon" />
              </n-icon>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            <div class="stat-value">{{ stat.value }}</div>
            <div v-if="stat.change" class="stat-change" :class="stat.changeType">
              <n-icon size="12">
                <component :is="stat.changeIcon" />
              </n-icon>
              <span>{{ stat.change }}</span>
            </div>
          </div>
        </div>

        <!-- 数据源概览 -->
        <div class="data-sources-overview">
          <h4 class="overview-title">数据源概览</h4>
          <div class="sources-list">
            <div v-for="source in dataSources" :key="source.name" class="source-item">
              <div class="source-info">
                <div class="source-name">{{ source.name }}</div>
                <div class="source-count">{{ source.count }} 条记录</div>
              </div>
              <div class="source-status" :class="source.status">
                <n-icon size="12">
                  <CheckmarkCircleOutline v-if="source.status === 'active'" />
                  <AlertCircleOutline v-else />
                </n-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细统计 -->
        <div class="detailed-stats">
          <h4 class="overview-title">详细统计</h4>
          <div class="detail-list">
            <div v-for="detail in detailedStats" :key="detail.key" class="detail-item">
              <span class="detail-label">{{ detail.label }}</span>
              <span class="detail-value">{{ detail.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-collapse>
        <n-collapse-item title="统计调试信息">
          <div class="debug-content">
            <h4>原始数据源:</h4>
            <pre>{{ JSON.stringify(rawDataSources, null, 2) }}</pre>
            <h4>计算后统计:</h4>
            <pre>{{
              JSON.stringify(
                {
                  totalRecords,
                  activeDataSources,
                  averageValue,
                  latestUpdate: lastUpdateTime
                },
                null,
                2
              )
            }}</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 统计卡片组件
 * 用于展示多数据源的汇总统计信息
 */

import { ref, computed, watch } from 'vue'
import { NIcon, NEmpty, NText, NButton, NCollapse, NCollapseItem, useThemeVars } from 'naive-ui'
import {
  StatsChartOutline,
  AnalyticsOutline,
  RefreshOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  TrendingUpOutline,
  TrendingDownOutline,
  PeopleOutline,
  LayersOutline,
  TimeOutline,
  SpeedometerOutline
} from '@vicons/ionicons5'

// 数据源接口
interface DataSource {
  name: string
  data: any[]
  enabled: boolean
  lastUpdate?: string
}

// 统计项接口
interface StatItem {
  key: string
  label: string
  value: string
  color?: string
  icon?: any
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  changeIcon?: any
}

// 组件属性定义
interface Props {
  /** 组件标题 */
  title?: string
  /** 是否显示标题 */
  showTitle?: boolean
  /** 原始数据源列表 */
  rawDataSources?: DataSource[]
  /** 主要统计字段配置 */
  statsConfig?: {
    totalField?: string
    activeField?: string
    valueField?: string
  }
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '统计概览',
  showTitle: true,
  rawDataSources: () => [],
  statsConfig: () => ({
    totalField: 'total',
    activeField: 'active',
    valueField: 'value'
  }),
  showDebugInfo: false
})

// 主题变量
const themeVars = useThemeVars()

// 响应式数据
const statsData = ref({
  totalRecords: 0,
  activeDataSources: 0,
  averageValue: 0,
  lastUpdateTime: '',
  dataSources: [] as Array<{
    name: string
    count: number
    status: 'active' | 'inactive'
  }>
})

// 计算属性
const hasData = computed(() => {
  return props.rawDataSources && props.rawDataSources.length > 0
})

const totalRecords = computed(() => {
  return (
    props.rawDataSources?.reduce((sum, source) => {
      return sum + (source.data?.length || 0)
    }, 0) || 0
  )
})

const activeDataSources = computed(() => {
  return props.rawDataSources?.filter(source => source.enabled).length || 0
})

const averageValue = computed(() => {
  let totalValues = 0
  let valueCount = 0

  props.rawDataSources?.forEach(source => {
    if (source.enabled && source.data) {
      source.data.forEach(item => {
        const value = parseFloat(item[props.statsConfig?.valueField || 'value'])
        if (!isNaN(value)) {
          totalValues += value
          valueCount++
        }
      })
    }
  })

  return valueCount > 0 ? (totalValues / valueCount).toFixed(2) : '0.00'
})

const lastUpdateTime = computed(() => {
  const timestamps = props.rawDataSources?.map(source => source.lastUpdate || new Date().toISOString()) || []

  if (timestamps.length === 0) return '-'

  const latest = new Date(Math.max(...timestamps.map(t => new Date(t).getTime())))
  return latest.toLocaleString('zh-CN')
})

const dataSources = computed(() => {
  return (
    props.rawDataSources?.map(source => ({
      name: source.name || '未命名数据源',
      count: source.data?.length || 0,
      status: source.enabled && (source.data?.length || 0) > 0 ? ('active' as const) : ('inactive' as const)
    })) || []
  )
})

const mainStats = computed((): StatItem[] => [
  {
    key: 'total',
    label: '总记录数',
    value: totalRecords.value.toLocaleString(),
    color: themeVars.value.primaryColor,
    icon: LayersOutline,
    change: `来自 ${props.rawDataSources?.length || 0} 个数据源`,
    changeType: 'neutral' as const,
    changeIcon: PeopleOutline
  },
  {
    key: 'active',
    label: '活跃数据源',
    value: `${activeDataSources.value}/${props.rawDataSources?.length || 0}`,
    color: themeVars.value.successColor,
    icon: CheckmarkCircleOutline,
    change: `${((activeDataSources.value / (props.rawDataSources?.length || 1)) * 100).toFixed(1)}% 活跃`,
    changeType: activeDataSources.value > (props.rawDataSources?.length || 0) / 2 ? 'positive' : 'negative',
    changeIcon:
      activeDataSources.value > (props.rawDataSources?.length || 0) / 2 ? TrendingUpOutline : TrendingDownOutline
  },
  {
    key: 'average',
    label: '平均值',
    value: averageValue.value,
    color: themeVars.value.infoColor,
    icon: SpeedometerOutline,
    change: '跨数据源计算',
    changeType: 'neutral' as const,
    changeIcon: AnalyticsOutline
  },
  {
    key: 'update',
    label: '最后更新',
    value: lastUpdateTime.value,
    color: themeVars.value.warningColor,
    icon: TimeOutline,
    change: '实时同步',
    changeType: 'neutral' as const,
    changeIcon: RefreshOutline
  }
])

const detailedStats = computed(() => {
  const stats: Array<{ key: string; label: string; value: string }> = []

  // 数据源统计
  const enabledSources = props.rawDataSources?.filter(s => s.enabled) || []
  const disabledSources = props.rawDataSources?.filter(s => !s.enabled) || []

  stats.push(
    { key: 'enabled_sources', label: '启用的数据源', value: `${enabledSources.length} 个` },
    { key: 'disabled_sources', label: '禁用的数据源', value: `${disabledSources.length} 个` }
  )

  // 数据量统计
  if (totalRecords.value > 0) {
    const maxRecords = Math.max(...dataSources.value.map(s => s.count))
    const minRecords = Math.min(...dataSources.value.map(s => s.count))

    stats.push(
      { key: 'max_records', label: '单源最大记录', value: `${maxRecords} 条` },
      { key: 'min_records', label: '单源最小记录', value: `${minRecords} 条` },
      {
        key: 'avg_records',
        label: '单源平均记录',
        value: `${Math.round(totalRecords.value / dataSources.value.length)} 条`
      }
    )
  }

  return stats
})

/**
 * 刷新统计信息
 */
const refreshStats = () => {
  // 触发重新计算
  processData()
}

/**
 * 处理数据
 */
const processData = () => {
  // 这里可以添加数据处理逻辑
  // 目前主要通过计算属性实时计算
}

// 监听数据变化
watch(
  () => props.rawDataSources,
  () => {
    processData()
  },
  { immediate: true, deep: true }
)

// 暴露方法给父组件
defineExpose({
  refresh: refreshStats,
  getStats: () => ({
    total: totalRecords.value,
    active: activeDataSources.value,
    average: parseFloat(averageValue.value),
    lastUpdate: lastUpdateTime.value,
    dataSources: dataSources.value
  })
})
</script>

<style scoped>
.statistics-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

/* === 组件标题 === */
.component-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.title-icon {
  color: var(--primary-color);
}

.title-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.title-actions {
  display: flex;
  gap: 4px;
}

/* === 统计内容 === */
.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-data {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* === 主要统计 === */
.main-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: var(--hover-color-suppl);
  border-color: var(--primary-color-suppl);
  transform: translateY(-1px);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-2);
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
  font-family: monospace;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
}

.stat-change.positive {
  color: var(--success-color);
}

.stat-change.negative {
  color: var(--error-color);
}

.stat-change.neutral {
  color: var(--text-color-3);
}

/* === 数据源概览 === */
.data-sources-overview,
.detailed-stats {
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 12px;
}

.overview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sources-list,
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.source-info {
  flex: 1;
}

.source-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
}

.source-count {
  font-size: 10px;
  color: var(--text-color-2);
  font-family: monospace;
}

.source-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.source-status.active {
  color: var(--success-color);
  background: var(--success-color-suppl);
}

.source-status.inactive {
  color: var(--error-color);
  background: var(--error-color-suppl);
}

/* === 详细统计 === */
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 11px;
  color: var(--text-color-2);
  font-weight: 500;
}

.detail-value {
  font-size: 11px;
  color: var(--text-color);
  font-family: monospace;
}

/* === 调试信息 === */
.debug-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

.debug-content {
  font-size: 12px;
}

.debug-content h4 {
  margin: 8px 0 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
}

.debug-content pre {
  background: var(--code-color);
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 150px;
  overflow-y: auto;
  margin: 4px 0 8px 0;
  border: 1px solid var(--border-color);
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .main-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .stats-grid {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .statistics-card {
    padding: 8px;
  }

  .main-stats {
    grid-template-columns: 1fr 1fr;
  }

  .stat-value {
    font-size: 16px;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .statistics-card {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .component-title {
  border-color: var(--divider-color-dark);
}

[data-theme='dark'] .stat-card,
[data-theme='dark'] .data-sources-overview,
[data-theme='dark'] .detailed-stats,
[data-theme='dark'] .source-item {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .stat-card:hover {
  background: var(--hover-color-suppl-dark);
}

[data-theme='dark'] .debug-content pre {
  background: var(--code-color-dark);
  border-color: var(--border-color-dark);
}
</style>
