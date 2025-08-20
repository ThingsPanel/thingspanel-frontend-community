<template>
  <div
    class="data-display-card"
    :style="finalCardStyles"
    tabindex="0"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 标题区域 -->
    <div v-if="config.showTitle" class="card-header" :style="headerStyles">
      <div class="title-content">
        <div v-if="config.showIcon" class="title-icon">
          <n-icon :size="config.iconSize" :color="config.iconColor">
            <component :is="iconComponent" />
          </n-icon>
        </div>
        <h3 class="card-title" :style="titleStyles">{{ config.title }}</h3>
      </div>
      <div v-if="config.showSubtitle" class="card-subtitle" :style="subtitleStyles">
        {{ config.subtitle }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="card-content" :style="contentStyles">
      <!-- 主要数值显示 -->
      <div class="main-value" :style="mainValueStyles">
        <span class="value-number">{{ formattedMainValue }}</span>
        <span v-if="config.mainUnit" class="value-unit">{{ config.mainUnit }}</span>
      </div>

      <!-- 变化趋势 -->
      <div v-if="config.showTrend" class="trend-indicator" :style="trendStyles">
        <n-icon :size="16" :color="trendColor">
          <component :is="trendIcon" />
        </n-icon>
        <span class="trend-text">{{ currentData.trendText || config.trendText || '持平' }}</span>
      </div>

      <!-- 描述信息 -->
      <div v-if="config.showDescription" class="description" :style="descriptionStyles">
        {{ config.description }}
      </div>

      <!-- 数据列表 -->
      <div v-if="config.showDataList && config.dataList?.length" class="data-list">
        <div v-for="(item, index) in config.dataList" :key="index" class="data-item" :style="dataItemStyles">
          <span class="item-label">{{ item.label }}</span>
          <span class="item-value" :style="{ color: item.color || config.textColor }">
            {{ item.value }} {{ item.unit || '' }}
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="config.showActions && config.actions?.length" class="card-actions">
        <n-button
          v-for="(action, index) in config.actions"
          :key="index"
          :size="config.actionSize"
          :type="action.type"
          :secondary="action.secondary"
          :ghost="action.ghost"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </n-button>
      </div>

      <!-- 交互状态指示器 -->
      <div v-if="showInteractionIndicator" class="interaction-indicator">
        <span class="indicator-label">交互状态:</span>
        <span class="indicator-value">{{ interactionStatusText }}</span>
      </div>

      <!-- 🔥 测试按钮 - 用于测试属性变化触发交互 -->
      <div v-if="showInteractionIndicator" class="test-buttons">
        <div class="test-buttons-title">属性变化测试:</div>
        <div class="test-buttons-group">
          <n-button size="small" type="primary" @click="changeTitle('你好')">标题改为"你好"</n-button>
          <n-button size="small" type="info" @click="changeTitle('你好吗')">标题改为"你好吗"</n-button>
          <n-button size="small" type="warning" @click="resetTitle">重置标题</n-button>
        </div>
        <div class="current-title">当前标题: {{ currentData.title }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据展示卡片组件
 * 用于展示关键数据指标、趋势和操作
 */

import { computed, shallowRef, onMounted, onUnmounted, ref } from 'vue'
import { useInteractionCapable } from '@/card2.1/core/mixins/InteractionCapable'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'
import {
  propertyExposureRegistry,
  createPropertyExposure,
  createProperty,
  CommonProperties
} from '@/card2.1/core/property-exposure'
import {
  TrendingUpOutline,
  TrendingDownOutline,
  RemoveOutline,
  PieChartOutline,
  BarChartOutline,
  StatsChartOutline
} from '@vicons/ionicons5'

// 图标映射
const ICON_MAP = {
  'pie-chart': PieChartOutline,
  'bar-chart': BarChartOutline,
  'stats-chart': StatsChartOutline,
  'trending-up': TrendingUpOutline,
  'trending-down': TrendingDownOutline,
  remove: RemoveOutline
}

interface DataItem {
  label: string
  value: string | number
  unit?: string
  color?: string
}

interface ActionItem {
  label: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  secondary?: boolean
  ghost?: boolean
  action?: string
}

interface Props extends InteractionProps {
  config?: {
    // 基础配置
    title?: string
    subtitle?: string
    description?: string
    showTitle?: boolean
    showSubtitle?: boolean
    showDescription?: boolean

    // 图标配置
    showIcon?: boolean
    iconType?: string
    iconSize?: number
    iconColor?: string

    // 主要数值
    mainValue?: string | number
    mainUnit?: string
    valueFormat?: 'number' | 'percentage' | 'currency'

    // 趋势配置
    showTrend?: boolean
    trendDirection?: 'up' | 'down' | 'neutral'
    trendText?: string
    trendColor?: string

    // 数据列表
    showDataList?: boolean
    dataList?: DataItem[]

    // 操作按钮
    showActions?: boolean
    actions?: ActionItem[]
    actionSize?: 'small' | 'medium' | 'large'

    // 样式配置
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    textColor?: string
    titleColor?: string
    subtitleColor?: string
    padding?: number
    minHeight?: number

    // 布局配置
    layout?: 'vertical' | 'horizontal'
    contentAlign?: 'left' | 'center' | 'right'
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '数据展示卡片',
    subtitle: '副标题',
    description: '这是一个数据展示卡片',
    showTitle: true,
    showSubtitle: false,
    showDescription: true,
    showIcon: true,
    iconType: 'stats-chart',
    iconSize: 24,
    iconColor: '#18a058',
    mainValue: '12,345',
    mainUnit: '次',
    valueFormat: 'number',
    showTrend: true,
    trendDirection: 'up',
    trendText: '较昨日 +5.2%',
    showDataList: true,
    dataList: [
      { label: '今日新增', value: '234', unit: '次', color: '#18a058' },
      { label: '本周累计', value: '1,567', unit: '次', color: '#2080f0' }
    ],
    showActions: false,
    actions: [],
    actionSize: 'small',
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e6',
    borderWidth: 1,
    borderRadius: 8,
    textColor: '#333333',
    titleColor: '#1a1a1a',
    subtitleColor: '#666666',
    padding: 16,
    minHeight: 200,
    layout: 'vertical',
    contentAlign: 'left'
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

// 🔥 数据模拟器 - 提供动态数据源
const simulatedData = ref({
  temperature: 25.6,
  humidity: 68,
  pressure: 1013.25,
  timestamp: new Date()
})

const currentData = ref({
  mainValue: props.config.mainValue || 25.6,
  title: props.config.title || '数据展示卡片',
  trendText: props.config.trendText || '较昨日 +2.3°C'
})

let dataSimulatorTimer: number | null = null

// 图标组件
const iconComponent = computed(() => {
  return ICON_MAP[props.config.iconType] || StatsChartOutline
})

// 趋势图标和颜色
const trendIcon = computed(() => {
  switch (props.config.trendDirection) {
    case 'up':
      return TrendingUpOutline
    case 'down':
      return TrendingDownOutline
    default:
      return RemoveOutline
  }
})

const trendColor = computed(() => {
  if (props.config.trendColor) return props.config.trendColor

  switch (props.config.trendDirection) {
    case 'up':
      return '#18a058'
    case 'down':
      return '#d03050'
    default:
      return '#909399'
  }
})

// 格式化主要数值 - 使用模拟数据
const formattedMainValue = computed(() => {
  const value = currentData.value.mainValue
  if (!value && value !== 0) return '0'

  switch (props.config.valueFormat) {
    case 'percentage':
      return `${value}%`
    case 'currency':
      return `¥${value}`
    default:
      return typeof value === 'number' ? value.toLocaleString() : value
  }
})

// 样式计算
const cardStyles = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  border: `${props.config.borderWidth}px solid ${props.config.borderColor}`,
  borderRadius: `${props.config.borderRadius}px`,
  padding: `${props.config.padding}px`,
  minHeight: `${props.config.minHeight}px`,
  color: props.config.textColor,
  display: 'flex',
  flexDirection: props.config.layout === 'horizontal' ? 'row' : 'column',
  alignItems: props.config.layout === 'horizontal' ? 'center' : 'stretch'
}))

// 🔥 合并交互状态的最终样式
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
    // 动画状态
    ...(state.isAnimating && {
      transform: `${state.transform || ''} scale(1.05)`,
      boxShadow: '0 4px 20px rgba(0, 123, 255, 0.3)'
    })
  }
})

