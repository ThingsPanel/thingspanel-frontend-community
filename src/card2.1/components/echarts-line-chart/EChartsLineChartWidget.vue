<!--
  ECharts曲线图组件
  验证V6数据绑定系统的通用性
-->

<template>
  <div
    class="echarts-line-chart-widget"
    :style="interactionStyles"
    :class="{ interacting: interactionState.isAnimating }"
  >
    <!-- 组件标题 -->
    <div v-if="title" class="widget-header">
      <h3 class="widget-title">
        <n-icon size="16" class="title-icon">
          <AnalyticsOutline />
        </n-icon>
        {{ title }}
      </h3>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <div v-if="!hasValidData" class="no-data">
        <n-empty size="small" description="暂无图表数据">
          <template #icon>
            <n-icon><BarChartOutline /></n-icon>
          </template>
          <template #extra>
            <n-text depth="3">请配置图表数据源</n-text>
          </template>
        </n-empty>
      </div>

      <div v-else ref="chartRef" class="chart-element" :style="{ width: '100%', height: chartHeight }"></div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-card size="small" title="调试信息">
        <div class="debug-item">
          <strong>组件ID:</strong>
          {{ componentId }}
        </div>
        <div class="debug-item">
          <strong>图表数据:</strong>
          {{ Array.isArray(chartData) ? `${chartData.length} 条` : typeof chartData }}
        </div>
        <div class="debug-item">
          <strong>X轴数据:</strong>
          {{ Array.isArray(xAxisData) ? `${xAxisData.length} 项` : typeof xAxisData }}
        </div>
        <div class="debug-item">
          <strong>系列数据:</strong>
          {{ Array.isArray(seriesData) ? `${seriesData.length} 系列` : typeof seriesData }}
        </div>
        <pre class="debug-json">{{ debugInfo }}</pre>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ECharts曲线图组件
 * 验证V6数据绑定系统的通用性
 */

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { NIcon, NText, NEmpty, NCard } from 'naive-ui'
import { AnalyticsOutline, BarChartOutline } from '@vicons/ionicons5'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// 生成唯一组件ID
const componentId = `echarts-line-chart_${Date.now()}_${Math.floor(Math.random() * 1000)}`

interface Props {
  /** 图表标题 */
  title?: string
  /** 图表数据 */
  chartData?: any[]
  /** X轴数据 */
  xAxisData?: string[]
  /** 系列数据 */
  seriesData?: Array<{ name: string; data: number[] }>
  /** 是否显示图例 */
  showLegend?: boolean
  /** 是否显示网格 */
  showGrid?: boolean
  /** 是否平滑曲线 */
  smoothCurve?: boolean
  /** 线条颜色 */
  lineColor?: string
  /** X轴标签 */
  xAxisLabel?: string
  /** Y轴标签 */
  yAxisLabel?: string
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
  /** 图表高度 */
  chartHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'ECharts曲线图',
  chartData: () => [],
  xAxisData: () => [],
  seriesData: () => [],
  showLegend: true,
  showGrid: true,
  smoothCurve: true,
  lineColor: '#5470c6',
  xAxisLabel: '时间',
  yAxisLabel: '数值',
  showDebugInfo: false,
  chartHeight: '300px'
})

// 交互系统集成（保持与其他Card2.1组件一致）
const interactionState = ref({
  isAnimating: false,
  scale: 1,
  rotation: 0,
  opacity: 1
})

const interactionStyles = computed(() => ({
  transform: `scale(${interactionState.value.scale}) rotate(${interactionState.value.rotation}deg)`,
  opacity: interactionState.value.opacity,
  transition: interactionState.value.isAnimating ? 'all 0.3s ease' : 'none'
}))

// ECharts实例
const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 计算属性
const hasValidData = computed(() => {
  // 检查是否有有效的图表数据
  return (
    (Array.isArray(props.chartData) && props.chartData.length > 0) ||
    (Array.isArray(props.xAxisData) && props.xAxisData.length > 0) ||
    (Array.isArray(props.seriesData) && props.seriesData.length > 0)
  )
})

