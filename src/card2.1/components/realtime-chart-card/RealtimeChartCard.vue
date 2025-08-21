<template>
  <div
    class="realtime-chart-card"
    :style="finalCardStyles"
    tabindex="0"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 📈 图表头部 -->
    <div class="chart-header" :style="headerStyles">
      <div class="chart-info">
        <h4 class="chart-title" :style="titleStyles">
          {{ currentData.title || config.title || '实时图表' }}
        </h4>
        <p v-if="config.showSubtitle" class="chart-subtitle" :style="subtitleStyles">
          {{ currentData.subtitle || config.subtitle || '数据实时更新' }}
        </p>
      </div>

      <!-- 📊 图表控制区 -->
      <div class="chart-controls">
        <!-- 图表类型切换 -->
        <n-select
          v-if="config.allowTypeSwitch"
          v-model:value="currentChartType"
          :options="chartTypeOptions"
          size="small"
          style="width: 100px"
          @update:value="handleChartTypeChange"
        />

        <!-- 时间范围选择 -->
        <n-select
          v-if="config.showTimeRange"
          v-model:value="currentTimeRange"
          :options="timeRangeOptions"
          size="small"
          style="width: 80px"
          @update:value="handleTimeRangeChange"
        />

        <!-- 实时开关 -->
        <n-switch
          v-if="config.showRealtimeToggle"
          v-model:value="isRealtime"
          size="small"
          @update:value="handleRealtimeToggle"
        >
          <template #checked>实时</template>
          <template #unchecked>暂停</template>
        </n-switch>
      </div>
    </div>

    <!-- 📈 图表主体区域 -->
    <div class="chart-container" :style="chartContainerStyles">
      <!-- 简化的Canvas图表实现 -->
      <canvas
        ref="chartCanvas"
        class="chart-canvas"
        :width="chartWidth"
        :height="chartHeight"
        @mousedown="handleChartMouseDown"
        @mousemove="handleChartMouseMove"
        @mouseup="handleChartMouseUp"
      />

      <!-- 📊 数据图例 -->
      <div v-if="config.showLegend" class="chart-legend" :style="legendStyles">
        <div v-for="(series, index) in chartSeries" :key="index" class="legend-item" @click="toggleSeries(index)">
          <span class="legend-color" :style="{ backgroundColor: series.color }" />
          <span class="legend-label">{{ series.name }}</span>
          <span v-if="series.value !== undefined" class="legend-value">
            {{ formatValue(series.value, series.unit) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 📈 统计信息 -->
    <div v-if="config.showStats" class="chart-stats" :style="statsStyles">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">{{ $t('chart.stats.points') }}</span>
          <span class="stat-value">{{ totalDataPoints }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('chart.stats.updateRate') }}</span>
          <span class="stat-value">{{ updateRate.toFixed(1) }}/s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('chart.stats.lastUpdate') }}</span>
          <span class="stat-value">
            <n-time v-if="lastUpdateTime" :time="lastUpdateTime" type="relative" />
            <span v-else>--</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 🔍 交互状态指示器 (调试模式) -->
    <div v-if="showInteractionIndicator" class="interaction-indicator">
      <span class="indicator-label">交互状态:</span>
      <span class="indicator-value">{{ interactionStatusText }}</span>

      <!-- 测试按钮 -->
      <div class="test-buttons" style="margin-top: 8px">
        <n-space :size="4">
          <n-button size="tiny" type="primary" @click="addRandomData">添加数据</n-button>
          <n-button size="tiny" type="warning" @click="clearChart">清空图表</n-button>
          <n-button size="tiny" type="info" @click="changeChartType">切换类型</n-button>
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 实时图表卡片组件
 * 支持多种图表类型的实时数据可视化
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInteractionCapable } from '@/card2.1/core/mixins/InteractionCapable'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'
import {
  propertyExposureRegistry,
  createPropertyExposure,
  createProperty,
  CommonProperties
} from '@/card2.1/core/property-exposure'
import {
  componentDataRequirementsRegistry,
  createDataRequirement,
  createDataField
} from '@/card2.1/core/component-data-requirements'

