<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch, onUnmounted } from 'vue'
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

type EChartsOption = ComposeOption<
  TooltipComponentOption | LegendComponentOption | ToolboxComponentOption | GridComponentOption | LineSeriesOption
>

interface Props {
  title?: string
  showOnlineRate?: boolean
  showLegend?: boolean
  smoothLine?: boolean
  showArea?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '在线趋势',
  showOnlineRate: true,
  showLegend: true,
  smoothLine: true,
  showArea: true,
  refreshInterval: 30000
})

const chartData = reactive({
  loading: false,
  online: [] as [number, number][],
  offline: [] as [number, number][]
})

const chartOption = ref<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const date = new Date(params[0].value[0])
      const dateStr = date.toLocaleString()
      let result = `${dateStr}<br/>`

      params.forEach((param: any) => {
        const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`
        result += `${marker}${param.seriesName}: ${param.value[1]}<br/>`
      })

      return result
    }
  },
  legend: {
    data: [$t('dashboard_panel.cardName.onLine'), $t('dashboard_panel.cardName.offline')],
    left: 'center',
    top: 0,
    show: props.showLegend
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: props.showLegend ? '50px' : '20px',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    boundaryGap: false,
    axisLine: {
      lineStyle: {
        color: '#ddd'
      }
    },
    axisLabel: {
      formatter(value: number) {
        const date = new Date(value)
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      },
      color: '#333'
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#ddd'
      }
    },
    axisLabel: {
      color: '#333'
    },
    splitLine: {
      lineStyle: {
        color: '#eee'
      }
    }
  },
  series: [
    {
      name: $t('dashboard_panel.cardName.onLine'),
      type: 'line',
      smooth: props.smoothLine,
      symbol: 'none',
      data: chartData.online,
      itemStyle: {
        color: '#67C23A'
      },
      lineStyle: {
        width: 3
      },
      areaStyle: props.showArea
        ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.4)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ])
          }
        : undefined
    },
    {
      name: $t('dashboard_panel.cardName.offline'),
      type: 'line',
      smooth: props.smoothLine,
      symbol: 'none',
      data: chartData.offline,
      itemStyle: {
        color: '#F56C6C'
      },
      lineStyle: {
        width: 3
      }
    }
  ]
})

// Calculate the online rate percentage
const onlineRate = computed(() => {
  const latestDataPoint = chartData.online[chartData.online.length - 1]
  const latestOfflinePoint = chartData.offline[chartData.offline.length - 1]

  if (!latestDataPoint || !latestOfflinePoint) return 0

  const onlineCount = latestDataPoint[1]
  const offlineCount = latestOfflinePoint[1]
  const total = onlineCount + offlineCount

  return total > 0 ? Math.round((onlineCount / total) * 100) : 0
})

// Create a computed property for the online rate string
const onlineRateText = computed(() => {
  return `${$t('dashboard_panel.cardName.onlineRate')} ${onlineRate.value}%`
})

let refreshTimer: NodeJS.Timeout | null = null

const fetchData = async () => {
  chartData.loading = true
  try {
    const response = await getOnlineDeviceTrend()
    if (response && response.data && response.data.points) {
      // Convert data to the format expected by ECharts
      chartData.online = response.data.points.map((point: any) => {
        const timestamp = new Date(point.timestamp).getTime()
        return [timestamp, point.device_online]
      })

      chartData.offline = response.data.points.map((point: any) => {
        const timestamp = new Date(point.timestamp).getTime()
        return [timestamp, point.device_offline]
      })

      // Update chart series data
      chartOption.value.series[0].data = chartData.online
      chartOption.value.series[1].data = chartData.offline
    }
  } catch (error) {
    console.error('Failed to fetch device trend data:', error)
  } finally {
    chartData.loading = false
  }
}

const startRefreshTimer = () => {
  if (props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      fetchData()
    }, props.refreshInterval)
  }
}

const stopRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  fetchData()
  startRefreshTimer()
})

onUnmounted(() => {
  stopRefreshTimer()
})

// 监听属性变化
watch(
  () => props.refreshInterval,
  () => {
    stopRefreshTimer()
    startRefreshTimer()
  }
)

watch(
  () => [props.showLegend, props.smoothLine, props.showArea],
  () => {
    // 重新更新图表配置
    chartOption.value.legend.show = props.showLegend
    chartOption.value.grid.top = props.showLegend ? '50px' : '20px'

    chartOption.value.series[0].smooth = props.smoothLine
    chartOption.value.series[1].smooth = props.smoothLine

    chartOption.value.series[0].areaStyle = props.showArea
      ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.4)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      : undefined
  }
)
</script>

<template>
  <div class="online-trend-card">
    <div class="online-trend-header">
      <div class="title">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span>{{ title }}</span>
      </div>
      <div v-if="showOnlineRate" class="online-rate">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span class="rate-text">{{ onlineRateText }}</span>
      </div>
    </div>
    <div class="chart-container">
      <VChart class="chart" :option="chartOption" autoresize />
    </div>
  </div>
</template>

<style scoped>
.online-trend-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.online-trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.title span {
  color: #235ff5;
}

.online-rate {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 16px;
}

.rate-text {
  color: #235ff5;
  font-size: 14px;
  font-weight: 500;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  color: #235ff5;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 200px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
