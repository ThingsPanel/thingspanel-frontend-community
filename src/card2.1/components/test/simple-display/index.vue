<script setup lang="ts">
/**
 * simple-display 主组件
 * 基于新的三文件结构标准
 */

import { computed, reactive } from 'vue'
import type { SimpleDisplayConfig, SimpleDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  lastUpdate: string
}

// 组件props
interface Props {
  /** CustomConfig结构配置 */
  customConfig?: SimpleDisplayConfig
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  previewMode: false
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  lastUpdate: new Date().toISOString()
})

/**
 * 获取组件配置
 */
const currentCustomize = computed((): SimpleDisplayCustomize => {
  return (
    props.customConfig?.customize || {
      title: '简单展示组件',
      content: '这是一个静态展示组件，不需要数据源',
      themeColor: '#2080f0',
      fontSize: 16,
      showIcon: true,
      iconName: '📊'
    }
  )
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
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

// 暴露方法给父组件
defineExpose({
  componentState,
  currentCustomize
})
</script>

<template>
  <div
    class="simple-display"
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
      <div v-if="currentCustomize.showIcon" class="display-icon">
        {{ currentCustomize.iconName }}
      </div>
      <h3 class="display-title">{{ currentCustomize.title }}</h3>
    </div>

    <!-- 内容区域 -->
    <div class="display-content">
      <p class="content-text">{{ currentCustomize.content }}</p>
    </div>

    <!-- 状态指示器 -->
    <div class="status-indicator" :class="{ active: componentState.isActive }">
      <span class="status-dot"></span>
      <span class="status-text">{{ componentState.isActive ? '活跃' : '非活跃' }}</span>
    </div>
  </div>
</template>

<style scoped>
.simple-display {
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.simple-display:hover {
  border-color: var(--theme-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.display-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.display-icon {
  font-size: 24px;
  line-height: 1;
}

.display-title {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-size);
  font-weight: 600;
  flex: 1;
}

.display-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-text {
  margin: 0;
  color: var(--text-color-2);
  font-size: calc(var(--font-size) - 2px);
  line-height: 1.6;
  text-align: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-color-3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error-color);
  transition: background-color 0.3s ease;
}

.status-indicator.active .status-dot {
  background: var(--success-color);
}

.status-text {
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simple-display {
    padding: 16px;
  }

  .display-header {
    gap: 8px;
  }

  .display-icon {
    font-size: 20px;
  }
}
</style>