const { t } = useI18n()

interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

interface ChartSeries {
  name: string
  color: string
  data: ChartDataPoint[]
  visible: boolean
  unit?: string
  value?: number // 当前值
}

interface Props extends InteractionProps {
  config?: {
    // 图表配置
    title?: string
    subtitle?: string
    showSubtitle?: boolean
    chartType?: 'line' | 'bar' | 'area'

    // 数据配置
    maxDataPoints?: number
    updateInterval?: number
    timeRange?: number // 显示时间范围（秒）

    // 显示配置
    showLegend?: boolean
    showStats?: boolean
    showTimeRange?: boolean
    showRealtimeToggle?: boolean
    allowTypeSwitch?: boolean

    // 样式配置
    backgroundColor?: string
    borderColor?: string
    borderRadius?: number
    textColor?: string
    titleColor?: string
    padding?: number
    chartHeight?: number

    // 图表样式
    gridColor?: string
    axisColor?: string
    lineWidth?: number
    pointSize?: number

    // 颜色配置
    seriesColors?: string[]
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '实时图表',
    subtitle: '数据实时更新',
    showSubtitle: true,
    chartType: 'line',
    maxDataPoints: 50,
    updateInterval: 2000,
    timeRange: 300, // 5分钟
    showLegend: true,
    showStats: true,
    showTimeRange: true,
    showRealtimeToggle: true,
    allowTypeSwitch: true,
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 8,
    textColor: '#333333',
    titleColor: '#1a1a1a',
    padding: 16,
    chartHeight: 300,
    gridColor: '#f0f0f0',
    axisColor: '#cccccc',
    lineWidth: 2,
    pointSize: 4,
    seriesColors: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']
  }),
  componentId: '',
  showInteractionIndicator: false,
  allowExternalControl: true,
  previewMode: true
})

const emit = defineEmits<InteractionEmits>()

// 🔥 使用交互能力混入
const { currentInteractionState, createEventHandler, interactionStatusText, triggerInteractionEvent } =
  useInteractionCapable(props, emit, {
    enableDebug: true
  })

// 📊 图表状态
const chartCanvas = ref<HTMLCanvasElement>()
const currentChartType = ref(props.config.chartType || 'line')
const currentTimeRange = ref(300) // 5分钟
const isRealtime = ref(true)
const chartWidth = ref(600)
const chartHeight = ref(props.config.chartHeight || 300)

// 📈 数据状态
const chartSeries = ref<ChartSeries[]>([
  {
    name: '温度',
    color: '#1890ff',
    data: [],
    visible: true,
    unit: '°C',
    value: 0
  },
  {
    name: '湿度',
    color: '#52c41a',
    data: [],
    visible: true,
    unit: '%',
    value: 0
  }
])

const currentData = ref({
  title: props.config.title || '实时图表',
  subtitle: props.config.subtitle || '数据实时更新'
})

// 📊 统计数据
const totalDataPoints = ref(0)
const updateRate = ref(0)
const lastUpdateTime = ref<Date>()

// 🔄 数据模拟器
let dataSimulatorTimer: number | null = null
let updateRateCalculator: { count: number; startTime: number } = { count: 0, startTime: Date.now() }

// 选项数据
const chartTypeOptions = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '面积图', value: 'area' }
]

const timeRangeOptions = [
  { label: '1分钟', value: 60 },
  { label: '5分钟', value: 300 },
  { label: '15分钟', value: 900 },
  { label: '1小时', value: 3600 }
]

// 计算属性
const cardStyles = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  border: `1px solid ${props.config.borderColor}`,
  borderRadius: `${props.config.borderRadius}px`,
  padding: `${props.config.padding}px`,
  color: props.config.textColor
}))

