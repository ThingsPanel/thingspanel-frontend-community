<script setup lang="ts">
/**
 * dual-data-display 主组件
 * 基于新的三文件结构标准，支持 CustomConfig 类型配置和属性绑定
 */

import { computed, reactive } from 'vue'
import type { DualDataDisplayConfig, DualDataDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  clickCount: number
}

// 简化的组件props
interface Props {
  /** 新的CustomConfig结构配置 */
  customConfig?: DualDataDisplayConfig
  /** 向后兼容：旧的config结构 */
  config?: Partial<DualDataDisplayCustomize>
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
  config: () => ({}),
  previewMode: false,
  dataSource1: null,
  dataSource2: null
})

// 简化的事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  clickCount: 0
})

/**
 * 获取组件配置 - 支持新旧格式
 * 优先使用 customConfig.customize，回退到 config
 */
const currentCustomize = computed((): DualDataDisplayCustomize => {
  // 优先使用新的customConfig结构
  if (props.customConfig?.customize) {
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  return {
    title: props.config?.title || '双数据展示',
    themeColor: props.config?.themeColor || '#2080f0',
    fontSize: props.config?.fontSize || 16,
    showBorder: props.config?.showBorder ?? true,
    dataSource1Label: props.config?.dataSource1Label || '数据源A',
    dataSource2Label: props.config?.dataSource2Label || '数据源B',
    numberFormat: props.config?.numberFormat || 'raw',
    unit: props.config?.unit || ''
  }
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

// 计算属性：从customize中提取各个属性
const currentTitle = computed(() => currentCustomize.value.title)
const themeColor = computed(() => currentCustomize.value.themeColor)
const fontSize = computed(() => currentCustomize.value.fontSize)
const showBorder = computed(() => currentCustomize.value.showBorder)
const dataSource1Label = computed(() => currentCustomize.value.dataSource1Label)
const dataSource2Label = computed(() => currentCustomize.value.dataSource2Label)
const numberFormat = computed(() => currentCustomize.value.numberFormat)
const unit = computed(() => currentCustomize.value.unit)

/**
 * 数据格式化 - 简化版
 */
const formatData = (data: any): string => {
  if (data === null || data === undefined) {
    return '暂无数据'
  }

  // 处理对象类型的数据源
  let actualValue = data
  if (typeof data === 'object' && data !== null) {
    if (data.type && data.data && typeof data.data === 'object') {
      // 尝试从data对象中提取第一个数值字段
      const dataObj = data.data
      for (const [key, val] of Object.entries(dataObj)) {
        if (typeof val === 'number') {
          actualValue = val
          break
        }
        if (typeof val === 'string' && !isNaN(parseFloat(val as string))) {
          actualValue = parseFloat(val as string)
          break
        }
      }

      // 如果没有找到数值，显示第一个字符串值
      if (actualValue === data && Object.keys(dataObj).length > 0) {
        const firstValue = Object.values(dataObj)[0]
        actualValue = String(firstValue)
      }
    } else if (typeof data.value === 'number' || typeof data.value === 'string') {
      actualValue = data.value
    } else if (typeof data.data === 'number' || typeof data.data === 'string') {
      actualValue = data.data
    } else {
      return '[需要配置数据字段]'
    }
  }

  if (typeof actualValue === 'number') {
    const num = Number(actualValue)
    switch (numberFormat.value) {
      case 'thousands':
        return num.toLocaleString()
      case 'decimal2':
        return num.toFixed(2)
      case 'percentage':
        return (num * 100).toFixed(1) + '%'
      default:
        return actualValue.toString()
    }
  }

  return String(actualValue)
}

/**
 * 更新交互状态
 */
const updateInteractionState = (eventType: string) => {
  interactionState.lastInteractionTime = new Date().toISOString()
  interactionState.interactionCount++

  // 发送交互状态变化事件
  emit('interaction-state-change', {
    componentId: props.componentId || '',
    state: 'active',
    lastEventType: eventType as any,
    timestamp: Date.now()
  })
}

/**
 * 点击处理 - 支持交互系统
 */
const handleClick = () => {
  // 更新组件状态
  componentState.clickCount++
  updateInteractionState('click')

  // 发送标准点击事件
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })

  // 🔥 触发交互系统事件处理
  if (props.componentId) {
    triggerEvent('click', {
      componentId: props.componentId,
      clickCount: componentState.clickCount,
      timestamp: new Date().toISOString(),
      data: {
        dataSource1: props.dataSource1,
        dataSource2: props.dataSource2
      }
    })
  }

  // 发送交互事件（用于交互系统处理）
  if (props.previewMode) {
    emit('interaction-event', 'click', {
      componentId: props.componentId,
      clickCount: componentState.clickCount,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 悬停处理 - 支持交互系统
 */
const handleMouseEnter = () => {
  updateInteractionState('hover')

  emit('hover', {
    componentId: props.componentId || '',
    type: 'enter'
  })

  if (props.previewMode) {
    emit('interaction-event', 'hover', {
      componentId: props.componentId,
      hoverType: 'enter',
      timestamp: new Date().toISOString()
    })
  }
}

const handleMouseLeave = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'leave'
  })

  if (props.previewMode) {
    emit('interaction-event', 'hover', {
      componentId: props.componentId,
      hoverType: 'leave',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 🔥 新增：监听组件属性更新事件
 * 支持跨组件属性绑定
 */
const handlePropertyUpdate = (event: CustomEvent) => {
  const { propertyPath, value } = event.detail

  // 根据属性路径更新本地状态
  if (propertyPath.startsWith('customize.')) {
    // 这里可以添加响应式更新逻辑
    // 由于我们使用的是computed，prop变化会自动触发重新渲染
  }
}

/**
 * 组件挂载时监听属性更新事件
 */
onMounted(() => {
  const element = getCurrentInstance()?.proxy?.$el
  if (element) {
    element.addEventListener('componentPropertyUpdate', handlePropertyUpdate)
  }
})

/**
 * 组件卸载时移除事件监听
 */
onUnmounted(() => {
  const element = getCurrentInstance()?.proxy?.$el
  if (element) {
    element.removeEventListener('componentPropertyUpdate', handlePropertyUpdate)
  }
})
</script>

<template>
  <div
    class="dual-data-display"
    :class="{
      'interaction-active': hasActiveInteractions,
      'preview-mode': previewMode,
      'show-indicator': showInteractionIndicator,
      'show-border': showBorder
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`,
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="header">
      <h3>{{ currentTitle }}</h3>
    </div>

    <div class="content-section">
      <div class="data-grid">
        <!-- 数据源1 -->
        <div class="data-item">
          <div class="data-label">{{ dataSource1Label }}</div>
          <div class="data-value">
            {{ formatData(dataSource1) }}
            <span v-if="unit" class="data-unit">{{ unit }}</span>
          </div>
        </div>

        <!-- 数据源2 -->
        <div class="data-item">
          <div class="data-label">{{ dataSource2Label }}</div>
          <div class="data-value">
            {{ formatData(dataSource2) }}
            <span v-if="unit" class="data-unit">{{ unit }}</span>
          </div>
        </div>
      </div>

      <div class="info-panel">
        <div class="info-item">
          <span class="label">组件类型:</span>
          <span class="value">双数据展示</span>
        </div>
        <div class="info-item">
          <span class="label">数据格式:</span>
          <span class="value">{{ numberFormat }}</span>
        </div>
        <div class="info-item">
          <span class="label">状态:</span>
          <span class="value status-ready">就绪</span>
        </div>
      </div>
    </div>

    <!-- 交互指示器 -->
    <div v-if="showInteractionIndicator" class="interaction-indicator">
      <div class="indicator-dot"></div>
      <span class="indicator-text">支持交互</span>
    </div>

    <!-- 组件信息和状态 -->
    <div class="component-info">
      <div class="basic-info">
        <small>组件ID: {{ props.componentId || '未设置' }}</small>
      </div>

      <!-- 开发/调试模式下显示状态信息 -->
      <div v-if="previewMode" class="state-info">
        <div class="state-item">
          <small>点击次数: {{ componentState.clickCount }}</small>
        </div>
        <div class="state-item">
          <small>交互次数: {{ interactionState.interactionCount }}</small>
        </div>
        <div v-if="interactionState.lastInteractionTime" class="state-item">
          <small>最后交互: {{ new Date(interactionState.lastInteractionTime).toLocaleTimeString() }}</small>
        </div>
      </div>

      <!-- 🔥 新增：配置结构信息（调试用） -->
      <div v-if="previewMode" class="config-debug">
        <small>配置类型: {{ customConfig ? 'CustomConfig' : 'Legacy Config' }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dual-data-display {
  padding: 20px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size, 16px);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  container-type: size; /* 启用容器查询 */
}

.dual-data-display.show-border {
  border: 1px solid var(--border-color);
}

.dual-data-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--theme-color);
}

/* 交互激活状态 */
.dual-data-display.interaction-active {
  position: relative;
}

.dual-data-display.interaction-active:hover {
  border-color: var(--success-color);
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.2);
}

.header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-color);
}

.header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: calc(var(--font-size, 16px) + 4px);
  font-weight: bold;
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.data-item {
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
  border-left: 4px solid var(--theme-color);
  text-align: center;
}

.data-label {
  font-size: calc(var(--font-size, 16px) - 2px);
  color: var(--text-color-2);
  margin-bottom: 8px;
  font-weight: 500;
}

.data-value {
  font-size: calc(var(--font-size, 16px) + 6px);
  color: var(--text-color);
  font-weight: bold;
  word-break: break-all;
}

.data-unit {
  font-size: calc(var(--font-size, 16px) + 2px);
  color: var(--text-color-2);
  margin-left: 4px;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item .label {
  color: var(--text-color-2);
  font-weight: 500;
}

.info-item .value {
  color: var(--text-color);
  font-weight: bold;
}

.status-ready {
  color: var(--success-color) !important;
}

/* 交互指示器 */
.interaction-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--success-color);
  color: white;
  font-size: 10px;
  border-radius: 12px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.dual-data-display:hover .interaction-indicator {
  opacity: 1;
  transform: scale(1.05);
}

.indicator-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: indicator-blink 1.5s infinite;
}

@keyframes indicator-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}

.indicator-text {
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 组件信息区域 - 优化高度自适应 */
.component-info {
  margin-top: auto; /* 自动推到底部 */
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: calc(var(--font-size, 16px) - 4px);
  flex-shrink: 0; /* 防止被压缩 */
}

/* 在小高度容器中隐藏组件信息 */
@media (max-height: 280px) {
  .dual-data-display .component-info {
    display: none;
  }
  .dual-data-display {
    padding: 12px;
  }
}

/* 容器查询支持的浏览器使用更精确的容器查询 */
@container (height < 250px) {
  .component-info {
    display: none;
  }
}

@container (height < 200px) {
  .dual-data-display {
    padding: 12px;
  }
  .data-grid {
    gap: 16px;
  }
}

.basic-info {
  text-align: center;
  margin-bottom: 8px;
}

/* 状态信息 */
.state-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.state-item {
  padding: 2px 6px;
  background: var(--tag-color, var(--card-color));
  border-radius: 3px;
  font-size: 10px;
  color: var(--text-color-2);
}

.state-item small {
  font-weight: 500;
}


/* 响应式设计 */
@media (max-width: 600px) {
  .dual-data-display {
    padding: 16px;
  }

  .data-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>
