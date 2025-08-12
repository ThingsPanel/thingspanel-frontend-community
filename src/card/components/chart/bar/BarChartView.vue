<template>
  <div class="bar-chart-container" :class="containerClass">
    <!-- 图表标题 -->
    <div v-if="config.title" class="chart-title">
      {{ config.title }}
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="chart-loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="chart-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error.message }}</div>
      <button class="retry-button" @click="handleRetry">重试</button>
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="!chartData || chartData.length === 0" class="chart-empty">
      <div class="empty-icon">📊</div>
      <div class="empty-message">暂无数据</div>
    </div>

    <!-- 图表内容 -->
    <div v-else ref="chartContainer" class="chart-content">
      <!-- 这里使用简化的SVG实现，实际项目中可以集成ECharts等图表库 -->
      <svg
        :width="chartWidth"
        :height="chartHeight"
        class="bar-chart-svg"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- 背景网格 -->
        <g v-if="config.chart.showGrid !== false" class="grid">
          <line
            v-for="i in gridLines"
            :key="`grid-${i}`"
            :x1="chartPadding.left"
            :y1="chartPadding.top + ((chartHeight - chartPadding.top - chartPadding.bottom) * i) / gridLines"
            :x2="chartWidth - chartPadding.right"
            :y2="chartPadding.top + ((chartHeight - chartPadding.top - chartPadding.bottom) * i) / gridLines"
            stroke="#f0f0f0"
            stroke-width="1"
          />
        </g>

        <!-- Y轴标签 -->
        <g class="y-axis">
          <text
            v-for="(label, i) in yAxisLabels"
            :key="`y-label-${i}`"
            :x="chartPadding.left - 10"
            :y="
              chartPadding.top +
              ((chartHeight - chartPadding.top - chartPadding.bottom) * (yAxisLabels.length - 1 - i)) /
                (yAxisLabels.length - 1) +
              5
            "
            text-anchor="end"
            class="axis-label"
          >
            {{ formatValue(label) }}
          </text>
        </g>

        <!-- 柱状图 -->
        <g class="bars">
          <rect
            v-for="(item, index) in chartData"
            :key="`bar-${index}`"
            :x="getBarX(index)"
            :y="getBarY(item.value)"
            :width="barWidth"
            :height="getBarHeight(item.value)"
            :fill="getBarColor(index)"
            :class="['bar', { 'bar-hover': hoveredIndex === index }]"
            @mouseenter="handleBarHover(index, item)"
            @mouseleave="handleBarLeave"
            @click="handleBarClick(item)"
          >
            <!-- 动画效果 -->
            <animate
              v-if="config.chart.animation"
              attributeName="height"
              :from="0"
              :to="getBarHeight(item.value)"
              dur="0.8s"
              begin="0s"
            />
            <animate
              v-if="config.chart.animation"
              attributeName="y"
              :from="chartHeight - chartPadding.bottom"
              :to="getBarY(item.value)"
              dur="0.8s"
              begin="0s"
            />
          </rect>
        </g>

        <!-- X轴标签 -->
        <g class="x-axis">
          <text
            v-for="(item, index) in chartData"
            :key="`x-label-${index}`"
            :x="getBarX(index) + barWidth / 2"
            :y="chartHeight - chartPadding.bottom + 20"
            text-anchor="middle"
            class="axis-label"
          >
            {{ truncateText(item.name, 8) }}
          </text>
        </g>

        <!-- 数值标签 -->
        <g v-if="config.chart.showValues !== false" class="value-labels">
          <text
            v-for="(item, index) in chartData"
            :key="`value-${index}`"
            :x="getBarX(index) + barWidth / 2"
            :y="getBarY(item.value) - 5"
            text-anchor="middle"
            class="value-label"
          >
            {{ formatValue(item.value) }}
          </text>
        </g>
      </svg>

      <!-- 工具提示 -->
      <div v-if="tooltip.visible" class="chart-tooltip" :style="tooltipStyle">
        <div class="tooltip-title">{{ tooltip.data?.name }}</div>
        <div class="tooltip-value">
          值: {{ formatValue(tooltip.data?.value) }}
          <span v-if="tooltip.data?.unit">{{ tooltip.data.unit }}</span>
        </div>
        <div v-if="tooltip.data?.count" class="tooltip-count">数量: {{ tooltip.data.count }}</div>
      </div>
    </div>

    <!-- 图例 -->
    <div v-if="config.chart.showLegend !== false && chartData.length > 0" class="chart-legend">
      <div v-for="(item, index) in chartData.slice(0, 5)" :key="`legend-${index}`" class="legend-item">
        <span class="legend-color" :style="{ backgroundColor: getBarColor(index) }"></span>
        <span class="legend-text">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Props定义
interface Props {
  data: any[]
  config: any
  loading?: boolean
  error?: Error | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

// Emits定义
const emit = defineEmits<{
  updateData: [data: any]
  updateConfig: [config: any]
  barClick: [item: any]
  barHover: [item: any]
}>()

// 响应式数据
const chartContainer = ref<HTMLElement>()
const chartWidth = ref(400)
const chartHeight = ref(300)
const hoveredIndex = ref(-1)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as any
})

// 图表配置
const chartPadding = {
  top: 20,
  right: 20,
  bottom: 60,
  left: 60
}

const gridLines = 5

// 计算属性
const containerClass = computed(() => ({
  'chart-dark': props.config.chart?.theme === 'dark',
  'chart-light': props.config.chart?.theme === 'light'
}))

