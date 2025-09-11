<script setup lang="ts">
/**
 * 轮询控制器组件
 * 支持全局轮询控制和未来的单卡片轮询控制
 */

import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
import { $t } from '@/locales'

interface Props {
  /** 控制模式：global-全局控制, card-卡片控制 */
  mode?: 'global' | 'card'
  /** 卡片模式下的组件ID */
  componentId?: string
  /** 控制器位置 */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** 是否显示统计信息 */
  showStats?: boolean
  /** 低调模式：仅显示小图标，悬停显示完整按钮 */
  lowProfile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'global',
  position: 'bottom-right',
  showStats: true,
  lowProfile: true
})

const emit = defineEmits<{
  'polling-toggle': [enabled: boolean]
  'polling-enabled': []
  'polling-disabled': []
}>()

const message = useMessage()
const pollingManager = useGlobalPollingManager()

// 全局轮询状态
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// 根据模式计算当前状态
const isPollingEnabled = computed(() => {
  if (props.mode === 'global') {
    return globalPollingEnabled.value
  } else if (props.mode === 'card' && props.componentId) {
    return pollingManager.isComponentPollingActive(props.componentId)
  }
  return false
})

// 统计信息
const statsText = computed(() => {
  if (props.mode === 'global') {
    return `${pollingStats.value.activeTasks}/${pollingStats.value.totalTasks}`
  } else if (props.mode === 'card' && props.componentId) {
    const componentStats = pollingManager.getComponentStatistics(props.componentId)
    return `${componentStats.activeTasks}/${componentStats.totalTasks}`
  }
  return '0/0'
})

// 按钮文字
const buttonText = computed(() => {
  if (props.mode === 'global') {
    return isPollingEnabled.value ? $t('visualEditor.pollingPause') : $t('visualEditor.pollingStart')
  } else {
    return isPollingEnabled.value ? '暂停' : '启动'
  }
})

// 切换轮询状态
const togglePolling = () => {
  if (props.mode === 'global') {
    handleGlobalPollingToggle()
  } else if (props.mode === 'card' && props.componentId) {
    handleCardPollingToggle()
  }
}

// 全局轮询切换
const handleGlobalPollingToggle = () => {
  const wasEnabled = globalPollingEnabled.value

  if (!wasEnabled) {
    pollingManager.enableGlobalPolling()
    message.success($t('visualEditor.pollingEnabled'))
    emit('polling-enabled')
  } else {
    pollingManager.disableGlobalPolling()
    message.info($t('visualEditor.pollingDisabled'))
    emit('polling-disabled')
  }

  emit('polling-toggle', !wasEnabled)
}

// 卡片轮询切换
const handleCardPollingToggle = () => {
  if (!props.componentId) return

  const wasEnabled = pollingManager.isComponentPollingActive(props.componentId)

  if (wasEnabled) {
    // 停止该组件的所有轮询任务
    const success = pollingManager.stopComponentTasks(props.componentId)
    if (success) {
      message.info(`组件轮询已暂停`)
      emit('polling-disabled')
      emit('polling-toggle', false)
    }
  } else {
    // 启动该组件的所有轮询任务
    const success = pollingManager.startComponentTasks(props.componentId)
    if (success) {
      message.success(`组件轮询已启动`)
      emit('polling-enabled')
      emit('polling-toggle', true)
    }
  }
}

// 位置样式类
const positionClass = computed(() => {
  switch (props.position) {
    case 'bottom-right':
      return 'bottom-right'
    case 'bottom-left':
      return 'bottom-left'
    case 'top-right':
      return 'top-right'
    case 'top-left':
      return 'top-left'
    default:
      return 'bottom-right'
  }
})
</script>

<template>
  <div
    class="polling-controller"
    :class="[positionClass, { 'low-profile': lowProfile, 'polling-active': isPollingEnabled }]"
  >
    <!-- 低调模式：悬停前显示的小图标 -->
    <div v-if="lowProfile" class="polling-indicator">
      <div class="indicator-dot" :class="{ active: isPollingEnabled }"></div>
    </div>

    <!-- 完整按钮：低调模式下悬停显示，普通模式下直接显示 -->
    <div class="polling-button-container" :class="{ 'hover-show': lowProfile }">
      <n-button
        :type="isPollingEnabled ? 'success' : 'default'"
        :ghost="!isPollingEnabled"
        size="small"
        class="polling-btn"
        @click="togglePolling"
      >
        <template #icon>
          <span class="polling-icon">{{ isPollingEnabled ? '⏸️' : '▶️' }}</span>
        </template>
        {{ buttonText }}
        <span v-if="showStats" class="polling-stats">({{ statsText }})</span>
      </n-button>
    </div>
  </div>
</template>

<style scoped>
/* 主容器 */
.polling-controller {
  position: fixed;
  z-index: 999;
  transition: all 0.3s ease;
}

/* 位置样式 */
.polling-controller.bottom-right {
  bottom: 20px;
  right: 20px;
}

.polling-controller.bottom-left {
  bottom: 20px;
  left: 20px;
}

.polling-controller.top-right {
  top: 20px;
  right: 20px;
}

.polling-controller.top-left {
  top: 20px;
  left: 20px;
}

/* 低调模式样式 */
.polling-controller.low-profile {
  width: 16px;
  height: 16px;
  overflow: visible;
}

.polling-controller.low-profile:hover {
  width: auto;
  height: auto;
}

/* 小指示器 */
.polling-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.6);
  transition: all 0.3s ease;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
}

.indicator-dot.active {
  background: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  animation: polling-pulse-dot 2s infinite ease-in-out;
}

/* 小点的脉冲动画 */
@keyframes polling-pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5);
  }
}

/* 完整按钮容器 */
.polling-button-container {
  transition: all 0.3s ease;
}

.polling-button-container.hover-show {
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  pointer-events: none;
}

.polling-controller:hover .polling-button-container.hover-show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: all;
}

.polling-controller:hover .polling-indicator {
  opacity: 0;
  transform: scale(0.8);
}

/* 按钮样式 */
.polling-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  white-space: nowrap;
}

.polling-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.polling-icon {
  font-size: 16px;
  line-height: 1;
}

.polling-stats {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 400;
  margin-left: 4px;
  color: inherit;
}

/* 成功状态的轮询按钮动画 */
:deep(.polling-btn.n-button--success-type) {
  animation: polling-pulse 2s infinite ease-in-out;
}

@keyframes polling-pulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(24, 160, 88, 0.3);
  }
  50% {
    box-shadow:
      0 4px 16px rgba(24, 160, 88, 0.5),
      0 0 20px rgba(24, 160, 88, 0.2);
  }
}

/* 暗色主题适配 */
.dark .polling-btn {
  background-color: rgba(42, 42, 42, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.dark :deep(.polling-btn.n-button--success-type) {
  background-color: rgba(16, 185, 129, 0.9) !important;
}

.dark .indicator-dot {
  background: rgba(156, 163, 175, 0.6);
  box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
}

.dark .indicator-dot.active {
  background: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .polling-controller.bottom-right {
    bottom: 10px;
    right: 10px;
  }

  .polling-controller.bottom-left {
    bottom: 10px;
    left: 10px;
  }

  .polling-btn {
    padding: 6px 12px !important;
    font-size: 12px;
  }
}
</style>