// 智能数据处理：自动适配不同的数据格式
const processedChartData = computed(() => {
  console.log('📊 [EChartsLineChart] 处理图表数据:', {
    chartData: props.chartData,
    xAxisData: props.xAxisData,
    seriesData: props.seriesData
  })

  // 情况1：直接提供seriesData和xAxisData
  if (Array.isArray(props.seriesData) && props.seriesData.length > 0) {
    return {
      xAxis: props.xAxisData || [],
      series: props.seriesData
    }
  }

  // 情况2：chartData包含完整结构
  if (Array.isArray(props.chartData) && props.chartData.length > 0) {
    const firstItem = props.chartData[0]

    // 如果是 {x, y} 格式
    if (firstItem && typeof firstItem === 'object' && 'x' in firstItem && 'y' in firstItem) {
      return {
        xAxis: props.chartData.map(item => item.x),
        series: [
          {
            name: '数据系列',
            data: props.chartData.map(item => item.y)
          }
        ]
      }
    }

    // 如果是纯数值数组
    if (typeof firstItem === 'number') {
      return {
        xAxis: props.chartData.map((_, index) => `${index + 1}`),
        series: [
          {
            name: '数据系列',
            data: props.chartData
          }
        ]
      }
    }

    // 如果是复杂对象，尝试自动推断
    if (typeof firstItem === 'object') {
      const keys = Object.keys(firstItem)
      const valueKey = keys.find(key => typeof firstItem[key] === 'number') || keys[1]
      const labelKey = keys.find(key => typeof firstItem[key] === 'string') || keys[0]

      if (valueKey) {
        return {
          xAxis: props.chartData.map(item => item[labelKey] || ''),
          series: [
            {
              name: '数据系列',
              data: props.chartData.map(item => item[valueKey])
            }
          ]
        }
      }
    }
  }

  // 默认空数据
  return {
    xAxis: [],
    series: []
  }
})

// 生成ECharts配置
const chartOption = computed(() => {
  const data = processedChartData.value

  return {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      show: props.showLegend,
      top: 30
    },
    grid: {
      show: props.showGrid,
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: props.title ? '20%' : '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.xAxis,
      name: props.xAxisLabel,
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#d1d5db'
        }
      },
      splitLine: {
        show: props.showGrid,
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: props.yAxisLabel,
      nameLocation: 'middle',
      nameGap: 40,
      nameRotate: 90,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#d1d5db'
        }
      },
      splitLine: {
        show: props.showGrid,
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    series: data.series.map((seriesItem, index) => ({
      name: seriesItem.name,
      type: 'line',
      data: seriesItem.data,
      smooth: props.smoothCurve,
      lineStyle: {
        width: 3,
        color: index === 0 ? props.lineColor : undefined
      },
      symbolSize: 8,
      emphasis: {
        focus: 'series'
      }
    }))
  }
})

const debugInfo = computed(() => {
  return JSON.stringify(
    {
      componentId,
      hasValidData: hasValidData.value,
      chartData: props.chartData,
      xAxisData: props.xAxisData,
      seriesData: props.seriesData,
      processedData: processedChartData.value
    },
    null,
    2
  )
})

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) {
    console.log('📊 [EChartsLineChart] 跳过图表初始化，容器未准备好')
    return
  }

  await nextTick()

  try {
    // 销毁已有实例
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }

    // 创建新实例
    chartInstance = echarts.init(chartRef.value)

    // 如果有数据，设置配置；没有数据则显示空状态
    if (hasValidData.value) {
      chartInstance.setOption(chartOption.value)
      console.log('📊 [EChartsLineChart] 图表初始化成功(有数据):', componentId)
    } else {
      // 设置空状态配置，避免显示错误
      chartInstance.setOption({
        title: {
          text: '等待数据...',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#999',
            fontSize: 14
          }
        },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: []
      })
      console.log('📊 [EChartsLineChart] 图表初始化成功(等待数据):', componentId)
    }

    // 监听窗口和容器大小变化
    const handleResize = () => {
      if (chartInstance) {
        chartInstance.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    // 使用ResizeObserver监听容器大小变化
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (chartInstance) {
          // 延迟调用resize，避免频繁触发
          setTimeout(() => {
            if (chartInstance) {
              chartInstance.resize()
            }
          }, 100)
        }
      })
      resizeObserver.observe(chartRef.value)
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
    }
  } catch (error) {
    console.error('📊 [EChartsLineChart] 图表初始化失败:', error)
  }
}

