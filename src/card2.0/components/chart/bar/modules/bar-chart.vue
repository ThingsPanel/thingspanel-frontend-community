<template>
  <div ref="chartContainer" class="bar-chart" :style="{ height: '100%', width: '100%' }">
    <!-- 时间选择器 -->
    <div v-if="!isAggregate && isTimeSelect" class="time-selector">
      <n-space>
        <n-select
          v-model:value="params.time"
          :options="timeOptions"
          style="width: 120px"
          @update:value="setSeries"
        />
        <n-date-picker
          v-if="params.time === 'custom'"
          v-model:value="dateRange"
          type="datetimerange"
          clearable
          @update:value="setSeries"
        />
      </n-space>
    </div>

    <!-- 聚合选择器 -->
    <div v-if="isAggregate" class="aggregate-selector">
      <n-space>
        <n-select
          v-model:value="params.aggregate_window"
          :options="aggregateOptions"
          style="width: 120px"
          @update:value="updateAggregate"
        />
        <n-select
          v-model:value="params.aggregate_function"
          :options="aggregateFunctionOptions"
          style="width: 100px"
          @update:value="setSeries"
        />
        <n-select
          v-model:value="params.time"
          :options="timeOptions"
          style="width: 120px"
          @update:value="setSeries"
        />
        <n-date-picker
          v-if="params.time === 'custom'"
          v-model:value="dateRange"
          type="datetimerange"
          clearable
          @update:value="setSeries"
        />
      </n-space>
    </div>

    <!-- ECharts 图表 -->
    <v-chart
      ref="chartRef"
      class="chart"
      :option="option"
      :theme="theme"
      autoresize
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { NSpace, NSelect, NDatePicker } from 'naive-ui'
import { cloneDeep } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { format, subHours, subDays, subMonths } from 'date-fns'
import { $t } from '@/locales'
import { createLogger } from '@/utils/logger'
import { telemetryDataCurrentKeys, telemetryDataHistoryList } from '@/api/device'
import type { CardInstance } from '../../../../core/types'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

const logger = createLogger('BarChart')

// Props
interface Props {
  card: CardInstance
  colorGroup?: Array<{ top: string; bottom: string }>
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  colorGroup: () => [
    { top: '#409EFF', bottom: '#79bbff' },
    { top: '#67C23A', bottom: '#95d475' },
    { top: '#E6A23C', bottom: '#eebe77' },
    { top: '#F56C6C', bottom: '#f89898' },
    { top: '#909399', bottom: '#b1b3b8' }
  ],
  theme: 'light'
})

// Emits
const emit = defineEmits<{
  error: [error: Error]
}>()

// Refs
const chartContainer = ref<HTMLElement>()
const chartRef = ref<InstanceType<typeof VChart>>()

// Reactive data
const isAggregate = ref(false)
const isTimeSelect = ref(true)
const dateRange = ref<[number, number] | null>(null)
const legendColor = ref('#606266')
const detail = ref<any[]>([])
const sampleData = ref<any[]>([])
const legendData = ref<string[]>([])
const name = ref('')

// 初始时间参数
const params = reactive({
  time: '1h',
  aggregate_window: 'no_aggregate',
  aggregate_function: 'avg'
})

// 时间选项
const timeOptions = [
  { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '3小时', value: '3h' },
  { label: '6小时', value: '6h' },
  { label: '12小时', value: '12h' },
  { label: '24小时', value: '24h' },
  { label: '3天', value: '3d' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '自定义', value: 'custom' }
]

// 聚合选项
const aggregateOptions = [
  { label: '不聚合', value: 'no_aggregate' },
  { label: '30秒', value: '30s' },
  { label: '1分钟', value: '1m' },
  { label: '2分钟', value: '2m' },
  { label: '5分钟', value: '5m' },
  { label: '10分钟', value: '10m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '3小时', value: '3h' },
  { label: '6小时', value: '6h' },
  { label: '1天', value: '1d' },
  { label: '7天', value: '7d' },
  { label: '1月', value: '1mo' }
]

// 聚合函数选项
const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '求和', value: 'sum' },
  { label: '差值', value: 'diff' }
]

// ECharts 配置
const option = ref({
  legend: {
    data: [],
    textStyle: {
      color: legendColor.value
    }
  },
  dataZoom: [
    {
      type: 'slider',
      show: true,
      xAxisIndex: [0],
      start: 0,
      end: 100
    },
    {
      type: 'inside',
      xAxisIndex: [0],
      start: 0,
      end: 100
    }
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: '50px',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    axisLabel: {
      color: legendColor.value
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: legendColor.value
    }
  },
  series: []
})

// 更新图例颜色
const updateLegendColor = () => {
  const isDark = props.theme === 'dark'
  legendColor.value = isDark ? '#ffffff' : '#606266'
  
  if (option.value.legend?.textStyle) {
    option.value.legend.textStyle.color = legendColor.value
  }
  if (option.value.xAxis?.axisLabel) {
    option.value.xAxis.axisLabel.color = legendColor.value
  }
  if (option.value.yAxis?.axisLabel) {
    option.value.yAxis.axisLabel.color = legendColor.value
  }
}

