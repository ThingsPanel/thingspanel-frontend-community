<template>
  <div class="data-display-card" :style="cardStyles">
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
        <span class="trend-text">{{ config.trendText || '持平' }}</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据展示卡片组件
 * 用于展示关键数据指标、趋势和操作
 */

import { computed, shallowRef } from 'vue'
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

interface Props {
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
  })
})

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

// 格式化主要数值
const formattedMainValue = computed(() => {
  const value = props.config.mainValue
  if (!value) return '0'

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

// 事件处理
const handleAction = (action: ActionItem) => {
  console.log('[DataDisplayCard] 操作点击:', action)
  // 这里可以发送事件给父组件
  // emit('action', action)
}

// 移除调试日志，提高性能
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
</style>
