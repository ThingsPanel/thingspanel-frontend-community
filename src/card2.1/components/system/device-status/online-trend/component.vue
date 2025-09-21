<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
          <img :src="wifiIcon" alt="WiFi" class="w-5 h-5" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.onlineRate') }}
        </h3>
      </div>

      <!-- 在线率显示 -->
      <div class="flex items-center space-x-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
        <img :src="onlineRateIcon" alt="Online Rate" class="w-4 h-4" />
        <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
          {{ onlineRateText }}
        </span>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="flex-1 p-4 min-h-0">
      <div class="h-full relative">
        <VChart
          :option="chartOption"
          autoresize
          class="w-full h-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备在线趋势组件
 * 显示设备在线/离线数量趋势图表和在线率统计
 */
import { computed, onMounted, reactive, ref } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption
} from 'echarts/components'
import { getOnlineDeviceTrend } from '@/service/api/system-data'
import { $t } from '@/locales'

// 导入图标资源
import onlineRateIcon from './online-rate.png'
import wifiIcon from './wifi.png'

type EChartsOption = ComposeOption<
  TooltipComponentOption | LegendComponentOption | ToolboxComponentOption | GridComponentOption | LineSeriesOption
>

// 图表数据
const chartData = reactive({
  loading: false,
  online: [] as [number, number][],
  offline: [] as [number, number][]
})

// 图表配置
const chartOption = ref<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderColor: '#333',
    textStyle: {
      color: '#fff'
    },
    formatter(params: any) {
      const date = new Date(params[0].value[0])
      const dateStr = date.toLocaleString()
      let result = `<div style="margin-bottom: 4px; font-weight: bold;">${dateStr}</div>`

      params.forEach((param: any) => {
        const marker = `<span style="display:inline-block;margin-right:8px;border-radius:50%;width:8px;height:8px;background-color:${param.color};"></span>`
        result += `<div>${marker}${param.seriesName}: <span style="font-weight: bold;">${param.value[1]}</span></div>`
      })

      return result
    }
  },
  legend: {
    data: [$t('dashboard_panel.cardName.onLine'), $t('dashboard_panel.cardName.offline')],
    top: 10,
    textStyle: {
      color: '#666',
      fontSize: 12
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '8%',
    top: '20%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    boundaryGap: false,
    axisLine: {
      lineStyle: {
        color: '#e1e5e9'
      }
    },
    axisLabel: {
      formatter(value: number) {
        const date = new Date(value)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      },
      color: '#666',
      fontSize: 10
    },
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#e1e5e9'
      }
    },
    axisLabel: {
      color: '#666',
      fontSize: 10
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: $t('dashboard_panel.cardName.onLine'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: chartData.online,
      itemStyle: {
        color: '#67C23A'
      },
      lineStyle: {
        width: 2,
        shadowColor: 'rgba(103, 194, 58, 0.3)',
        shadowBlur: 4
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      }
    },
    {
      name: $t('dashboard_panel.cardName.offline'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: chartData.offline,
      itemStyle: {
        color: '#F56C6C'
      },
      lineStyle: {
        width: 2,
        shadowColor: 'rgba(245, 108, 108, 0.3)',
        shadowBlur: 4
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 108, 108, 0.15)' },
          { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }
        ])
      }
    }
  ]
})

/**
 * 计算在线率百分比
 */
const onlineRate = computed(() => {
  const latestDataPoint = chartData.online[chartData.online.length - 1]
  const latestOfflinePoint = chartData.offline[chartData.offline.length - 1]

  if (!latestDataPoint || !latestOfflinePoint) return 0

  const onlineCount = latestDataPoint[1]
  const offlineCount = latestOfflinePoint[1]
  const total = onlineCount + offlineCount

  return total > 0 ? Math.round((onlineCount / total) * 100) : 0
})

/**
 * 在线率文本
 */
const onlineRateText = computed(() => {
  return `${$t('dashboard_panel.cardName.onlineRate')} ${onlineRate.value}%`
})

/**
 * 获取趋势数据
 */
const fetchData = async () => {
  chartData.loading = true
  try {
    const response = await getOnlineDeviceTrend()
    if (response && response.data && response.data.points) {
      // 转换数据格式为 ECharts 期望的格式
      chartData.online = response.data.points.map((point: any) => {
        const timestamp = new Date(point.timestamp).getTime()
        return [timestamp, point.device_online]
      })

      chartData.offline = response.data.points.map((point: any) => {
        const timestamp = new Date(point.timestamp).getTime()
        return [timestamp, point.device_offline]
      })

      // 更新图表系列数据
      if (chartOption.value.series) {
        chartOption.value.series[0].data = chartData.online
        chartOption.value.series[1].data = chartData.offline
      }
    }
  } catch (error) {
    console.error('获取设备趋势数据失败:', error)
  } finally {
    chartData.loading = false
  }
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'OnlineTrendCard21'
})
</script>

<style scoped>
/* 确保图表响应式 */
:deep(.echarts) {
  min-height: 200px;
}

/* 图标样式 */
img {
  object-fit: contain;
  user-select: none;
}

/* 深色模式适配 */
:deep(.dark) {
  .echarts {
    color-scheme: dark;
  }
}
</style>