const finalCardStyles = computed(() => {
  const baseStyles = cardStyles.value
  const state = currentInteractionState.value

  return {
    ...baseStyles,
    backgroundColor: state.backgroundColor || baseStyles.backgroundColor,
    color: state.textColor || baseStyles.color,
    borderColor: state.borderColor || baseStyles.borderColor,
    width: state.width ? `${state.width}px` : undefined,
    height: state.height ? `${state.height}px` : undefined,
    opacity: state.opacity !== undefined ? state.opacity : 1,
    transform: state.transform || 'none',
    visibility: state.visibility || 'visible',
    transition: 'all 0.3s ease',
    ...(state.isAnimating && {
      transform: `${state.transform || ''} scale(1.02)`,
      boxShadow: '0 4px 20px rgba(0, 123, 255, 0.2)'
    })
  }
})

const headerStyles = computed(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: `1px solid ${props.config.borderColor}33`
}))

const titleStyles = computed(() => ({
  color: props.config.titleColor,
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px 0'
}))

const subtitleStyles = computed(() => ({
  color: '#666666',
  fontSize: '12px',
  margin: '0'
}))

const chartContainerStyles = computed(() => ({
  position: 'relative',
  height: `${chartHeight.value}px`,
  marginBottom: '12px'
}))

const legendStyles = computed(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginTop: '8px',
  fontSize: '12px'
}))

const statsStyles = computed(() => ({
  padding: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: '4px',
  marginTop: '8px'
}))