const headerStyles = computed(() => ({
  marginBottom: props.config.layout === 'vertical' ? '12px' : '0',
  marginRight: props.config.layout === 'horizontal' ? '16px' : '0',
  textAlign: props.config.contentAlign
}))

const titleStyles = computed(() => ({
  color: props.config.titleColor,
  fontSize: '16px',
  fontWeight: '600',
  margin: '0'
}))

const subtitleStyles = computed(() => ({
  color: props.config.subtitleColor,
  fontSize: '12px',
  marginTop: '4px'
}))

const contentStyles = computed(() => ({
  flex: '1',
  textAlign: props.config.contentAlign
}))

const mainValueStyles = computed(() => ({
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  justifyContent:
    props.config.contentAlign === 'center'
      ? 'center'
      : props.config.contentAlign === 'right'
        ? 'flex-end'
        : 'flex-start'
}))

const trendStyles = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  marginBottom: '8px',
  justifyContent:
    props.config.contentAlign === 'center'
      ? 'center'
      : props.config.contentAlign === 'right'
        ? 'flex-end'
        : 'flex-start'
}))

const descriptionStyles = computed(() => ({
  fontSize: '12px',
  opacity: '0.7',
  marginBottom: '12px'
}))

const dataItemStyles = computed(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: '12px',
  borderBottom: '1px solid rgba(0,0,0,0.05)'
}))

