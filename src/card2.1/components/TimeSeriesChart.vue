<template>
  <div class="time-series-chart">
    <!-- 组件标题 -->
    <div v-if="showTitle" class="component-title">
      <n-icon size="16" class="title-icon">
        <TrendingUpOutline />
      </n-icon>
      <span class="title-text">{{ title || '时间序列图表' }}</span>
      <div class="title-actions">
        <n-button size="tiny" quaternary @click="refreshChart">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <div v-if="!hasData" class="no-data">
        <n-empty size="small" description="暂无图表数据">
          <template #icon>
            <n-icon><BarChartOutline /></n-icon>
          </template>
          <template #extra>
            <n-text depth="3">请配置时间序列数据源</n-text>
          </template>
        </n-empty>
      </div>

      <div v-else class="chart-content">
        <!-- 数据统计 -->
        <div class="chart-stats">
          <div class="stat-item">
            <span class="stat-label">数据点:</span>
            <span class="stat-value">{{ chartData.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最新值:</span>
            <span class="stat-value">{{ latestValue }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均值:</span>
            <span class="stat-value">{{ averageValue }}</span>
          </div>
        </div>

        <!-- 模拟图表 -->
        <div class="mock-chart">
          <div class="chart-y-axis">
            <div class="y-label">{{ maxValue }}</div>
            <div class="y-label">{{ midValue }}</div>
            <div class="y-label">{{ minValue }}</div>
          </div>
          <div class="chart-area">
            <svg class="chart-svg" viewBox="0 0 300 150">
              <!-- 网格线 -->
              <defs>
                <pattern id="grid" width="30" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 15" fill="none" :stroke="gridColor" stroke-width="0.5" />
                </pattern>
              </defs>
              <rect width="300" height="150" fill="url(#grid)" opacity="0.3" />

              <!-- 数据线 -->
              <polyline
                :points="chartPoints"
                fill="none"
                :stroke="lineColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- 数据点 -->
              <circle
                v-for="(point, index) in parsedPoints"
                :key="index"
                :cx="point.x"
                :cy="point.y"
                r="3"
                :fill="pointColor"
                :stroke="lineColor"
                stroke-width="1"
              />
            </svg>
          </div>
        </div>

        <!-- 时间轴 -->
        <div class="chart-x-axis">
          <div class="x-label">{{ timeRange.start }}</div>
          <div class="x-label">{{ timeRange.middle }}</div>
          <div class="x-label">{{ timeRange.end }}</div>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-collapse>
        <n-collapse-item title="图表调试信息">
          <div class="debug-content">
            <h4>原始数据 ({{ rawData?.length || 0 }} 条):</h4>
            <pre>{{ JSON.stringify(rawData?.slice(0, 5), null, 2) }}</pre>
            <h4>处理后数据 ({{ chartData.length }} 条):</h4>
            <pre>{{ JSON.stringify(chartData.slice(0, 5), null, 2) }}</pre>
            <h4>统计信息:</h4>
            <pre>{{
              JSON.stringify(
                {
                  count: chartData.length,
                  min: minValue,
                  max: maxValue,
                  avg: averageValue,
                  latest: latestValue
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
 * 时间序列图表组件
 * 用于展示时间序列数据的趋势图表
 */

import { ref, computed, watch } from 'vue'
import { NIcon, NEmpty, NText, NButton, NCollapse, NCollapseItem, useThemeVars } from 'naive-ui'
import { TrendingUpOutline, BarChartOutline, RefreshOutline } from '@vicons/ionicons5'

// 数据点接口
interface DataPoint {
  time: string | number | Date
  value: number
  label?: string
}

// 组件属性定义
interface Props {
  /** 组件标题 */
  title?: string
  /** 是否显示标题 */
  showTitle?: boolean
  /** 原始数据 */
  rawData?: any[]
  /** 时间字段名 */
  timeField?: string
  /** 数值字段名 */
  valueField?: string
  /** 标签字段名 */
  labelField?: string
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
  /** 图表颜色 */
  chartColors?: {
    line?: string
    point?: string
    grid?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  title: '时间序列图表',
  showTitle: true,
  rawData: () => [],
  timeField: 'time',
  valueField: 'value',
  labelField: 'label',
  showDebugInfo: false,
  chartColors: () => ({})
})

// 主题变量
const themeVars = useThemeVars()

// 响应式数据
const chartData = ref<DataPoint[]>([])

// 计算属性
const hasData = computed(() => {
  return chartData.value && chartData.value.length > 0
})

const latestValue = computed(() => {
  if (!hasData.value) return '-'
  return chartData.value[chartData.value.length - 1].value.toFixed(2)
})

const averageValue = computed(() => {
  if (!hasData.value) return '-'
  const sum = chartData.value.reduce((acc, item) => acc + item.value, 0)
  return (sum / chartData.value.length).toFixed(2)
})

const minValue = computed(() => {
  if (!hasData.value) return 0
  return Math.min(...chartData.value.map(item => item.value)).toFixed(2)
})

const maxValue = computed(() => {
  if (!hasData.value) return 100
  return Math.max(...chartData.value.map(item => item.value)).toFixed(2)
})

const midValue = computed(() => {
  const min = parseFloat(minValue.value)
  const max = parseFloat(maxValue.value)
  return ((min + max) / 2).toFixed(2)
})

const timeRange = computed(() => {
  if (!hasData.value) {
    return { start: '-', middle: '-', end: '-' }
  }

  const times = chartData.value.map(item => new Date(item.time))
  const startTime = times[0]
  const endTime = times[times.length - 1]
  const middleTime = new Date((startTime.getTime() + endTime.getTime()) / 2)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    start: formatTime(startTime),
    middle: formatTime(middleTime),
    end: formatTime(endTime)
  }
})

// 图表颜色
const lineColor = computed(() => {
  return props.chartColors?.line || themeVars.value.primaryColor
})

const pointColor = computed(() => {
  return props.chartColors?.point || themeVars.value.primaryColorSuppl
})

const gridColor = computed(() => {
  return props.chartColors?.grid || themeVars.value.dividerColor
})

// 生成SVG路径点
const chartPoints = computed(() => {
  if (!hasData.value) return ''

  const minVal = parseFloat(minValue.value)
  const maxVal = parseFloat(maxValue.value)
  const range = maxVal - minVal || 1

  const points = chartData.value.map((item, index) => {
    const x = (index / (chartData.value.length - 1)) * 300
    const y = 150 - ((item.value - minVal) / range) * 150
    return `${x},${y}`
  })

  return points.join(' ')
})

const parsedPoints = computed(() => {
  if (!hasData.value) return []

  const minVal = parseFloat(minValue.value)
  const maxVal = parseFloat(maxValue.value)
  const range = maxVal - minVal || 1

  return chartData.value.map((item, index) => ({
    x: (index / (chartData.value.length - 1)) * 300,
    y: 150 - ((item.value - minVal) / range) * 150
  }))
})

/**
 * 处理原始数据
 */
const processRawData = () => {
  if (!props.rawData || !Array.isArray(props.rawData) || props.rawData.length === 0) {
    chartData.value = []
    return
  }

  const processed: DataPoint[] = []

  props.rawData.forEach((item, index) => {
    let time: string | number | Date
    let value: number
    let label: string | undefined

    if (typeof item === 'object' && item !== null) {
      // 提取时间
      time = item[props.timeField] || index
      // 提取数值
      value = parseFloat(item[props.valueField]) || 0
      // 提取标签
      label = item[props.labelField]
    } else if (typeof item === 'number') {
      time = index
      value = item
    } else {
      return // 跳过无效数据
    }

    // 验证数值
    if (isNaN(value)) {
      value = 0
    }

    processed.push({
      time,
      value,
      label
    })
  })

  // 按时间排序
  processed.sort((a, b) => {
    const timeA = new Date(a.time).getTime() || 0
    const timeB = new Date(b.time).getTime() || 0
    return timeA - timeB
  })

  chartData.value = processed
}

/**
 * 刷新图表
 */
const refreshChart = () => {
  processRawData()
}

// 监听数据变化
watch(
  () => props.rawData,
  () => {
    processRawData()
  },
  { immediate: true, deep: true }
)

watch([() => props.timeField, () => props.valueField, () => props.labelField], () => {
  processRawData()
})

// 暴露方法给父组件
defineExpose({
  refresh: refreshChart,
  getData: () => chartData.value,
  getStats: () => ({
    count: chartData.value.length,
    min: parseFloat(minValue.value),
    max: parseFloat(maxValue.value),
    avg: parseFloat(averageValue.value),
    latest: parseFloat(latestValue.value)
  })
})
</script>

<style scoped>
.time-series-chart {
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

/* === 图表区域 === */
.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.no-data {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 数据统计 === */
.chart-stats {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-2);
  font-weight: 500;
}

.stat-value {
  font-size: 12px;
  color: var(--text-color);
  font-weight: 600;
  font-family: monospace;
}

/* === 模拟图表 === */
.mock-chart {
  flex: 1;
  display: flex;
  min-height: 150px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px;
  width: 40px;
  background: var(--hover-color);
  border-right: 1px solid var(--divider-color);
}

.y-label {
  font-size: 10px;
  color: var(--text-color-2);
  font-family: monospace;
}

.chart-area {
  flex: 1;
  position: relative;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 4px 48px;
  background: var(--hover-color);
  border-top: 1px solid var(--divider-color);
}

.x-label {
  font-size: 10px;
  color: var(--text-color-2);
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
@media (max-width: 480px) {
  .time-series-chart {
    padding: 8px;
  }

  .chart-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    justify-content: space-between;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .time-series-chart {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .component-title {
  border-color: var(--divider-color-dark);
}

[data-theme='dark'] .chart-stats,
[data-theme='dark'] .chart-y-axis,
[data-theme='dark'] .chart-x-axis {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .mock-chart {
  background: var(--body-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .debug-content pre {
  background: var(--code-color-dark);
  border-color: var(--border-color-dark);
}
</style>
