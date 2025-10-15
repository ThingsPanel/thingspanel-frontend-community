<template>
  <div class="gauge-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="gauge-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘图表组件
 * 使用 ECharts 实现圆形仪表盘可视化
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { GaugeChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 组件属性接口
interface Props {
  config: GaugeChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

// 组件事件
interface Emits {
  (e: 'update:config', config: GaugeChartCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 使用 Card2 统一配置 hook
// 🔥 关键修复：data必须传入computed才能响应props.data变化
const { unifiedConfig, displayData } = useCard2Props({
  config: props.config,
  data: computed(() => props.data),
  componentId: props.componentId
})

// ECharts 实例和容器引用
const chartRef = ref<HTMLElement>()
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算显示值（数据源优先）
const displayValue = computed(() => {
  // 🔥 修复：数据源结构是 { main: { data: { value, unit, ... } } }
  // 优先使用数据源的值，否则使用配置值
  const dataSourceValue = displayData.value?.main?.data?.value
  return Number(dataSourceValue ?? unifiedConfig.value.component?.value ?? 75)
})

const displayMin = computed(() => {
  const dataSourceMin = displayData.value?.main?.data?.min
  return Number(dataSourceMin ?? unifiedConfig.value.component?.min ?? 0)
})

const displayMax = computed(() => {
  const dataSourceMax = displayData.value?.main?.data?.max
  return Number(dataSourceMax ?? unifiedConfig.value.component?.max ?? 100)
})

const displayTitle = computed(() => {
  const dataSourceTitle = displayData.value?.main?.data?.metricsName
  return String(dataSourceTitle ?? unifiedConfig.value.component?.title ?? '数据指标')
})

// 计算百分比
const percentage = computed(() => {
  const range = displayMax.value - displayMin.value
  if (range === 0) return 0
  return ((displayValue.value - displayMin.value) / range) * 100
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
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: displayMin.value,
        max: displayMax.value,
        radius: config.radius || '75%',
        center: ['50%', '70%'],
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: config.thickness || 10,
            color: [
              [0.25, '#5470c6'],
              [0.5, '#91cc75'],
              [0.75, '#fac858'],
              [1, '#ee6666']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 1
          }
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: -40,
          formatter: function (value: number) {
            return value.toFixed(0)
          }
        },
        title: {
          offsetCenter: [0, '-20%'],
          fontSize: 16,
          color: config.titleColor || '#333333',
          fontWeight: 'bold'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return value.toFixed(1) + (config.unit || '')
          },
          color: config.valueColor || '#1890ff',
          fontWeight: 'bold'
        },
        data: [
          {
            value: displayValue.value,
            name: displayTitle.value
          }
        ]
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

// 监听显示值变化
watch(
  [displayValue, displayMin, displayMax, displayTitle],
  () => {
    nextTick(() => {
      updateChart()
    })
  }
)

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
.gauge-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.gauge-chart {
  flex: 1;
  width: 100%;
  min-height: 200px;
}
</style>