// 更新图表
const updateChart = () => {
  if (chartInstance && hasValidData.value) {
    chartInstance.setOption(chartOption.value, true)
    console.log('📊 [EChartsLineChart] 图表已更新')
  }
}

// 监听数据变化
watch(
  [() => props.chartData, () => props.xAxisData, () => props.seriesData],
  (newValues, oldValues) => {
    console.log('📊 [EChartsLineChart] 检测到数据变化，更新图表')
    console.log('📊 [EChartsLineChart] 数据变化详情:', {
      hasValidData: hasValidData.value,
      chartInstance: !!chartInstance,
      newValues: newValues.map(v => (Array.isArray(v) ? `Array(${v?.length})` : typeof v)),
      oldValues: oldValues?.map(v => (Array.isArray(v) ? `Array(${v?.length})` : typeof v))
    })

    if (chartInstance) {
      if (hasValidData.value) {
        // 有数据，更新图表
        updateChart()
      } else {
        // 数据被清空，显示等待状态
        chartInstance.setOption({
          title: {
            text: '等待数据...',
            left: 'center',
            top: 'middle',
            textStyle: {
              color: '#999',
              fontSize: 14
            }
          },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: []
        })
      }
    } else if (hasValidData.value) {
      // 没有图表实例但有数据，初始化图表
      initChart()
    }
  },
  { deep: true, immediate: true }
)

// 监听配置变化
watch([() => props.showLegend, () => props.showGrid, () => props.smoothCurve, () => props.lineColor], () => {
  console.log('📊 [EChartsLineChart] 检测到配置变化，更新图表')
  updateChart()
})

// 额外的数据监听 - 确保任何数据变化都能被捕获
watch(
  () => props,
  newProps => {
    console.log('📊 [EChartsLineChart] Props 整体变化:', {
      componentId,
      hasValidData: hasValidData.value,
      chartInstance: !!chartInstance,
      propsKeys: Object.keys(newProps)
    })

    // 如果图表实例存在且数据有效，更新图表
    if (chartInstance && hasValidData.value) {
      updateChart()
    }
  },
  { deep: true }
)

// 生命周期
onMounted(async () => {
  console.log('📊 [EChartsLineChart] 组件已挂载:', componentId)
  console.log('📊 [EChartsLineChart] 初始数据:', {
    chartData: props.chartData,
    xAxisData: props.xAxisData,
    seriesData: props.seriesData,
    hasValidData: hasValidData.value
  })

  // 等待DOM更新完成，确保chartRef.value可用
  await nextTick()

  // 总是初始化图表实例，数据会通过watch处理
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  console.log('📊 [EChartsLineChart] 组件已卸载:', componentId)
})
</script>

<style scoped>
.echarts-line-chart-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.title-icon {
  color: var(--primary-color);
}

.chart-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

.chart-element {
  border-radius: 4px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--divider-color);
}

.debug-item {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-color-2);
}

.debug-json {
  font-size: 11px;
  color: var(--text-color-3);
  background: var(--hover-color);
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

/* 交互动画 */
.interacting {
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .echarts-line-chart-widget {
    padding: 12px;
  }

  .widget-title {
    font-size: 14px;
  }

  .chart-container {
    min-height: 200px;
  }
}

/* 主题适配 */
[data-theme='dark'] .echarts-line-chart-widget {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