const chartData = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return []
  return props.data.filter(item => item && typeof item.value === 'number')
})

const maxValue = computed(() => {
  if (chartData.value.length === 0) return 100
  const max = Math.max(...chartData.value.map(item => item.value))
  return max > 0 ? max * 1.1 : 100 // 增加10%的空间
})

const minValue = computed(() => {
  if (chartData.value.length === 0) return 0
  const min = Math.min(...chartData.value.map(item => item.value))
  return min < 0 ? min * 1.1 : 0
})

const valueRange = computed(() => maxValue.value - minValue.value)

const barWidth = computed(() => {
  const availableWidth = chartWidth.value - chartPadding.left - chartPadding.right
  const barCount = chartData.value.length
  return barCount > 0 ? Math.max((availableWidth / barCount) * 0.8, 10) : 0
})

const yAxisLabels = computed(() => {
  const labels = []
  for (let i = 0; i <= gridLines; i++) {
    const value = minValue.value + (valueRange.value * i) / gridLines
    labels.push(value)
  }
  return labels
})

const tooltipStyle = computed(() => ({
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`
}))

// 方法
const getBarX = (index: number): number => {
  const availableWidth = chartWidth.value - chartPadding.left - chartPadding.right
  const barCount = chartData.value.length
  const spacing = availableWidth / barCount
  return chartPadding.left + spacing * index + (spacing - barWidth.value) / 2
}

const getBarY = (value: number): number => {
  const availableHeight = chartHeight.value - chartPadding.top - chartPadding.bottom
  const ratio = (value - minValue.value) / valueRange.value
  return chartPadding.top + availableHeight * (1 - ratio)
}

const getBarHeight = (value: number): number => {
  const availableHeight = chartHeight.value - chartPadding.top - chartPadding.bottom
  const ratio = (value - minValue.value) / valueRange.value
  return Math.max(availableHeight * ratio, 0)
}

const getBarColor = (index: number): string => {
  const colors = props.config.colors || ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
  return colors[index % colors.length]
}

const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else {
    return value.toFixed(1)
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

const updateChartSize = () => {
  if (chartContainer.value) {
    const rect = chartContainer.value.getBoundingClientRect()
    chartWidth.value = rect.width || 400
    chartHeight.value = rect.height || 300
  }
}

const handleMouseMove = (event: MouseEvent) => {
  // 更新工具提示位置
  if (tooltip.value.visible) {
    tooltip.value.x = event.offsetX + 10
    tooltip.value.y = event.offsetY - 10
  }
}

const handleMouseLeave = () => {
  tooltip.value.visible = false
  hoveredIndex.value = -1
}

const handleBarHover = (index: number, item: any) => {
  hoveredIndex.value = index
  tooltip.value = {
    visible: true,
    x: 0,
    y: 0,
    data: item
  }
  emit('barHover', item)
}

const handleBarLeave = () => {
  // 延迟隐藏工具提示，避免闪烁
  setTimeout(() => {
    if (hoveredIndex.value === -1) {
      tooltip.value.visible = false
    }
  }, 100)
}

const handleBarClick = (item: any) => {
  emit('barClick', item)
}

const handleRetry = () => {
  emit('updateData', props.data)
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateChartSize()
  })

  window.addEventListener('resize', updateChartSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateChartSize)
})

// 监听配置变化
watch(
  () => props.config,
  newConfig => {
    console.log('[BarChartView] 配置已更新', newConfig)
  },
  { deep: true }
)

// 监听数据变化
watch(
  () => props.data,
  newData => {
    console.log('[BarChartView] 数据已更新', newData)
  },
  { deep: true }
)

// 暴露方法给父组件
defineExpose({
  updateData: (newData: any) => emit('updateData', newData),
  updateConfig: (newConfig: any) => emit('updateConfig', newConfig),
  updateChartSize
})
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-title {
  padding: 16px 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  text-align: center;
}

.chart-content {
  flex: 1;
  position: relative;
  padding: 10px;
  min-height: 200px;
}

.bar-chart-svg {
  width: 100%;
  height: 100%;
}

.axis-label {
  font-size: 12px;
  fill: #8c8c8c;
}

.value-label {
  font-size: 11px;
  fill: #262626;
  font-weight: 500;
}

.bar {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.bar:hover,
.bar-hover {
  opacity: 0.8;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8c8c8c;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #ff4d4f;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  margin-bottom: 16px;
  text-align: center;
}

.retry-button {
  padding: 6px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: #40a9ff;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
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

.tooltip-value,
.tooltip-count {
  margin-bottom: 2px;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #595959;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 深色主题 */
.chart-dark {
  background: #1f1f1f;
  color: #fff;
}

.chart-dark .chart-title {
  color: #fff;
}

.chart-dark .axis-label {
  fill: #8c8c8c;
}

.chart-dark .value-label {
  fill: #fff;
}

.chart-dark .chart-legend {
  background: #262626;
  border-top-color: #434343;
}

.chart-dark .legend-item {
  color: #d9d9d9;
}

/* 浅色主题 */
.chart-light {
  background: #ffffff;
  border: 1px solid #e8e8e8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-title {
    font-size: 14px;
    padding: 12px 16px 0;
  }

  .axis-label {
    font-size: 10px;
  }

  .value-label {
    font-size: 9px;
  }

  .chart-legend {
    padding: 8px 16px;
  }

  .legend-item {
    font-size: 11px;
  }
}
</style>
