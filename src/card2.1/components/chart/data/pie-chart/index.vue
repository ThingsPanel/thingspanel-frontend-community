<template>
  <div class="pie-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="pie-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 饼图组件
 * 使用 ECharts 实现饼图可视化
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { PieChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface Props {
  config: PieChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

interface Emits {
  (e: 'update:config', config: PieChartCustomize): void
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

const chartRef = ref<HTMLElement>()
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算显示数据
const displayPieData = computed(() => {
  const dataSourceData = displayData.value?.main?.data?.data
  return Array.isArray(dataSourceData)
    ? dataSourceData
    : [
        { name: '类别A', value: 335 },
        { name: '类别B', value: 234 },
        { name: '类别C', value: 154 },
        { name: '类别D', value: 135 },
        { name: '类别E', value: 105 }
      ]
})

const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const config = unifiedConfig.value.component || {}

  // 计算半径
  let radius: string | string[]
  if (config.isDonut) {
    const outer = config.radius || '70%'
    const inner = config.innerRadius || '40%'
    radius = [inner, outer]
  } else {
    radius = config.radius || '60%'
  }

  const option: EChartsOption = {
    title: {
      text: config.title || '数据分布',
      left: 'center',
      textStyle: {
        color: 'var(--text-color-1, #333)',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      show: config.showLegend ?? true,
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--text-color-2, #666)'
      }
    },
    series: [
      {
        name: config.title || '数据',
        type: 'pie',
        radius: radius,
        center: ['50%', '55%'],
        data: displayPieData.value,
        label: config.showLabel
          ? {
              show: true,
              position: config.labelPosition || 'outside',
              color: 'var(--text-color-2, #666)',
              formatter: '{b}: {c} ({d}%)'
            }
          : {
              show: false
            },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ],
    animationDuration: config.animationDuration || 1000,
    animationEasing: 'cubicInOut'
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(
  () => unifiedConfig.value.component,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

watch(displayPieData, () => {
  nextTick(() => {
    updateChart()
  })
})

onMounted(() => {
  nextTick(() => {
    initChart()
  })

  window.addEventListener('resize', handleResize)

  if (chartContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartContainerRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.pie-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.pie-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}
</style>
