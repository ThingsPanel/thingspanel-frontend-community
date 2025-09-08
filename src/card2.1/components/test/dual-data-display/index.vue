<script setup lang="ts">
/**
 * dual-data-display 主组件
 * 基于新的三文件结构标准
 */

import { computed, reactive } from 'vue'
import type { DualDataDisplayConfig, DualDataDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  lastUpdate: string
  dataSource1Status: 'loading' | 'success' | 'error'
  dataSource2Status: 'loading' | 'success' | 'error'
}

// 组件props
interface Props {
  /** CustomConfig结构配置 */
  customConfig?: DualDataDisplayConfig
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
  /** 数据源1的数据 */
  dataSource1?: any
  /** 数据源2的数据 */
  dataSource2?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  previewMode: false,
  dataSource1: null,
  dataSource2: null
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
  (e: 'dataChange', data: { source: 'dataSource1' | 'dataSource2'; value: any }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  lastUpdate: new Date().toISOString(),
  dataSource1Status: 'loading',
  dataSource2Status: 'loading'
})

/**
 * 获取组件配置
 */
const currentCustomize = computed((): DualDataDisplayCustomize => {
  return props.customConfig?.customize || {
    title: '双数据展示',
    themeColor: '#2080f0',
    fontSize: 16,
    showBorder: true,
    dataSource1Label: '数据源A',
    dataSource2Label: '数据源B',
    numberFormat: 'raw',
    unit: '',
    layout: 'horizontal'
  }
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

/**
 * 数据格式化函数
 */
const formatData = (data: any): string => {
  if (data === null || data === undefined) {
    return '暂无数据'
  }

  if (typeof data === 'object') {
    // 如果是对象，尝试获取value字段
    const value = data.value ?? data.data ?? data
    return formatNumber(value)
  }

  return formatNumber(data)
}

/**
 * 数字格式化
 */
const formatNumber = (value: any): string => {
  const num = parseFloat(value)
  if (isNaN(num)) {
    return String(value)
  }

  const format = currentCustomize.value.numberFormat
  switch (format) {
    case 'integer':
      return Math.round(num).toString()
    case 'decimal1':
      return num.toFixed(1)
    case 'decimal2':
      return num.toFixed(2)
    case 'percentage':
      return (num * 100).toFixed(1) + '%'
    case 'thousands':
      return num.toLocaleString()
    default:
      return num.toString()
  }
}

/**
 * 格式化后的数据源1数据
 */
const formattedDataSource1 = computed(() => {
  const formatted = formatData(props.dataSource1)
  const unit = currentCustomize.value.unit
  return unit ? `${formatted} ${unit}` : formatted
})

/**
 * 格式化后的数据源2数据
 */
const formattedDataSource2 = computed(() => {
  const formatted = formatData(props.dataSource2)
  const unit = currentCustomize.value.unit
  return unit ? `${formatted} ${unit}` : formatted
})

// 事件处理
const handleClick = () => {
  componentState.lastUpdate = new Date().toISOString()
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })
}

const handleMouseEnter = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'enter'
  })
}

const handleMouseLeave = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'leave'
  })
}

// 监听数据变化
const handleDataSource1Change = () => {
  componentState.dataSource1Status = props.dataSource1 ? 'success' : 'error'
  emit('dataChange', {
    source: 'dataSource1',
    value: props.dataSource1
  })
}

const handleDataSource2Change = () => {
  componentState.dataSource2Status = props.dataSource2 ? 'success' : 'error'
  emit('dataChange', {
    source: 'dataSource2',
    value: props.dataSource2
  })
}

// 暴露方法给父组件
defineExpose({
  componentState,
  currentCustomize,
  formattedDataSource1,
  formattedDataSource2
})
</script>

<template>
  <div
    class="dual-data-display"
    :class="{
      'layout-vertical': currentCustomize.layout === 'vertical',
      'layout-horizontal': currentCustomize.layout === 'horizontal',
      'show-border': currentCustomize.showBorder
    }"
    :style="{
      '--theme-color': currentCustomize.themeColor,
      '--font-size': currentCustomize.fontSize + 'px',
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 标题区域 -->
    <div class="display-header">
      <h3 class="display-title">{{ currentCustomize.title }}</h3>
    </div>
    
    <!-- 数据展示区域 -->
    <div class="data-container">
      <!-- 数据源1 -->
      <div class="data-item data-source-1">
        <div class="data-label">{{ currentCustomize.dataSource1Label }}</div>
        <div class="data-value" :class="`status-${componentState.dataSource1Status}`">
          {{ formattedDataSource1 }}
        </div>
        <div class="data-status">
          <span class="status-indicator" :class="componentState.dataSource1Status"></span>
        </div>
      </div>
      
      <!-- 分隔符 -->
      <div class="separator">
        <span class="separator-line"></span>
        <span class="separator-text">VS</span>
        <span class="separator-line"></span>
      </div>
      
      <!-- 数据源2 -->
      <div class="data-item data-source-2">
        <div class="data-label">{{ currentCustomize.dataSource2Label }}</div>
        <div class="data-value" :class="`status-${componentState.dataSource2Status}`">
          {{ formattedDataSource2 }}
        </div>
        <div class="data-status">
          <span class="status-indicator" :class="componentState.dataSource2Status"></span>
        </div>
      </div>
    </div>
    
    <!-- 状态信息 -->
    <div class="status-info">
      <span class="update-time">更新时间: {{ new Date(componentState.lastUpdate).toLocaleTimeString() }}</span>
    </div>
  </div>
</template>

<style scoped>
.dual-data-display {
  padding: 20px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dual-data-display.show-border {
  border: 1px solid var(--border-color);
}

.dual-data-display:hover {
  border-color: var(--theme-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.display-header {
  text-align: center;
}

.display-title {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-size);
  font-weight: 600;
}

.data-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.layout-vertical .data-container {
  flex-direction: column;
  gap: 16px;
}

.layout-horizontal .data-container {
  flex-direction: row;
}

.data-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--body-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.data-item:hover {
  border-color: var(--theme-color);
  background: var(--hover-color);
}

.data-label {
  font-size: calc(var(--font-size) - 2px);
  color: var(--text-color-2);
  font-weight: 500;
  text-align: center;
}

.data-value {
  font-size: calc(var(--font-size) + 4px);
  font-weight: 700;
  color: var(--text-color);
  text-align: center;
  min-height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-value.status-loading {
  color: var(--warning-color);
}

.data-value.status-success {
  color: var(--success-color);
}

.data-value.status-error {
  color: var(--error-color);
}

.data-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.status-indicator.loading {
  background: var(--warning-color);
  animation: pulse 1.5s infinite;
}

.status-indicator.success {
  background: var(--success-color);
}

.status-indicator.error {
  background: var(--error-color);
}

.separator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color-3);
}

.layout-vertical .separator {
  flex-direction: column;
  writing-mode: vertical-rl;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
  min-width: 20px;
}

.layout-vertical .separator-line {
  width: 1px;
  height: 20px;
  min-width: unset;
  min-height: 20px;
}

.separator-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-color);
  padding: 4px 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.status-info {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.update-time {
  font-size: 12px;
  color: var(--text-color-3);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dual-data-display {
    padding: 16px;
  }
  
  .data-container {
    gap: 12px;
  }
  
  .layout-horizontal .data-container {
    flex-direction: column;
  }
  
  .data-item {
    padding: 12px;
  }
}
</style>
