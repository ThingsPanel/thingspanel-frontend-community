<script setup lang="ts">
/**
 * simple-display 主组件
 * 基于新的三文件结构标准，支持 CustomConfig 类型配置和属性绑定
 */

import { computed, reactive, getCurrentInstance, onMounted, onUnmounted, watch } from 'vue'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'
import type { SimpleDisplayConfig, SimpleDisplayCustomize } from './settingConfig'
import { useInteraction } from '@/card2.1/hooks/use-interaction'

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

// 组件props - 支持新的CustomConfig结构
interface Props extends InteractionProps {
  /** 新的CustomConfig结构配置 */
  customConfig?: SimpleDisplayConfig
  /** 向后兼容：旧的config结构 */
  config?: Partial<SimpleDisplayCustomize>
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
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

// 🔥 集成交互系统 - 初始化交互管理器
const {
  interactionStyles,
  isRegistered,
  register,
  unregister,
  updateConfigs,
  triggerEvent,
  resetState,
  getState
} = useInteraction({
  componentId: props.componentId || '',
  configs: props.interactionConfigs || [],
  autoRegister: true,
  autoWatch: true
})

/**
 * 获取组件配置 - 支持新旧格式
 * 优先使用 customConfig.customize，回退到 config
 */
const currentCustomize = computed((): SimpleDisplayCustomize => {
  // 优先使用新的customConfig结构
  if (props.customConfig?.customize) {
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  return {
    title: props.config?.title || '简单展示组件',
    content: props.config?.content || '这是一个静态展示组件，不需要数据源',
    themeColor: props.config?.themeColor || '#2080f0',
    fontSize: props.config?.fontSize || 16,
    showIcon: props.config?.showIcon ?? true,
    iconName: props.config?.iconName || '📊'
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
const currentContent = computed(() => currentCustomize.value.content)
const themeColor = computed(() => currentCustomize.value.themeColor)
const fontSize = computed(() => currentCustomize.value.fontSize)
const showIcon = computed(() => currentCustomize.value.showIcon)
const iconName = computed(() => currentCustomize.value.iconName)

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
      timestamp: new Date().toISOString()
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

  // 🔥 触发交互系统悬停事件
  if (props.componentId) {
    triggerEvent('hover', {
      componentId: props.componentId,
      hoverType: 'enter',
      timestamp: new Date().toISOString()
    })
  }

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
  const { propertyPath, value, oldValue } = event.detail

  // 根据属性路径更新本地状态
  if (propertyPath.startsWith('customize.')) {
    // 这里可以添加响应式更新逻辑
    // 由于我们使用的是computed，prop变化会自动触发重新渲染
  }
  
  // 🔥 触发数据变化事件到交互系统
  if (props.componentId) {
    triggerEvent('dataChange', {
      property: propertyPath,
      newValue: value,
      oldValue,
      timestamp: Date.now()
    })
  }
}

/**
 * 🔥 新增：监听组件状态更新事件
 * 处理来自InteractionManager的状态变化
 */
const handleComponentStateUpdate = (event: CustomEvent) => {
  const { componentId, updates, fullState } = event.detail
  
  if (componentId === props.componentId) {
    // 应用交互系统的状态更新
    Object.assign(interactionState, {
      ...interactionState,
      lastInteractionTime: new Date().toISOString(),
      interactionCount: interactionState.interactionCount + 1
    })
    
    // 应用样式更新（如背景色、透明度等）
    // interactionStyles 会自动通过 useInteraction 更新
  }
}

/**
 * 🔥 监听交互配置变化，重新注册配置
 */
watch(
  () => props.interactionConfigs,
  (newConfigs) => {
    if (newConfigs && props.componentId) {
      updateConfigs(newConfigs)
    }
  },
  { deep: true, immediate: true }
)

/**
 * 组件挂载时监听属性更新事件
 */
onMounted(() => {
  const element = getCurrentInstance()?.proxy?.$el
  if (element) {
    element.addEventListener('componentPropertyUpdate', handlePropertyUpdate)
    element.addEventListener('componentStateUpdate', handleComponentStateUpdate)
  }
})

/**
 * 组件卸载时移除事件监听
 */
onUnmounted(() => {
  const element = getCurrentInstance()?.proxy?.$el
  if (element) {
    element.removeEventListener('componentPropertyUpdate', handlePropertyUpdate)
    element.removeEventListener('componentStateUpdate', handleComponentStateUpdate)
  }
})
</script>

<template>
  <div
    class="simple-display"
    :class="{
      'interaction-active': hasActiveInteractions,
      'preview-mode': previewMode,
      'show-indicator': showInteractionIndicator,
      'interaction-registered': isRegistered
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`,
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`,
      ...interactionStyles
    }"
    :data-component-id="componentId"
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

      <!-- 🔥 新增：配置结构信息（调试用） -->
      <div v-if="previewMode" class="config-debug">
        <small>配置类型: {{ customConfig ? 'CustomConfig' : 'Legacy Config' }}</small>
      </div>

      <!-- 🔥 新增：交互系统状态（调试用） -->
      <div v-if="previewMode" class="interaction-debug">
        <div class="debug-item">
          <small>交互注册: {{ isRegistered ? '已注册' : '未注册' }}</small>
        </div>
        <div class="debug-item" v-if="interactionConfigs && interactionConfigs.length > 0">
          <small>交互配置: {{ interactionConfigs.length }} 项</small>
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
  position: relative; /* 为属性绑定事件定位 */
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
  0%,
  100% {
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

/* 配置调试信息 */
.config-debug {
  text-align: center;
  padding: 4px 8px;
  background: var(--info-color-suppl);
  border-radius: 4px;
  font-size: 10px;
  color: var(--info-color);
  font-weight: 500;
}

/* 🔥 新增：交互系统调试信息 */
.interaction-debug {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.debug-item {
  padding: 2px 6px;
  background: var(--success-color-suppl, var(--card-color));
  border-radius: 3px;
  font-size: 10px;
  color: var(--success-color);
}

.debug-item small {
  font-weight: 500;
}

/* 🔥 新增：交互注册状态样式 */
.simple-display.interaction-registered {
  border-left: 3px solid var(--success-color);
}

.simple-display.interaction-registered::after {
  content: '⚡';
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 12px;
  color: var(--success-color);
  opacity: 0.7;
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