// 工具函数
const formatValue = (value: number, unit?: string): string => {
  return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`
}

// 图表绘制函数
const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, chartWidth.value, chartHeight.value)

  // 绘制网格
  drawGrid(ctx)

  // 绘制数据系列
  chartSeries.value.forEach((series, index) => {
    if (series.visible && series.data.length > 0) {
      drawSeries(ctx, series, index)
    }
  })

  // 绘制坐标轴
  drawAxes(ctx)
}

const drawGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = props.config.gridColor || '#f0f0f0'
  ctx.lineWidth = 1

  const gridSpacing = 40

  // 垂直网格线
  for (let x = 0; x <= chartWidth.value; x += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, chartHeight.value)
    ctx.stroke()
  }

  // 水平网格线
  for (let y = 0; y <= chartHeight.value; y += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(chartWidth.value, y)
    ctx.stroke()
  }
}

const drawSeries = (ctx: CanvasRenderingContext2D, series: ChartSeries, seriesIndex: number) => {
  if (series.data.length === 0) return

  ctx.strokeStyle = series.color
  ctx.fillStyle = series.color
  ctx.lineWidth = props.config.lineWidth || 2

  const maxPoints = props.config.maxDataPoints || 50
  const data = series.data.slice(-maxPoints)

  if (data.length === 0) return

  // 计算数据范围
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  // 计算绘制位置
  const stepX = chartWidth.value / Math.max(data.length - 1, 1)

  if (currentChartType.value === 'line' || currentChartType.value === 'area') {
    // 绘制折线图或面积图
    ctx.beginPath()

    data.forEach((point, index) => {
      const x = index * stepX
      const y = chartHeight.value - ((point.value - minValue) / valueRange) * chartHeight.value

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    if (currentChartType.value === 'area') {
      // 面积图填充
      ctx.lineTo(chartWidth.value, chartHeight.value)
      ctx.lineTo(0, chartHeight.value)
      ctx.closePath()
      ctx.globalAlpha = 0.3
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.stroke()

    // 绘制数据点
    if (props.config.pointSize && props.config.pointSize > 0) {
      data.forEach((point, index) => {
        const x = index * stepX
        const y = chartHeight.value - ((point.value - minValue) / valueRange) * chartHeight.value

        ctx.beginPath()
        ctx.arc(x, y, props.config.pointSize || 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }
  } else if (currentChartType.value === 'bar') {
    // 绘制柱状图
    const barWidth = stepX * 0.8

    data.forEach((point, index) => {
      const x = index * stepX - barWidth / 2
      const y = chartHeight.value - ((point.value - minValue) / valueRange) * chartHeight.value
      const height = ((point.value - minValue) / valueRange) * chartHeight.value

      ctx.fillRect(x, y, barWidth, height)
    })
  }
}

const drawAxes = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = props.config.axisColor || '#cccccc'
  ctx.lineWidth = 1

  // X轴
  ctx.beginPath()
  ctx.moveTo(0, chartHeight.value)
  ctx.lineTo(chartWidth.value, chartHeight.value)
  ctx.stroke()

  // Y轴
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, chartHeight.value)
  ctx.stroke()
}

// 事件处理
const handleClick = createEventHandler('click')
const handleMouseEnter = createEventHandler('hover')
const handleMouseLeave = () => {
  console.log(`[RealtimeChartCard] 鼠标离开 - ${props.componentId}`)
}
const handleFocus = createEventHandler('focus')
const handleBlur = createEventHandler('blur')

const handleChartTypeChange = (newType: string) => {
  currentChartType.value = newType as 'line' | 'bar' | 'area'
  drawChart()

  triggerInteractionEvent('chartTypeChange', {
    oldType: props.config.chartType,
    newType,
    timestamp: new Date()
  })
}

const handleTimeRangeChange = (newRange: number) => {
  currentTimeRange.value = newRange

  // 清理超出时间范围的数据
  const cutoffTime = Date.now() - newRange * 1000
  chartSeries.value.forEach(series => {
    series.data = series.data.filter(point => point.timestamp > cutoffTime)
  })

  drawChart()
}

const handleRealtimeToggle = (enabled: boolean) => {
  isRealtime.value = enabled

  if (enabled) {
    startDataSimulator()
  } else {
    stopDataSimulator()
  }

  triggerInteractionEvent('realtimeToggle', {
    enabled,
    timestamp: new Date()
  })
}

const handleChartMouseDown = (event: MouseEvent) => {
  // 图表交互处理
  console.log('Chart mouse down:', event.offsetX, event.offsetY)
}

const handleChartMouseMove = (event: MouseEvent) => {
  // 鼠标移动处理（可以显示数据点提示）
}

const handleChartMouseUp = (event: MouseEvent) => {
  // 鼠标释放处理
}

const toggleSeries = (index: number) => {
  if (chartSeries.value[index]) {
    chartSeries.value[index].visible = !chartSeries.value[index].visible
    drawChart()
  }
}

// 测试功能
const addRandomData = () => {
  const now = Date.now()
  chartSeries.value.forEach(series => {
    const value = Math.random() * 100
    series.data.push({
      timestamp: now,
      value
    })
    series.value = value

    // 限制数据点数量
    if (series.data.length > (props.config.maxDataPoints || 50)) {
      series.data.shift()
    }
  })

  updateStats()
  drawChart()
}

const clearChart = () => {
  chartSeries.value.forEach(series => {
    series.data = []
    series.value = 0
  })
  totalDataPoints.value = 0
  drawChart()
}

const changeChartType = () => {
  const types = ['line', 'bar', 'area']
  const currentIndex = types.indexOf(currentChartType.value)
  const nextIndex = (currentIndex + 1) % types.length
  handleChartTypeChange(types[nextIndex])
}

// 数据模拟器
const startDataSimulator = () => {
  if (dataSimulatorTimer) return

  dataSimulatorTimer = window.setInterval(() => {
    if (!isRealtime.value) return

    const now = Date.now()
    const cutoffTime = now - currentTimeRange.value * 1000

    chartSeries.value.forEach((series, index) => {
      // 生成模拟数据
      let value: number
      if (index === 0) {
        // 温度
        value = 20 + Math.sin(now / 30000) * 10 + Math.random() * 5
      } else {
        // 湿度
        value = 60 + Math.cos(now / 40000) * 20 + Math.random() * 10
      }

      series.data.push({
        timestamp: now,
        value
      })
      series.value = value

      // 清理过期数据
      series.data = series.data.filter(point => point.timestamp > cutoffTime)

      // 限制数据点数量
      if (series.data.length > (props.config.maxDataPoints || 50)) {
        series.data.shift()
      }
    })

    updateStats()
    drawChart()
    lastUpdateTime.value = new Date()

    console.log(`[RealtimeChartCard] 数据更新 - ${props.componentId}:`, {
      seriesCount: chartSeries.value.length,
      totalPoints: totalDataPoints.value,
      updateRate: updateRate.value.toFixed(1)
    })
  }, props.config.updateInterval || 2000)

  console.log(`[RealtimeChartCard] 数据模拟器已启动 - ${props.componentId}`)
}

const stopDataSimulator = () => {
  if (dataSimulatorTimer) {
    clearInterval(dataSimulatorTimer)
    dataSimulatorTimer = null
    console.log(`[RealtimeChartCard] 数据模拟器已停止 - ${props.componentId}`)
  }
}

const updateStats = () => {
  totalDataPoints.value = chartSeries.value.reduce((total, series) => total + series.data.length, 0)

  // 计算更新率
  updateRateCalculator.count++
  const elapsed = (Date.now() - updateRateCalculator.startTime) / 1000
  if (elapsed > 0) {
    updateRate.value = updateRateCalculator.count / elapsed
  }

  // 重置计数器
  if (elapsed > 10) {
    updateRateCalculator = { count: 0, startTime: Date.now() }
  }
}

const updateChartSize = () => {
  if (chartCanvas.value) {
    const container = chartCanvas.value.parentElement
    if (container) {
      chartWidth.value = container.clientWidth
      chartHeight.value = props.config.chartHeight || 300
      drawChart()
    }
  }
}

// 生命周期
onMounted(async () => {
  console.log(`[RealtimeChartCard] 组件已挂载 - ${props.componentId}`)

  await nextTick()
  updateChartSize()

  // 启动数据模拟器
  if (isRealtime.value) {
    startDataSimulator()
  }

  // 注册组件属性暴露配置
  const propertyExposure = createPropertyExposure('realtime-chart-card', '实时图表卡片', [
    // 图表配置属性
    { ...CommonProperties.title, defaultValue: props.config.title },

    createProperty('chartType', '图表类型', 'string', {
      description: '图表的显示类型',
      group: '图表',
      defaultValue: props.config.chartType,
      enum: [
        { label: '折线图', value: 'line' },
        { label: '柱状图', value: 'bar' },
        { label: '面积图', value: 'area' }
      ]
    }),

    createProperty('maxDataPoints', '最大数据点', 'number', {
      description: '图表显示的最大数据点数量',
      group: '数据',
      defaultValue: props.config.maxDataPoints,
      example: 50
    }),

    createProperty('updateInterval', '更新间隔', 'number', {
      description: '数据更新间隔（毫秒）',
      group: '数据',
      defaultValue: props.config.updateInterval,
      example: 2000
    }),

    createProperty('timeRange', '时间范围', 'number', {
      description: '显示的时间范围（秒）',
      group: '数据',
      defaultValue: props.config.timeRange,
      example: 300
    }),

    // 显示控制属性
    createProperty('showLegend', '显示图例', 'boolean', {
      description: '是否显示图表图例',
      group: '显示控制',
      defaultValue: props.config.showLegend
    }),

    createProperty('showStats', '显示统计', 'boolean', {
      description: '是否显示统计信息',
      group: '显示控制',
      defaultValue: props.config.showStats
    }),

    createProperty('showRealtimeToggle', '显示实时开关', 'boolean', {
      description: '是否显示实时更新开关',
      group: '显示控制',
      defaultValue: props.config.showRealtimeToggle
    }),

    // 样式属性
    { ...CommonProperties.backgroundColor, defaultValue: props.config.backgroundColor },
    { ...CommonProperties.textColor, defaultValue: props.config.textColor },
    { ...CommonProperties.visibility, defaultValue: 'visible' },

    createProperty('chartHeight', '图表高度', 'number', {
      description: '图表的高度（像素）',
      group: '样式',
      defaultValue: props.config.chartHeight,
      example: 300
    }),

    createProperty('lineWidth', '线条宽度', 'number', {
      description: '线条的宽度',
      group: '样式',
      defaultValue: props.config.lineWidth,
      example: 2
    })
  ])

  propertyExposureRegistry.register(propertyExposure)

  // 注册组件数据需求声明
  console.log(`[RealtimeChartCard] 注册数据需求声明 - ${props.componentId}`)
  const dataRequirement = createDataRequirement('realtime-chart-card', '实时图表卡片', {
    description: '支持多种图表类型的实时数据可视化组件，适用于时序数据展示',
    category: '图表可视化',

    // 主要数据需求
    primaryData: {
      name: 'timeSeriesData',
      label: '时序数据',
      description: '图表展示的时序数据集合',
      type: 'array',
      required: true,
      defaultValue: [],
      validation: {
        minLength: 0,
        maxLength: 1000
      },
      example: [
        { timestamp: Date.now(), value: 25.6, series: 'temperature' },
        { timestamp: Date.now(), value: 68.2, series: 'humidity' }
      ],
      tags: ['primary', 'timeseries', 'chart']
    },

    // 数据字段声明
    dataFields: [
      createDataField('title', '图表标题', 'string', {
        description: '图表的标题文字',
        required: false,
        defaultValue: '实时图表',
        example: '环境监控数据',
        maxLength: 50,
        tags: ['title', 'display']
      }),

      createDataField('subtitle', '图表副标题', 'string', {
        description: '图表的副标题或描述',
        required: false,
        defaultValue: '',
        example: '过去24小时数据',
        maxLength: 100,
        tags: ['subtitle', 'description']
      }),

      createDataField('series', '数据系列', 'array', {
        description: '图表的数据系列配置',
        required: false,
        defaultValue: [],
        itemSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '系列名称' },
            color: { type: 'string', description: '系列颜色' },
            unit: { type: 'string', description: '数值单位' },
            visible: { type: 'boolean', description: '是否可见' }
          }
        },
        example: [
          { name: '温度', color: '#1890ff', unit: '°C', visible: true },
          { name: '湿度', color: '#52c41a', unit: '%', visible: true }
        ],
        tags: ['series', 'config']
      }),

      createDataField('dataPoints', '数据点集合', 'array', {
        description: '图表的所有数据点',
        required: false,
        defaultValue: [],
        itemSchema: {
          type: 'object',
          properties: {
            timestamp: { type: 'number', description: '时间戳' },
            value: { type: 'number', description: '数值' },
            series: { type: 'string', description: '所属系列' },
            label: { type: 'string', description: '数据标签' }
          }
        },
        example: [
          { timestamp: 1640995200000, value: 25.6, series: 'temperature' },
          { timestamp: 1640995200000, value: 68.2, series: 'humidity' }
        ],
        tags: ['data', 'points']
      }),

      createDataField('timeRange', '时间范围', 'object', {
        description: '图表显示的时间范围',
        required: false,
        defaultValue: {},
        example: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-01T23:59:59Z',
          duration: 86400 // 秒
        },
        tags: ['time', 'range']
      }),

      createDataField('aggregation', '数据聚合', 'object', {
        description: '数据聚合配置',
        required: false,
        defaultValue: {},
        example: {
          method: 'average', // average, sum, min, max
          interval: 300, // 5分钟聚合
          enabled: true
        },
        tags: ['aggregation', 'processing']
      }),

      createDataField('threshold', '阈值配置', 'array', {
        description: '图表阈值线配置',
        required: false,
        defaultValue: [],
        itemSchema: {
          type: 'object',
          properties: {
            value: { type: 'number', description: '阈值' },
            color: { type: 'string', description: '线条颜色' },
            label: { type: 'string', description: '标签' },
            series: { type: 'string', description: '适用系列' }
          }
        },
        example: [
          { value: 30, color: '#ff4d4f', label: '高温警告', series: 'temperature' },
          { value: 80, color: '#faad14', label: '高湿度', series: 'humidity' }
        ],
        tags: ['threshold', 'alert']
      }),

      createDataField('realtime', '实时配置', 'object', {
        description: '实时更新相关配置',
        required: false,
        defaultValue: {},
        example: {
          enabled: true,
          interval: 2000,
          autoScroll: true,
          maxPoints: 100
        },
        tags: ['realtime', 'config']
      }),

      createDataField('interaction', '交互配置', 'object', {
        description: '图表交互功能配置',
        required: false,
        defaultValue: {},
        example: {
          zoom: true,
          pan: true,
          tooltip: true,
          crosshair: true
        },
        tags: ['interaction', 'config']
      })
    ],

    // 数据更新配置
    updateConfig: {
      supportedTriggers: ['timer', 'websocket', 'manual', 'event'],
      recommendedInterval: 2000,
      minInterval: 500,
      validation: {
        requiredFields: ['timeSeriesData'],
        arrayFields: ['dataPoints', 'series', 'threshold'],
        objectFields: ['timeRange', 'aggregation', 'realtime', 'interaction']
      }
    },

    // 使用场景
    useCases: [
      {
        name: '环境监控仪表板',
        description: '实时显示温度、湿度等环境参数变化',
        exampleData: {
          title: '环境监控',
          series: [
            { name: '温度', color: '#ff6b6b', unit: '°C' },
            { name: '湿度', color: '#4ecdc4', unit: '%' }
          ],
          realtime: { enabled: true, interval: 5000 },
          threshold: [{ value: 35, color: '#ff4d4f', label: '高温' }]
        }
      },
      {
        name: '系统性能监控',
        description: '监控系统CPU、内存等性能指标',
        exampleData: {
          title: '系统性能',
          series: [
            { name: 'CPU使用率', color: '#1890ff', unit: '%' },
            { name: '内存使用率', color: '#52c41a', unit: '%' }
          ],
          realtime: { enabled: true, interval: 1000 },
          threshold: [
            { value: 80, color: '#faad14', label: '警告' },
            { value: 95, color: '#ff4d4f', label: '危险' }
          ]
        }
      },
      {
        name: '业务数据分析',
        description: '展示订单量、用户访问等业务指标趋势',
        exampleData: {
          title: '业务指标',
          series: [
            { name: '订单量', color: '#722ed1', unit: '单' },
            { name: '访问量', color: '#eb2f96', unit: '次' }
          ],
          aggregation: { method: 'sum', interval: 3600 },
          timeRange: { duration: 86400 }
        }
      }
    ]
  })

  componentDataRequirementsRegistry.register(dataRequirement)
  console.log(`[RealtimeChartCard] 数据需求声明注册完成 - ${props.componentId}`)
})

onUnmounted(() => {
  console.log(`[RealtimeChartCard] 组件即将卸载 - ${props.componentId}`)
  stopDataSimulator()
})

// 监听配置变化
watch(
  () => props.config.chartHeight,
  () => {
    nextTick(() => {
      updateChartSize()
    })
  }
)

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateChartSize)
  onUnmounted(() => {
    window.removeEventListener('resize', updateChartSize)
  })
}
</script>

<style scoped>
.realtime-chart-card {
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.realtime-chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.chart-header {
  flex-shrink: 0;
}

.chart-info {
  flex: 1;
}

.chart-title {
  line-height: 1.2;
}

.chart-subtitle {
  line-height: 1.2;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chart-container {
  overflow: hidden;
}

.chart-canvas {
  display: block;
  width: 100%;
  background: transparent;
  cursor: crosshair;
}

.chart-legend {
  padding: 8px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 500;
}

.legend-value {
  margin-left: auto;
  font-family: monospace;
  color: #666;
}

.chart-stats {
  border-radius: 4px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

/* 交互状态指示器 */
.interaction-indicator {
  margin-top: 12px;
  padding: 8px;
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
}

.indicator-label {
  font-weight: bold;
  color: #007bff;
}

.indicator-value {
  color: #666;
  margin-left: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 8px;
  }

  .chart-controls {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .stats-row {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .chart-legend {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 主题适配 */
[data-theme='dark'] .chart-stats {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .legend-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>
