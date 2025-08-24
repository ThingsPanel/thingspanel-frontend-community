<script setup lang="ts">
/**
 * 简单展示组件
 * 无数据源，纯静态配置组件，支持完整的交互系统
 */

import { computed, reactive, ref } from 'vue'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'

// 组件配置接口
interface ComponentConfig {
  title?: string
  content?: string
  themeColor?: string
  fontSize?: number
  showIcon?: boolean
  iconName?: string
}

// 组件状态接口
interface ComponentState {
  isActive: boolean
  clickCount: number
}

// 交互状态接口
interface InteractionState {
  lastInteractionTime: string | null
  interactionCount: number
}

// 组件props - 继承交互系统标准props
interface Props extends InteractionProps {
  config?: ComponentConfig
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  config: () => ({}),
  allowExternalControl: true,
  showInteractionIndicator: false,
  previewMode: false
})

// 组件事件定义 - 继承交互系统标准事件
interface Emits extends InteractionEmits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  clickCount: 0
})

// 交互状态管理
const interactionState = reactive<InteractionState>({
  lastInteractionTime: null,
  interactionCount: 0
})

// 计算属性：配置相关
const currentTitle = computed(() => props.config?.title || '简单展示组件')
const currentContent = computed(() => props.config?.content || '这是一个静态展示组件，不需要数据源')
const themeColor = computed(() => props.config?.themeColor || '#2080f0')
const fontSize = computed(() => props.config?.fontSize || 16)
const showIcon = computed(() => props.config?.showIcon ?? true)
const iconName = computed(() => props.config?.iconName || '📊')

// 计算属性：交互指示器
const showInteractionIndicator = computed(() => {
  return props.showInteractionIndicator && props.previewMode && hasActiveInteractions.value
})

const hasActiveInteractions = computed(() => {
  return props.interactionConfigs?.some(config => config.enabled) || false
})

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
  console.log('🔍 [SimpleDisplay] 组件被点击:', props.componentId)

  // 更新组件状态
  componentState.clickCount++
  updateInteractionState('click')

  // 发送标准点击事件
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })

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
  console.log('🔍 [SimpleDisplay] 鼠标进入:', props.componentId)
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
  console.log('🔍 [SimpleDisplay] 鼠标离开:', props.componentId)
  
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
</script>

<template>
  <div
    class="simple-display"
    :class="{
      'interaction-active': hasActiveInteractions,
      'preview-mode': previewMode,
      'show-indicator': showInteractionIndicator
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`
    }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="header">
      <div class="title-section">
        <span v-if="showIcon" class="icon">{{ iconName }}</span>
        <h3>{{ currentTitle }}</h3>
      </div>
    </div>

    <div class="content-section">
      <p class="main-content">{{ currentContent }}</p>

      <div class="info-panel">
        <div class="info-item">
          <span class="label">组件类型:</span>
          <span class="value">静态展示</span>
        </div>
        <div class="info-item">
          <span class="label">数据源:</span>
          <span class="value">无需数据源</span>
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
    </div>
  </div>
</template>

<style scoped>
.simple-display {
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size, 16px);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
}

.simple-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--theme-color);
}

/* 交互激活状态 */
.simple-display.interaction-active {
  position: relative;
}

.simple-display.interaction-active:hover {
  border-color: var(--success-color);
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.2);
}

/* 预览模式样式 */
.simple-display.preview-mode.interaction-active {
  cursor: pointer;
}

.simple-display.preview-mode.interaction-active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: calc(var(--border-radius) + 2px);
  transition: all 0.3s ease;
}

.simple-display.preview-mode.interaction-active:hover::before {
  border-color: var(--success-color);
  animation: interaction-pulse 2s infinite;
}

@keyframes interaction-pulse {
  0%, 100% { 
    border-color: var(--success-color);
    opacity: 1; 
  }
  50% { 
    border-color: var(--info-color);
    opacity: 0.6; 
  }
}

.header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: calc(var(--font-size, 16px) + 8px);
  color: var(--theme-color);
}

.title-section h3 {
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

.main-content {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
  border-left: 4px solid var(--theme-color);
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

.simple-display:hover .interaction-indicator {
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
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.indicator-text {
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 组件信息区域 */
.component-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: calc(var(--font-size, 16px) - 4px);
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
  .simple-display {
    padding: 16px;
  }

  .title-section {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .info-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>