// 🔥 交互事件处理器
const handleClick = createEventHandler('click')
const handleMouseEnter = createEventHandler('hover')
const handleMouseLeave = () => {
  console.log(`[DataDisplayCard] 鼠标离开 - ${props.componentId}`)
}
const handleFocus = createEventHandler('focus')
const handleBlur = createEventHandler('blur')

// 操作按钮事件处理
const handleAction = (action: ActionItem) => {
  console.log('[DataDisplayCard] 操作点击:', action)
  // 这里可以发送事件给父组件
  // emit('action', action)
}

// 🔥 测试属性变化的方法
const changeTitle = (newTitle: string) => {
  const oldTitle = currentData.value.title
  console.log(`[DataDisplayCard] 测试属性变化: ${oldTitle} -> ${newTitle}`)

  // 更新当前数据中的标题
  currentData.value.title = newTitle

  // 🔥 手动触发 dataChange 事件
  if (typeof triggerInteractionEvent === 'function') {
    try {
      const result = triggerInteractionEvent('dataChange', {
        property: 'title',
        oldValue: oldTitle,
        newValue: newTitle,
        source: 'component-internal-test'
      })
      console.log(`[DataDisplayCard] dataChange 事件触发结果:`, result)
    } catch (error) {
      console.error(`[DataDisplayCard] 触发 dataChange 事件失败:`, error)
    }
  } else {
    console.warn('[DataDisplayCard] triggerInteractionEvent 方法不可用')
  }
}

const resetTitle = () => {
  changeTitle(props.config.title || '数据展示卡片')
}

// 🔥 启动数据模拟器
const startDataSimulator = () => {
  // 每3秒更新一次数据
  dataSimulatorTimer = window.setInterval(() => {
    // 模拟温度数据变化 (20-35度)
    const baseTemp = 25.6
    const variation = (Math.random() - 0.5) * 10 // -5到+5的变化
    simulatedData.value.temperature = Math.max(20, Math.min(35, baseTemp + variation))

    // 模拟湿度变化 (40-80%)
    simulatedData.value.humidity = Math.max(40, Math.min(80, 68 + (Math.random() - 0.5) * 20))

    // 更新显示数据
    currentData.value.mainValue = Number(simulatedData.value.temperature.toFixed(1))

    // 生成趋势文字
    const trend = simulatedData.value.temperature > 27 ? '+' : simulatedData.value.temperature < 23 ? '-' : '±'
    const change = Math.abs(simulatedData.value.temperature - 25.6).toFixed(1)
    currentData.value.trendText = `较基准温度 ${trend}${change}°C`

    // 更新时间戳
    simulatedData.value.timestamp = new Date()

    console.log(`[DataDisplayCard] 数据更新 - ${props.componentId}:`, {
      temperature: simulatedData.value.temperature,
      humidity: simulatedData.value.humidity,
      timestamp: simulatedData.value.timestamp.toLocaleTimeString()
    })
  }, 3000)

  console.log(`[DataDisplayCard] 数据模拟器已启动 - ${props.componentId}`)
}

