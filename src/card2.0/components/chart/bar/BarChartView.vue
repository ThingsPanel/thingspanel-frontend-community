<template>
  <div class="bar-chart-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 标题 -->
    <div 
      v-if="config.title?.show" 
      class="chart-title"
      :style="titleStyle"
    >
      {{ config.title?.text || '柱状图' }}
    </div>
    
    <!-- 图表容器 -->
    <div 
      ref="chartContainer"
      class="chart-content"
      :style="chartContentStyle"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="chart-loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="chart-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="handleRetry">重试</button>
      </div>
      
      <!-- 空数据状态 -->
      <div v-else-if="!chartData || chartData.length === 0" class="chart-empty">
        <div class="empty-icon">📊</div>
        <div class="empty-message">暂无数据</div>
      </div>
      
      <!-- 图表 -->
      <div v-else ref="chartElement" class="chart-element"></div>
    </div>
    
    <!-- 工具提示 -->
    <div 
      v-if="tooltip.show"
      ref="tooltipElement"
      class="chart-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div class="tooltip-content">
        <div v-for="item in tooltip.data" :key="item.name" class="tooltip-item">
          <span class="tooltip-marker" :style="{ backgroundColor: item.color }"></span>
          <span class="tooltip-name">{{ item.name }}:</span>
          <span class="tooltip-value">{{ formatValue(item.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

// Props
interface Props {
  data?: any
  config?: any
  instance?: any
  context?: any
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  config: () => ({}),
  instance: () => ({}),
  context: () => ({})
})

// Emits
const emit = defineEmits<{
  'data-point-click': [data: any]
  'chart-ready': [chart: ECharts]
  'error': [error: Error]
}>()

// Refs
const chartContainer = ref<HTMLElement>()
const chartElement = ref<HTMLElement>()
const tooltipElement = ref<HTMLElement>()

// State
const loading = ref(true)
const error = ref('')
const chart = ref<ECharts | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)
const isDarkTheme = ref(false)

// Tooltip state
const tooltip = ref({
  show: false,
  title: '',
  data: [] as Array<{ name: string, value: any, color: string }>,
  x: 0,
  y: 0
})

// Computed
const chartData = computed(() => {
  if (!props.data) return []
  
  // 确保数据格式正确
  if (Array.isArray(props.data)) {
    return props.data.map(item => ({
      name: item.name || item.label || String(item.x || item.category || 'Unknown'),
      value: Number(item.value || item.y || 0)
    }))
  }
  
  return []
})

const titleStyle = computed(() => ({
  fontSize: `${props.config.title?.fontSize || 16}px`,
  color: props.config.title?.color || '#333333',
  textAlign: props.config.title?.align || 'center'
}))

const chartContentStyle = computed(() => {
  const titleHeight = props.config.title?.show ? 40 : 0
  return {
    height: `calc(100% - ${titleHeight}px)`
  }
})

const tooltipStyle = computed(() => ({
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`,
  display: tooltip.value.show ? 'block' : 'none'
}))

const chartOption = computed((): EChartsOption => {
  const config = props.config
  const data = chartData.value
  
  return {
    backgroundColor: 'transparent',
    title: {
      show: false // 使用自定义标题
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        if (Array.isArray(params) && params.length > 0) {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${formatValue(param.value)}`
        }
        return ''
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      show: config.axis?.showXAxis !== false,
      name: config.axis?.xAxisLabel || '',
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: {
        lineStyle: {
          color: isDarkTheme.value ? '#666' : '#ccc'
        }
      },
      axisLabel: {
        color: isDarkTheme.value ? '#ccc' : '#666'
      }
    },
    yAxis: {
      type: 'value',
      show: config.axis?.showYAxis !== false,
      name: config.axis?.yAxisLabel || '',
      nameLocation: 'middle',
      nameGap: 50,
      axisLine: {
        lineStyle: {
          color: isDarkTheme.value ? '#666' : '#ccc'
        }
      },
      axisLabel: {
        color: isDarkTheme.value ? '#ccc' : '#666',
        formatter: (value: number) => formatValue(value)
      },
      splitLine: {
        lineStyle: {
          color: isDarkTheme.value ? '#333' : '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: '数值',
        type: 'bar',
        data: data.map(item => item.value),
        itemStyle: {
          color: config.chart?.color || '#409EFF',
          borderRadius: [config.chart?.borderRadius || 4, config.chart?.borderRadius || 4, 0, 0]
        },
        barWidth: config.chart?.barWidth || 40,
        label: {
          show: config.chart?.showValue !== false,
          position: config.chart?.valuePosition || 'top',
          formatter: (params: any) => formatValue(params.value),
          color: isDarkTheme.value ? '#ccc' : '#666'
        },
        emphasis: {
          itemStyle: {
            color: adjustColor(config.chart?.color || '#409EFF', 0.2)
          }
        },
        animationDuration: config.animation?.enabled !== false ? (config.animation?.duration || 1000) : 0,
        animationEasing: config.animation?.easing || 'cubicOut'
      }
    ],
    legend: {
      show: config.legend?.show === true,
      orient: ['left', 'right'].includes(config.legend?.position) ? 'vertical' : 'horizontal',
      left: config.legend?.position === 'left' ? '3%' : config.legend?.position === 'right' ? '97%' : 'center',
      top: config.legend?.position === 'top' ? '3%' : config.legend?.position === 'bottom' ? '97%' : 'auto',
      textStyle: {
        color: isDarkTheme.value ? '#ccc' : '#666'
      }
    }
  }
})

