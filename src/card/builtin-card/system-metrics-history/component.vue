<template>
  <div class="p-4 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
    <h3 class="text-base font-semibold mb-3 text-gray-800 dark:text-gray-100 flex-shrink-0">
      {{ $t('card.systemMetricsHistory.title') }}
    </h3>
    <div class="flex-grow relative min-h-[200px]">
      <v-chart v-if="!loading" ref="chartRef" class="w-full h-full" :option="chartOption" autoresize />
      <div v-if="!loading && errorMsg" class="h-full flex items-center justify-center text-red-500">
        {{ errorMsg }}
      </div>
      <div v-if="!loading && !errorMsg && isEmpty" class="h-full flex items-center justify-center">
        <NEmpty :description="$t('card.noData')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, provide, watch } from 'vue'
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
import { NSpin, NEmpty } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { getSystemMetricsHistory } from '@/service/api/system-data'
import { $t } from '@/locales'
import dayjs from 'dayjs'

// ECharts components registration
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

// Provide ECharts theme
provide(
  THEME_KEY,
  computed(() => themeStore.naiveThemeName)
)

// Updated data processing function
const processData = (
  apiData: any
): { timeAxis: string[]; timestamps: number[]; cpuData: number[]; memData: number[]; diskData: number[] } => {
  const timeAxis: string[] = []
  const timestamps: number[] = [] // Store full timestamps for tooltip
  const cpuData: number[] = []
  const memData: number[] = []
  const diskData: number[] = []

  if (Array.isArray(apiData)) {
    apiData.forEach(item => {
      const timestampMs = dayjs(item.timestamp).valueOf()
      timestamps.push(timestampMs)
      // --- Change X-axis label format ---
      timeAxis.push(dayjs(timestampMs).format('HH:mm'))
      cpuData.push(Number(item.cpu?.toFixed(1)) || 0) // Format to 1 decimal place
      memData.push(Number(item.memory?.toFixed(1)) || 0)
      diskData.push(Number(item.disk?.toFixed(1)) || 0)
    })
  } else {
    console.warn('processData received unexpected data format:', apiData)
  }

  isEmpty.value = timeAxis.length === 0

  // Pass timestamps along for tooltip usage
  return { timeAxis, timestamps, cpuData, memData, diskData }
}

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

  // --- 1. Refined Color Palette ---
  const colors = ['#5470c6', '#91cc75', '#fac858'] // Example: Blue, Green, Yellow/Orange (ECharts default can be okay too, or choose others)
  // Or use theme-based colors if available
  // const colors = [themeStore.themeVars.primaryColor, themeStore.themeVars.infoColor, themeStore.themeVars.warningColor];

  // --- Define gradient colors for area fill ---
  const areaColors = [
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
        { offset: 1, color: 'rgba(84, 112, 198, 0)' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(145, 204, 117, 0.3)' },
        { offset: 1, color: 'rgba(145, 204, 117, 0)' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(250, 200, 88, 0.3)' },
        { offset: 1, color: 'rgba(250, 200, 88, 0)' }
      ]
    }
  ]

  chartOption.value = {
    color: colors,
    tooltip: {
      trigger: 'axis',
      // --- 4. Improved Tooltip Style ---
      backgroundColor: themeStore.isDark ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: themeStore.isDark ? '#555' : '#ddd',
      borderWidth: 1,
      textStyle: {
        color: themeStore.isDark ? '#ccc' : '#333',
        fontSize: 12
      },
      formatter: (params: any) => {
        // Keep the formatter
        if (!params || params.length === 0) return ''
        const dataIndex = params[0].dataIndex
        const timeStr = dayjs(timestamps[dataIndex]).format('MMM D YYYY HH:mm:ss')
        let tooltipHtml = `${timeStr}<br/>`
        params.forEach((param: any) => {
          tooltipHtml += `${param.marker} ${param.seriesName} &nbsp;&nbsp;<b>${param.value?.toFixed(1)}%</b><br/>` // Ensure value exists and format
        })
        return tooltipHtml
      }
    },
    legend: {
      data: [cpuLabel, memLabel, diskLabel],
      top: 5,
      icon: 'circle',
      itemHeight: 8, // Smaller legend icon
      itemGap: 15, // Increase gap
      // --- 5. Refined Legend Text Style ---
      textStyle: {
        color: themeStore.isDark ? '#ccc' : '#666',
        fontSize: 12
      }
    },
    grid: {
      left: '2%', // Slightly adjust margins if needed
      right: '3%',
      top: 45,
      bottom: '15%',
      containLabel: true
    },
    // --- 7. Remove Toolbox ---
    // toolbox: { feature: { saveAsImage: {} } },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeAxis,
      // --- 3. Simplified Axis Style ---
      axisLine: { lineStyle: { color: themeStore.isDark ? '#555' : '#ddd' } },
      axisTick: { show: false },
      axisLabel: { color: themeStore.isDark ? '#aaa' : '#888', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: themeStore.isDark ? '#aaa' : '#888', fontSize: 11 },
      // --- 3. Simplify Axis - Hide line, make grid subtle ---
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: themeStore.isDark ? '#333' : '#eee', type: 'dashed' } }
    },

    series: [
      {
        name: cpuLabel,
        type: 'line',
        smooth: 0.6, // Keep smooth, adjust smoothing factor if desired
        symbol: 'none', // Hide data points by default
        lineStyle: { width: 2 },
        // --- 2. Area Fill ---
        areaStyle: { color: areaColors[0], origin: 'start' },
        emphasis: { focus: 'series' }, // Highlight series on hover
        data: cpuData
      },
      {
        name: memLabel,
        type: 'line',
        smooth: 0.6,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { color: areaColors[1], origin: 'start' },
        emphasis: { focus: 'series' },
        data: memData
      },
      {
        name: diskLabel,
        type: 'line',
        smooth: 0.6,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { color: areaColors[2], origin: 'start' },
        emphasis: { focus: 'series' },
        data: diskData
      }
    ]
  }
}

const fetchData = async () => {
  loading.value = true
  errorMsg.value = null
  isEmpty.value = false
  try {
    const params = {}
    const response = await getSystemMetricsHistory(params)
    if (process.env.NODE_ENV === 'development') {
    }
    const dataArray = response?.data
    if (dataArray) {
      const processed = processData(dataArray)
      updateChartOption(processed)
    } else {
      console.warn('No data array found in API response:', response)
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
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