// 🔥 停止数据模拟器
const stopDataSimulator = () => {
  if (dataSimulatorTimer) {
    clearInterval(dataSimulatorTimer)
    dataSimulatorTimer = null
    console.log(`[DataDisplayCard] 数据模拟器已停止 - ${props.componentId}`)
  }
}

// 🔥 注册组件属性暴露配置
onMounted(() => {
  console.log(`[DataDisplayCard] 组件已挂载 - ${props.componentId}`)

  // 启动数据模拟器
  startDataSimulator()

  const propertyExposure = createPropertyExposure('data-display-card', '数据展示卡片', [
    // 基础内容属性
    { ...CommonProperties.title, defaultValue: props.config.title },
    { ...CommonProperties.content, name: 'subtitle', label: '副标题', defaultValue: props.config.subtitle },

    // 数值相关属性
    { ...CommonProperties.value, name: 'mainValue', label: '主要数值', defaultValue: props.config.mainValue },

    createProperty('mainUnit', '数值单位', 'string', {
      description: '主要数值的单位',
      group: '数据',
      defaultValue: props.config.mainUnit,
      example: '°C'
    }),

    createProperty('trendText', '趋势文字', 'string', {
      description: '趋势描述文字',
      group: '数据',
      defaultValue: props.config.trendText,
      example: '较昨日上升 5%'
    }),

    createProperty('description', '描述信息', 'string', {
      description: '组件的描述文字',
      group: '内容',
      defaultValue: props.config.description,
      example: '设备运行状态良好'
    }),

    // 样式相关属性
    { ...CommonProperties.backgroundColor, defaultValue: props.config.backgroundColor },
    { ...CommonProperties.textColor, defaultValue: props.config.textColor },
    { ...CommonProperties.visibility, defaultValue: 'visible' },

    createProperty('primaryColor', '主色调', 'color', {
      description: '卡片的主色调',
      group: '样式',
      defaultValue: props.config.primaryColor,
      example: '#007bff'
    }),

    // 显示控制属性
    createProperty('showTitle', '显示标题', 'boolean', {
      description: '是否显示标题区域',
      group: '显示控制',
      defaultValue: props.config.showTitle
    }),

    createProperty('showIcon', '显示图标', 'boolean', {
      description: '是否显示标题图标',
      group: '显示控制',
      defaultValue: props.config.showIcon
    }),

    createProperty('showTrend', '显示趋势', 'boolean', {
      description: '是否显示趋势指示器',
      group: '显示控制',
      defaultValue: props.config.showTrend
    }),

    createProperty('iconType', '图标类型', 'string', {
      description: '标题图标的类型',
      group: '样式',
      defaultValue: props.config.iconType,
      enum: [
        { label: '饼图', value: 'pie-chart' },
        { label: '柱状图', value: 'bar-chart' },
        { label: '统计图', value: 'stats-chart' }
      ]
    })
  ])

  propertyExposureRegistry.register(propertyExposure)
})

// 🔥 组件卸载时清理
onUnmounted(() => {
  console.log(`[DataDisplayCard] 组件即将卸载 - ${props.componentId}`)
  stopDataSimulator()
})
</script>

<style scoped>
.data-display-card {
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-display-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  flex-shrink: 0;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  flex-shrink: 0;
}

.card-title {
  flex: 1;
  line-height: 1.2;
}

.card-content {
  overflow: hidden;
}

.main-value {
  line-height: 1;
}

.value-number {
  color: inherit;
}

.value-unit {
  font-size: 14px;
  opacity: 0.7;
}

.trend-indicator {
  color: inherit;
}

.trend-text {
  white-space: nowrap;
}

.data-list {
  max-height: 150px;
  overflow-y: auto;
}

.data-item:last-child {
  border-bottom: none;
}

.item-label {
  opacity: 0.7;
}

.item-value {
  font-weight: 500;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 滚动条样式 */
.data-list::-webkit-scrollbar {
  width: 4px;
}

.data-list::-webkit-scrollbar-track {
  background: transparent;
}

.data-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.data-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
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

/* 交互增强样式 */
.data-display-card:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.data-display-card:hover {
  cursor: pointer;
}

/* 🔥 测试按钮样式 */
.test-buttons {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
}

.test-buttons-title {
  font-size: 12px;
  font-weight: bold;
  color: #856404;
  margin-bottom: 8px;
}

.test-buttons-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.current-title {
  font-size: 11px;
  color: #6c757d;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-family: monospace;
}
</style>
