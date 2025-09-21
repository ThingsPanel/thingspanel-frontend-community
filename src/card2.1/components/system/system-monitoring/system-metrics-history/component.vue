<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
          <Icon icon="mdi:chart-line" class="text-lg text-orange-600 dark:text-orange-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.systemMetricsHistory.title') }}
        </h3>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="flex-1 p-4 min-h-0">
      <n-spin :show="loading">
        <div class="h-full relative">
          <!-- 错误状态 -->
          <div v-if="!loading && errorMsg" class="h-full flex flex-col items-center justify-center text-center">
            <div class="p-4 bg-red-100 dark:bg-red-900 rounded-full mb-3">
              <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <div class="text-sm text-red-600 dark:text-red-400">
              {{ errorMsg }}
            </div>
          </div>

          <!-- 无数据状态 -->
          <div v-else-if="!loading && isEmpty" class="h-full flex flex-col items-center justify-center text-center">
            <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
              <Icon icon="mdi:chart-line-variant" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('card.noData') }}
            </div>
          </div>

          <!-- 图表 -->
          <v-chart
            v-else-if="!loading"
            ref="chartRef"
            class="w-full h-full"
            :option="chartOption"
            autoresize
          />
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统指标历史组件
 * 显示系统CPU、内存、磁盘使用率的历史趋势图表
 */
import { ref, onMounted, computed, provide } from 'vue'
import { Icon } from '@iconify/vue'
import { NSpin } from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useThemeStore } from '@/store/modules/theme'
import { getSystemMetricsHistory } from '@/service/api/system-data'
import { $t } from '@/locales'
import dayjs from 'dayjs'

// ECharts 组件注册
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
])

const themeStore = useThemeStore()
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const isEmpty = ref(false)
const chartOption = ref({})
const chartRef = ref<any>(null)

// 提供 ECharts 主题
provide(
  THEME_KEY,
  computed(() => themeStore.naiveThemeName)
)

/**
 * 处理API数据
 */
const processData = (
  apiData: any
): { timeAxis: string[]; timestamps: number[]; cpuData: number[]; memData: number[]; diskData: number[] } => {
  const timeAxis: string[] = []
  const timestamps: number[] = []
  const cpuData: number[] = []
  const memData: number[] = []
  const diskData: number[] = []

  if (Array.isArray(apiData)) {
    apiData.forEach(item => {
      const timestampMs = dayjs(item.timestamp).valueOf()
      timestamps.push(timestampMs)
      timeAxis.push(dayjs(timestampMs).format('HH:mm'))
      cpuData.push(Number(item.cpu?.toFixed(1)) || 0)
      memData.push(Number(item.memory?.toFixed(1)) || 0)
      diskData.push(Number(item.disk?.toFixed(1)) || 0)
    })
  } else {
    console.error('processData received unexpected data format:', apiData)
  }

  isEmpty.value = timeAxis.length === 0

  return { timeAxis, timestamps, cpuData, memData, diskData }
}

/**
 * 更新图表配置
 */
const updateChartOption = (processedData: {
  timeAxis: string[]
  timestamps: number[]
  cpuData: number[]
  memData: number[]
  diskData: number[]
}) => {
  const { timeAxis, timestamps, cpuData, memData, diskData } = processedData

  const cpuLabel = $t('card.cpuUsage', 'CPU')
  const memLabel = $t('card.memoryUsage', 'Memory')
  const diskLabel = $t('card.diskUsage', 'Disk')

  // 颜色配置
  const colors = ['#5470c6', '#91cc75', '#fac858']

  // 渐变填充色配置
  const areaColors = [
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(84, 112, 198, 0.2)' },
        { offset: 1, color: 'rgba(84, 112, 198, 0.02)' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(145, 204, 117, 0.2)' },
        { offset: 1, color: 'rgba(145, 204, 117, 0.02)' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(250, 200, 88, 0.2)' },
        { offset: 1, color: 'rgba(250, 200, 88, 0.02)' }
      ]
    }
  ]

  chartOption.value = {
    color: colors,
    tooltip: {
      trigger: 'axis',
      backgroundColor: themeStore.isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: themeStore.isDark ? '#555' : '#ddd',
      borderWidth: 1,
      textStyle: {
        color: themeStore.isDark ? '#ccc' : '#333',
        fontSize: 12
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const dataIndex = params[0].dataIndex
        const timeStr = dayjs(timestamps[dataIndex]).format('MM-DD HH:mm:ss')
        let tooltipHtml = `<div style="margin-bottom: 4px; font-weight: bold;">${timeStr}</div>`
        params.forEach((param: any) => {
          tooltipHtml += `<div>${param.marker} ${param.seriesName}: <span style="font-weight: bold;">${param.value?.toFixed(1)}%</span></div>`
        })
        return tooltipHtml
      }
    },
    legend: {
      data: [cpuLabel, memLabel, diskLabel],
      top: 10,
      icon: 'circle',
      itemHeight: 8,
      itemGap: 20,
      textStyle: {
        color: themeStore.isDark ? '#ccc' : '#666',
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '20%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeAxis,
      axisLine: {
        lineStyle: {
          color: themeStore.isDark ? '#555' : '#e1e5e9'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: themeStore.isDark ? '#aaa' : '#666',
        fontSize: 11
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: themeStore.isDark ? '#aaa' : '#666',
        fontSize: 11
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: themeStore.isDark ? '#333' : '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: cpuLabel,
        type: 'line',
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          shadowColor: 'rgba(84, 112, 198, 0.3)',
          shadowBlur: 4
        },
        areaStyle: areaColors[0],
        emphasis: {
          focus: 'series'
        },
        data: cpuData
      },
      {
        name: memLabel,
        type: 'line',
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          shadowColor: 'rgba(145, 204, 117, 0.3)',
          shadowBlur: 4
        },
        areaStyle: areaColors[1],
        emphasis: {
          focus: 'series'
        },
        data: memData
      },
      {
        name: diskLabel,
        type: 'line',
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          shadowColor: 'rgba(250, 200, 88, 0.3)',
          shadowBlur: 4
        },
        areaStyle: areaColors[2],
        emphasis: {
          focus: 'series'
        },
        data: diskData
      }
    ]
  }
}

/**
 * 获取系统指标数据
 */
const fetchData = async () => {
  loading.value = true
  errorMsg.value = null
  isEmpty.value = false

  try {
    const params = {}
    const response = await getSystemMetricsHistory(params)
    const dataArray = response?.data

    if (dataArray) {
      const processed = processData(dataArray)
      updateChartOption(processed)
    } else {
      console.error('No data array found in API response:', response)
      isEmpty.value = true
    }
  } catch (err: any) {
    console.error('Error processing system metrics history:', err)
    errorMsg.value = $t('common.loadFailure', 'Failed to load data')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'SystemMetricsHistoryCard21'
})
</script>

<style scoped>
/* 确保图表响应式 */
:deep(.echarts) {
  min-height: 200px;
}

/* 深色模式适配 */
:deep(.dark) {
  .echarts {
    color-scheme: dark;
  }
}
</style>