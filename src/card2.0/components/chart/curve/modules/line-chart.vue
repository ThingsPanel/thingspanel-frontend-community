<template>
  <div class="line-chart-container">
    <!-- 时间选择器 -->
    <div v-if="config.timeRange?.showTimeSelector" class="time-selector">
      <n-date-picker
        v-model:value="selectedTimeRange"
        type="datetimerange"
        :shortcuts="timeShortcuts"
        @update:value="onTimeRangeChange"
      />
    </div>

    <!-- 聚合选择器 -->
    <div v-if="config.dataAggregation?.showAggregationSelector" class="aggregation-selector">
      <n-select
        v-model:value="selectedAggregation"
        :options="aggregationOptions"
        @update:value="onAggregationChange"
      />
    </div>

    <!-- ECharts 图表 -->
    <div ref="chartRef" class="chart-container" :style="{ height: chartHeight }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { NDatePicker, NSelect } from 'naive-ui'
import * as echarts from 'echarts'
import { getTelemetryData } from '@/service/api/device'
import type { ECharts } from 'echarts'
import type { LineChartConfig, TimeRange, AggregationFunction } from '../types'

// Props 定义
interface Props {
  config: LineChartConfig
  deviceId?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px'
})

// Emits 定义
const emit = defineEmits<{
  error: [error: Error]
  dataChange: [data: any[]]
  configChange: [config: LineChartConfig]
}>()

// 响应式数据
const chartRef = ref<HTMLElement>()
const chartInstance = ref<ECharts>()
const selectedTimeRange = ref<[number, number] | null>(null)
const selectedAggregation = ref<AggregationFunction>('avg')
const isLoading = ref(false)
const chartData = ref<any[]>([])

// 计算属性
const chartHeight = computed(() => props.height)

// 时间快捷选项
const timeShortcuts = [
  {
    label: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 60 * 60 * 1000)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    label: '最近24小时',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    label: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      return [start.getTime(), end.getTime()]
    }
  }
]

// 聚合函数选项
const aggregationOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

/**
 * 获取时间范围
 */
function getTimeRange(): TimeRange {
  if (selectedTimeRange.value) {
    return {
      start: new Date(selectedTimeRange.value[0]),
      end: new Date(selectedTimeRange.value[1])
    }
  }

  // 使用默认时间范围
  const defaultRange = props.config.timeRange?.defaultRange || '24h'
  const end = new Date()
  let start: Date

  switch (defaultRange) {
    case '1h':
      start = new Date(end.getTime() - 60 * 60 * 1000)
      break
    case '6h':
      start = new Date(end.getTime() - 6 * 60 * 60 * 1000)
      break
    case '12h':
      start = new Date(end.getTime() - 12 * 60 * 60 * 1000)
      break
    case '24h':
    default:
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  return { start, end }
}

/**
 * 获取遥测数据
 */
async function fetchTelemetryData() {
  if (!props.deviceId) {
    console.warn('LineChart: deviceId is required for data fetching')
    return
  }

  try {
    isLoading.value = true
    const timeRange = getTimeRange()
    const aggregation = selectedAggregation.value

    const response = await getTelemetryData({
      deviceId: props.deviceId,
      startTime: timeRange.start.toISOString(),
      endTime: timeRange.end.toISOString(),
      aggregation: props.config.dataAggregation?.enabled ? aggregation : undefined,
      window: props.config.dataAggregation?.defaultWindow || '1m'
    })

    chartData.value = response.data || []
    emit('dataChange', chartData.value)
    await nextTick()
    setSeries()
  } catch (error) {
    console.error('LineChart: Failed to fetch telemetry data:', error)
    emit('error', error as Error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 构建系列数据
 */
function buildSeries() {
  if (!chartData.value.length) {
    return []
  }

  // 获取所有属性键（除了时间戳）
  const sampleData = chartData.value[0]
  const keys = Object.keys(sampleData).filter(key => key !== 'timestamp' && key !== 'ts')

  return keys.map((key, index) => {
    const data = chartData.value.map(item => [
      new Date(item.timestamp || item.ts).getTime(),
      item[key]
    ])

    return {
      name: key,
      type: 'line',
      data,
      smooth: props.config.chart?.smooth ?? true,
      showSymbol: props.config.chart?.showDataPoints ?? true,
      symbolSize: props.config.chart?.dataPointSize ?? 4,
      lineStyle: {
        width: props.config.chart?.lineWidth ?? 2
      },
      areaStyle: props.config.chart?.showArea ? {} : undefined,
      itemStyle: {
        color: props.config.theme?.customColors?.[index] || undefined
      }
    }
  })
}

/**
 * 设置图表数据
 */
function setSeries() {
  if (!chartInstance.value) return

  const series = buildSeries()
  const option = {
    title: {
      text: props.config.title || '曲线图',
      show: props.config.chart?.showTitle ?? true
    },
    tooltip: {
      trigger: 'axis',
      show: props.config.chart?.showTooltip ?? true,
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      show: props.config.chart?.showLegend ?? true,
      type: 'scroll'
    },
    grid: {
      left: props.config.grid?.left ?? '3%',
      right: props.config.grid?.right ?? '4%',
      bottom: props.config.grid?.bottom ?? '3%',
      top: props.config.grid?.top ?? '10%',
      containLabel: props.config.grid?.containLabel ?? true
    },
    dataZoom: props.config.chart?.enableDataZoom ? [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ] : undefined,
    xAxis: {
      type: 'time',
      show: props.config.axes?.showXAxis ?? true,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      show: props.config.axes?.showYAxis ?? true
    },
    series
  }

  chartInstance.value.setOption(option, true)
}

/**
 * 初始化图表
 */
function initChart() {
  if (!chartRef.value) return

  chartInstance.value = echarts.init(chartRef.value)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 初始化数据
  fetchTelemetryData()
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  chartInstance.value?.resize()
}

/**
 * 时间范围变化处理
 */
function onTimeRangeChange() {
  fetchTelemetryData()
}

/**
 * 聚合函数变化处理
 */
function onAggregationChange() {
  fetchTelemetryData()
}

/**
 * 更新数据（外部调用）
 */
function updateData() {
  fetchTelemetryData()
}

/**
 * 刷新图表（外部调用）
 */
function refreshChart() {
  if (chartInstance.value) {
    chartInstance.value.resize()
    setSeries()
  }
}

// 监听配置变化
watch(
  () => props.config,
  () => {
    setSeries()
    emit('configChange', props.config)
  },
  { deep: true }
)

// 监听设备ID变化
watch(
  () => props.deviceId,
  () => {
    if (props.deviceId) {
      fetchTelemetryData()
    }
  }
)

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})

// 暴露方法
defineExpose({
  updateData,
  refreshChart
})
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.time-selector,
.aggregation-selector {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-container {
  flex: 1;
  min-height: 200px;
}
</style>