// Methods
const initChart = async () => {
  try {
    loading.value = true
    error.value = ''
    
    await nextTick()
    
    if (!chartElement.value) {
      throw new Error('图表容器不存在')
    }
    
    // 销毁现有图表
    if (chart.value) {
      chart.value.dispose()
      chart.value = null
    }
    
    // 创建新图表
    chart.value = echarts.init(chartElement.value, isDarkTheme.value ? 'dark' : 'light')
    
    // 设置配置
    chart.value.setOption(chartOption.value, true)
    
    // 绑定事件
    chart.value.on('click', handleChartClick)
    chart.value.on('mouseover', handleChartMouseOver)
    chart.value.on('mouseout', handleChartMouseOut)
    
    emit('chart-ready', chart.value)
    
    loading.value = false
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '图表初始化失败'
    error.value = errorMsg
    loading.value = false
    emit('error', new Error(errorMsg))
  }
}

const updateChart = () => {
  if (chart.value && !loading.value && !error.value) {
    chart.value.setOption(chartOption.value, true)
  }
}

const resizeChart = () => {
  if (chart.value) {
    chart.value.resize()
  }
}

const handleChartClick = (params: any) => {
  const dataItem = {
    name: params.name,
    value: params.value,
    dataIndex: params.dataIndex
  }
  emit('data-point-click', dataItem)
}

const handleChartMouseOver = (params: any) => {
  // 自定义工具提示逻辑（如果需要）
}

const handleChartMouseOut = () => {
  tooltip.value.show = false
}

const handleRetry = () => {
  initChart()
}

const formatValue = (value: any): string => {
  if (typeof value !== 'number') {
    return String(value)
  }
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else {
    return value.toLocaleString()
  }
}

const adjustColor = (color: string, amount: number): string => {
  // 简单的颜色调整函数
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * amount * 100)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

const detectTheme = () => {
  // 检测主题（可以根据实际需求调整）
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkTheme.value = isDark
}

const setupResizeObserver = () => {
  if (chartContainer.value && window.ResizeObserver) {
    resizeObserver.value = new ResizeObserver(() => {
      resizeChart()
    })
    resizeObserver.value.observe(chartContainer.value)
  }
}

const cleanupResizeObserver = () => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }
}

// Lifecycle
onMounted(() => {
  detectTheme()
  setupResizeObserver()
  initChart()
})

onUnmounted(() => {
  cleanupResizeObserver()
  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }
})

// Watchers
watch(
  () => [props.data, props.config],
  () => {
    if (chart.value) {
      updateChart()
    } else {
      initChart()
    }
  },
  { deep: true }
)

watch(
  () => isDarkTheme.value,
  () => {
    initChart() // 主题变化时重新初始化
  }
)
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bar-chart-container.dark-theme {
  background: #1a1a1a;
  color: #ccc;
}

.chart-title {
  padding: 12px 16px 8px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.dark-theme .chart-title {
  border-bottom-color: #333;
}

.chart-content {
  flex: 1;
  position: relative;
  min-height: 0;
}

.chart-element {
  width: 100%;
  height: 100%;
}

.chart-loading,
.chart-error,
.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
}

.dark-theme .chart-loading,
.dark-theme .chart-error,
.dark-theme .chart-empty {
  color: #999;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.dark-theme .loading-spinner {
  border-color: #333;
  border-top-color: #409EFF;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  opacity: 0.6;
}

.error-message,
.empty-message {
  font-size: 14px;
  text-align: center;
}

.retry-button {
  padding: 8px 16px;
  background: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background: #337ecc;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
}

.tooltip-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-name {
  flex-shrink: 0;
}

.tooltip-value {
  font-weight: 600;
  margin-left: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-title {
    padding: 8px 12px 6px;
    font-size: 14px;
  }
  
  .chart-tooltip {
    font-size: 11px;
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .chart-title {
    padding: 6px 8px 4px;
    font-size: 13px;
  }
  
  .error-icon,
  .empty-icon {
    font-size: 36px;
  }
  
  .error-message,
  .empty-message {
    font-size: 13px;
  }
}
</style>