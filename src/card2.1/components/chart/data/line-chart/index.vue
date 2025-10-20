<template>
  <div class="line-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="line-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 折线图组件
 * 使用 ECharts 实现折线图可视化
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { LineChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 组件属性接口
interface Props {
  config: LineChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

// 组件事件
interface Emits {
  (e: 'update:config', config: LineChartCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 🔥 关键：使用 computed 包装 props.data
const { unifiedConfig, displayData } = useCard2Props({
  config: props.config,
  data: computed(() => props.data),
  componentId: props.componentId
})

// ECharts 实例和容器引用
const chartRef = ref<HTMLElement>()
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算显示数据（数据源优先）
const displayXData = computed(() => {
  const dataSourceXData = displayData.value?.main?.data?.xData
  return Array.isArray(dataSourceXData) ? dataSourceXData : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
})

const displayYData = computed(() => {
  const dataSourceYData = displayData.value?.main?.data?.yData
  return Array.isArray(dataSourceYData) ? dataSourceYData : [120, 200, 150, 80, 70, 110]
})

/**
 * 初始化 ECharts 实例
 */
const initChart = () => {
  if (!chartRef.value) return

  // 如果已存在实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新实例
  chartInstance = echarts.init(chartRef.value)

  // 更新图表
  updateChart()
}

/**
 * 更新图表配置
 */
const updateChart = () => {
  if (!chartInstance) return

  const config = unifiedConfig.value.component || {}

  const option: EChartsOption = {
    title: {
      text: config.title || '数据趋势',
      left: 'center',
      textStyle: {
        color: 'var(--text-color-1, #333)',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      show: config.showLegend ?? true,
      bottom: 10,
      textStyle: {
        color: 'var(--text-color-2, #666)'
      }
    },
    grid: {
      show: config.showGrid ?? true,
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: displayXData.value,
      name: config.xAxisLabel || '时间',
      nameTextStyle: {
        color: 'var(--text-color-2, #666)'
      },
      axisLabel: {
        color: 'var(--text-color-2, #666)'
      }
    },
    yAxis: {
      type: 'value',
      name: config.yAxisLabel || '数值',
      nameTextStyle: {
        color: 'var(--text-color-2, #666)'
      },
      axisLabel: {
        color: 'var(--text-color-2, #666)'
      },
      splitLine: {
        lineStyle: {
          color: 'var(--divider-color, #e0e0e0)'
        }
      }
    },
    series: [
      {
        name: config.title || '数据',
        type: 'line',
        smooth: config.smooth ?? true,
        data: displayYData.value,
        symbol: config.showDataPoints ? 'circle' : 'none',
        symbolSize: config.dataPointSize || 6,
        itemStyle: {
          color: config.lineColor || '#5470c6'
        },
        lineStyle: {
          color: config.lineColor || '#5470c6',
          width: 2
        },
        areaStyle: config.showArea
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: config.areaColor || 'rgba(84, 112, 198, 0.3)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
              ])
            }
          : undefined
      }
    ],
    animationDuration: config.animationDuration || 1000,
    animationEasing: 'cubicInOut'
  }

  chartInstance.setOption(option, true)
}

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听配置变化
watch(
  () => unifiedConfig.value.component,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// 监听数据变化
watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// 监听显示数据变化
watch([displayXData, displayYData], () => {
  nextTick(() => {
    updateChart()
  })
})

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initChart()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 使用 ResizeObserver 监听容器大小变化
  if (chartContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartContainerRef.value)
  }
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.line-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}
</style>