// 更新聚合设置
const updateAggregate = () => {
  isAggregate.value = params.aggregate_window !== 'no_aggregate'
  
  // 根据时间范围禁用不合适的聚合选项
  const timeValue = params.time
  const disabledOptions = new Set()
  
  if (['15m', '30m', '1h'].includes(timeValue)) {
    disabledOptions.add('1h')
    disabledOptions.add('3h')
    disabledOptions.add('6h')
    disabledOptions.add('1d')
    disabledOptions.add('7d')
    disabledOptions.add('1mo')
  } else if (['3h', '6h', '12h'].includes(timeValue)) {
    disabledOptions.add('3h')
    disabledOptions.add('6h')
    disabledOptions.add('1d')
    disabledOptions.add('7d')
    disabledOptions.add('1mo')
  }
  
  setSeries()
}

// 构建系列数据
const buildSeries = (data: any[], colorIndex: number) => {
  const colorConfig = props.colorGroup[colorIndex % props.colorGroup.length]
  
  return {
    name: data[0]?.name || `系列${colorIndex + 1}`,
    type: 'bar',
    stack: 'total',
    data: data.map(item => [item.timestamp, item.value]),
    itemStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: colorConfig.top },
          { offset: 1, color: colorConfig.bottom }
        ]
      }
    },
    emphasis: {
      focus: 'series'
    }
  }
}

// 获取遥测数据
const getTelemetryData = async (deviceId: string, keys: string[]) => {
  try {
    const timeRange = getTimeRange()
    const requestParams = {
      device_id: deviceId,
      keys: keys.join(','),
      start_time: timeRange.start,
      end_time: timeRange.end,
      ...params
    }
    
    const response = await telemetryDataHistoryList(requestParams)
    return response.data || []
  } catch (error) {
    logger.error('获取遥测数据失败:', error)
    emit('error', error as Error)
    return []
  }
}

// 获取时间范围
const getTimeRange = () => {
  if (params.time === 'custom' && dateRange.value) {
    return {
      start: dateRange.value[0],
      end: dateRange.value[1]
    }
  }
  
  const now = Date.now()
  const timeMap: Record<string, number> = {
    '15m': subHours(now, 0.25).getTime(),
    '30m': subHours(now, 0.5).getTime(),
    '1h': subHours(now, 1).getTime(),
    '3h': subHours(now, 3).getTime(),
    '6h': subHours(now, 6).getTime(),
    '12h': subHours(now, 12).getTime(),
    '24h': subDays(now, 1).getTime(),
    '3d': subDays(now, 3).getTime(),
    '7d': subDays(now, 7).getTime(),
    '30d': subMonths(now, 1).getTime()
  }
  
  return {
    start: timeMap[params.time] || subHours(now, 1).getTime(),
    end: now
  }
}

// 设置系列数据
const setSeries = async () => {
  try {
    if (!props.card?.config?.dataSource) {
      logger.warn('未配置数据源')
      return
    }
    
    const dataSource = props.card.config.dataSource
    const series: any[] = []
    const legends: string[] = []
    
    if (dataSource.type === 'device' && dataSource.devices?.length > 0) {
      // 处理设备数据源
      const promises = dataSource.devices.map(async (device: any, index: number) => {
        if (!device.device_id || !device.keys?.length) return null
        
        // 获取设备详情
        const deviceDetail = await telemetryDataCurrentKeys({
          device_id: device.device_id,
          keys: device.keys.join(',')
        })
        
        // 获取历史数据
        const historyData = await getTelemetryData(device.device_id, device.keys)
        
        if (historyData.length > 0) {
          const seriesData = buildSeries(historyData, index)
          series.push(seriesData)
          legends.push(seriesData.name)
        }
        
        return { device, historyData, deviceDetail }
      })
      
      await Promise.all(promises)
    } else if (dataSource.type === 'static' && dataSource.data?.length > 0) {
      // 处理静态数据源
      dataSource.data.forEach((item: any, index: number) => {
        const seriesData = buildSeries([item], index)
        series.push(seriesData)
        legends.push(seriesData.name)
      })
    }
    
    // 更新图表配置
    option.value.series = series
    option.value.legend.data = legends
    
    logger.info('图表数据更新完成', { seriesCount: series.length })
  } catch (error) {
    logger.error('设置系列数据失败:', error)
    emit('error', error as Error)
  }
}

// 更新数据
const updateData = (newData?: any[]) => {
  if (isAggregate.value) {
    logger.info('聚合模式下不支持实时数据更新')
    return
  }
  
  if (newData && newData.length > 0) {
    sampleData.value = newData
    setSeries()
  }
}

// 刷新图表
const refreshChart = () => {
  setSeries()
}

// 监听主题变化
watch(
  () => props.theme,
  () => {
    updateLegendColor()
  },
  { immediate: true }
)

// 监听卡片配置变化
watch(
  () => props.card?.config,
  () => {
    setSeries()
  },
  { deep: true }
)

// 组件挂载
onMounted(async () => {
  await nextTick()
  updateLegendColor()
  setSeries()
})

// 暴露方法
defineExpose({
  updateData,
  refreshChart
})
</script>

<style scoped>
.bar-chart {
  position: relative;
  height: 100%;
  width: 100%;
}

.time-selector,
.aggregate-selector {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart {
  height: 100%;
  width: 100%;
}
</style>