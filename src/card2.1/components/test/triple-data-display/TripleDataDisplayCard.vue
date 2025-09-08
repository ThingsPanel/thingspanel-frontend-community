<script setup lang="ts">
/**
 * triple-data-display 主组件
 * 基于新的三文件结构标准
 */

import { computed, reactive } from 'vue'
import type { TripleDataDisplayConfig, TripleDataDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  lastUpdate: string
  dataSource1Status: 'loading' | 'success' | 'error'
  dataSource2Status: 'loading' | 'success' | 'error'
  dataSource3Status: 'loading' | 'success' | 'error'
}

// 组件props
interface Props {
  /** CustomConfig结构配置 */
  customConfig?: TripleDataDisplayConfig
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
  /** 数据源1的数据 */
  dataSource1?: any
  /** 数据源2的数据 */
  dataSource2?: any
  /** 数据源3的数据 */
  dataSource3?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  previewMode: false,
  dataSource1: null,
  dataSource2: null,
  dataSource3: null
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
  (e: 'dataChange', data: { source: 'dataSource1' | 'dataSource2' | 'dataSource3'; value: any }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  lastUpdate: new Date().toISOString(),
  dataSource1Status: 'loading',
  dataSource2Status: 'loading',
  dataSource3Status: 'loading'
})

/**
 * 获取组件配置
 */
const currentCustomize = computed((): TripleDataDisplayCustomize => {
  return props.customConfig?.customize || {
    title: '三数据展示',
    themeColor: '#2080f0',
    fontSize: 16,
    showBorder: true,
    dataSource1Label: '数据源A',
    dataSource2Label: '数据源B',
    dataSource3Label: '数据源C',
    numberFormat: 'raw',
    unit: '',
    layout: 'grid',
    showIcons: true,
    iconSize: 24
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

/**
 * 格式化后的数据源3数据
 */
const formattedDataSource3 = computed(() => {
  const formatted = formatData(props.dataSource3)
  const unit = currentCustomize.value.unit
  return unit ? `${formatted} ${unit}` : formatted
})

/**
 * 获取数据项图标
 */
const getDataIcon = (index: number): string => {
  const icons = ['mdi:chart-line', 'mdi:chart-bar', 'mdi:chart-pie']
  return icons[index] || 'mdi:chart-box'
}

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

const handleDataSource3Change = () => {
  componentState.dataSource3Status = props.dataSource3 ? 'success' : 'error'
  emit('dataChange', {
    source: 'dataSource3',
    value: props.dataSource3
  })
}

// 暴露方法给父组件
defineExpose({
  componentState,
  currentCustomize,
  formattedDataSource1,
  formattedDataSource2,
  formattedDataSource3
})
</script>

<template>
  <div
    class="triple-data-display"
    :class="{
      'layout-grid': currentCustomize.layout === 'grid',
      'layout-horizontal': currentCustomize.layout === 'horizontal',
      'layout-vertical': currentCustomize.layout === 'vertical',
      'show-border': currentCustomize.showBorder
    }"
    :style="{
      '--theme-color': currentCustomize.themeColor,
      '--font-size': currentCustomize.fontSize + 'px',
      '--icon-size': currentCustomize.iconSize + 'px',
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
        <div v-if="currentCustomize.showIcons" class="data-icon">
          <i :class="getDataIcon(0)" :style="{ fontSize: currentCustomize.iconSize + 'px' }"></i>
        </div>
        <div class="data-content">
          <div class="data-label">{{ currentCustomize.dataSource1Label }}</div>
          <div class="data-value" :class="`status-${componentState.dataSource1Status}`">
            {{ formattedDataSource1 }}
          </div>
        </div>
        <div class="data-status">
          <span class="status-indicator" :class="componentState.dataSource1Status"></span>
        </div>
      </div>
      
      <!-- 数据源2 -->
      <div class="data-item data-source-2">
        <div v-if="currentCustomize.showIcons" class="data-icon">
          <i :class="getDataIcon(1)" :style="{ fontSize: currentCustomize.iconSize + 'px' }"></i>
        </div>
        <div class="data-content">
          <div class="data-label">{{ currentCustomize.dataSource2Label }}</div>
          <div class="data-value" :class="`status-${componentState.dataSource2Status}`">
            {{ formattedDataSource2 }}
          </div>
        </div>
        <div class="data-status">
          <span class="status-indicator" :class="componentState.dataSource2Status"></span>
        </div>
      </div>
      
      <!-- 数据源3 -->
      <div class="data-item data-source-3">
        <div v-if="currentCustomize.showIcons" class="data-icon">
          <i :class="getDataIcon(2)" :style="{ fontSize: currentCustomize.iconSize + 'px' }"></i>
        </div>
        <div class="data-content">
          <div class="data-label">{{ currentCustomize.dataSource3Label }}</div>
          <div class="data-value" :class="`status-${componentState.dataSource3Status}`">
            {{ formattedDataSource3 }}
          </div>
        </div>
        <div class="data-status">
          <span class="status-indicator" :class="componentState.dataSource3Status"></span>
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
.triple-data-display {
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

.triple-data-display.show-border {
  border: 1px solid var(--border-color);
}

.triple-data-display:hover {
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
  gap: 16px;
}

/* 网格布局 */
.layout-grid .data-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 水平布局 */
.layout-horizontal .data-container {
  flex-direction: row;
  align-items: stretch;
}

/* 垂直布局 */
.layout-vertical .data-container {
  flex-direction: column;
}

.data-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--body-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  min-height: 80px;
}

.layout-vertical .data-item {
  min-height: 60px;
}

.data-item:hover {
  border-color: var(--theme-color);
  background: var(--hover-color);
  transform: translateY(-1px);
}

.data-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--theme-color);
  flex-shrink: 0;
}

.data-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-label {
  font-size: calc(var(--font-size) - 2px);
  color: var(--text-color-2);
  font-weight: 500;
}

.data-value {
  font-size: calc(var(--font-size) + 2px);
  font-weight: 700;
  color: var(--text-color);
  word-break: break-all;
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
  flex-shrink: 0;
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
  .triple-data-display {
    padding: 16px;
  }
  
  .data-container {
    gap: 12px;
  }
  
  .layout-horizontal .data-container,
  .layout-grid .data-container {
    flex-direction: column;
    display: flex;
  }
  
  .data-item {
    padding: 12px;
    min-height: 60px;
  }
  
  .data-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .data-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .data-content {
    align-items: center;
  }
}
</style>