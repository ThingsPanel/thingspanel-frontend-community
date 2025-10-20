<template>
  <div class="interaction-preview">
    <!-- 预览控制区 -->
    <div class="preview-controls">
      <n-space justify="space-between" align="center">
        <div class="preview-info">
          <n-text strong>{{ t('interaction.preview.title') }}</n-text>
          <n-text depth="3" style="margin-left: 8px">
            {{ interactions.length }} {{ t('interaction.preview.interactionCount') }}
          </n-text>
        </div>

        <n-space size="small">
          <n-button size="small" :disabled="!hasActiveInteractions" @click="resetPreview">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            {{ t('interaction.reset') }}
          </n-button>

          <n-button size="small" type="primary" :disabled="!hasActiveInteractions" @click="runAllInteractions">
            <template #icon>
              <n-icon><PlayOutline /></n-icon>
            </template>
            {{ t('interaction.preview.runAll') }}
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 预览画布 -->
    <div class="preview-canvas">
      <div
        ref="previewElement"
        class="preview-element"
        :style="previewElementStyles"
        tabindex="0"
        @click="handleEvent('click')"
        @mouseenter="handleEvent('hover')"
        @mouseleave="handleEvent('hover', false)"
        @focus="handleEvent('focus')"
        @blur="handleEvent('blur')"
      >
        <div class="element-content">
          <n-icon class="element-icon" size="24">
            <FlashOutline />
          </n-icon>
          <div class="element-text">{{ currentContent }}</div>
          <div class="element-subtitle">{{ t('interaction.preview.testClickHere') }}</div>
        </div>
      </div>
    </div>

    <!-- 交互列表 -->
    <div class="interactions-list">
      <h4 class="list-title">{{ t('interaction.preview.configList') }}</h4>

      <div class="interactions-grid">
        <n-card
          v-for="(interaction, index) in interactions"
          :key="`preview-interaction-${index}`"
          size="small"
          class="interaction-item"
          :class="{
            disabled: !interaction.enabled,
            active: isInteractionActive(interaction)
          }"
        >
          <template #header>
            <div class="interaction-header">
              <n-space align="center">
                <n-tag :type="getEventTagType(interaction.event)" size="small" round>
                  {{ getEventDisplayName(interaction.event) }}
                </n-tag>
                <span class="interaction-name">
                  {{ interaction.name || t('interaction.template.configIndex', { index: index + 1 }) }}
                </span>
              </n-space>

              <n-space size="small">
                <n-switch
                  :value="interaction.enabled"
                  size="small"
                  @update:value="value => toggleInteraction(index, value)"
                />
                <n-button
                  size="tiny"
                  type="primary"
                  :disabled="!interaction.enabled"
                  @click="testSingleInteraction(interaction)"
                >
                  <template #icon>
                    <n-icon><PlayCircleOutline /></n-icon>
                  </template>
                  {{ t('interaction.preview.test') }}
                </n-button>
              </n-space>
            </div>
          </template>

          <!-- 响应动作列表 -->
          <div class="responses-preview">
            <div
              v-for="(response, responseIndex) in interaction.responses"
              :key="`response-${responseIndex}`"
              class="response-item"
            >
              <div class="response-info">
                <n-tag size="tiny" type="info">
                  {{ getActionDisplayName(response.action) }}
                </n-tag>
                <span class="response-value">
                  {{ formatResponseValue(response) }}
                </span>
              </div>

              <div v-if="response.duration || response.delay" class="response-timing">
                <n-text depth="3" style="font-size: 11px">
                  <span v-if="response.delay">
                    {{ t('interaction.template.delayLabel', { delay: response.delay }) }}
                  </span>
                  <span v-if="response.delay && response.duration">·</span>
                  <span v-if="response.duration">
                    {{ t('interaction.template.durationLabel', { duration: response.duration }) }}
                  </span>
                </n-text>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <!-- 执行日志 -->
    <div class="execution-log">
      <div class="log-header">
        <span class="log-title">{{ t('interaction.preview.executionLog') }}</span>
        <n-button size="tiny" quaternary :disabled="executionLog.length === 0" @click="clearLog">
          {{ t('interaction.clear') }}
        </n-button>
      </div>

      <div class="log-content">
        <div v-for="(log, index) in executionLog" :key="`log-${index}`" class="log-entry" :class="log.type">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>

        <div v-if="executionLog.length === 0" class="log-empty">
          <n-text depth="3">{{ t('interaction.preview.noExecutionRecords') }}</n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互预览组件
 * 提供实时的交互效果预览和测试功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpace, NText, NButton, NIcon, NCard, NTag, NSwitch, useMessage } from 'naive-ui'
import { PlayOutline, RefreshOutline, FlashOutline, PlayCircleOutline } from '@vicons/ionicons5'

import type {
  InteractionConfig,
  InteractionEventType,
  InteractionActionType,
  InteractionResponse
} from '@/card2.1/core2/interaction'
import { interactionManager } from '@/card2.1/core2/interaction'

interface Props {
  interactions: InteractionConfig[]
  componentId?: string
}

interface Emits {
  (e: 'close'): void
}

interface LogEntry {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()
const { t } = useI18n()

// 响应式状态
const previewElement = ref<HTMLElement>()
const currentContent = ref('')

// 初始化内容
onMounted(() => {
  currentContent.value = t('interaction.editor.previewElement')
})
const originalStyles = ref<any>({})
const activeInteractions = ref<Set<number>>(new Set())
const executionLog = ref<LogEntry[]>([])
const isHovering = ref(false)

// 计算属性
const hasActiveInteractions = computed(() => {
  return props.interactions.some(interaction => interaction.enabled)
})

const previewElementStyles = computed(() => {
  return {
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    ...originalStyles.value
  }
})

// 工具方法
const getEventTagType = (event: InteractionEventType) => {
  const typeMap = {
    click: 'success',
    hover: 'info',
    focus: 'warning',
    blur: 'default',
    custom: 'error'
  }
  return typeMap[event] || 'default'
}

const getEventDisplayName = (event: InteractionEventType) => {
  const nameMap = {
    click: t('interaction.events.click'),
    hover: t('interaction.events.hover'),
    focus: t('interaction.events.focus'),
    blur: t('interaction.events.blur'),
    custom: t('interaction.events.custom')
  }
  return nameMap[event] || event
}

const getActionDisplayName = (action: InteractionActionType) => {
  const nameMap = {
    changeBackgroundColor: t('interaction.actions.changeBackgroundColor'),
    changeTextColor: t('interaction.actions.changeTextColor'),
    changeBorderColor: t('interaction.actions.changeBorderColor'),
    changeSize: t('interaction.actions.changeSize'),
    changeOpacity: t('interaction.actions.changeOpacity'),
    changeTransform: t('interaction.actions.changeTransform'),
    changeVisibility: t('interaction.actions.changeVisibility'),
    changeContent: t('interaction.actions.changeContent'),
    triggerAnimation: t('interaction.actions.triggerAnimation'),
    custom: t('interaction.actions.custom')
  }
  return nameMap[action] || action
}

const formatResponseValue = (response: InteractionResponse) => {
  const { action, value } = response

  switch (action) {
    case 'changeBackgroundColor':
    case 'changeTextColor':
    case 'changeBorderColor':
      return value
    case 'changeSize':
      if (typeof value === 'object' && value) {
        return `${value.width || '?'}×${value.height || '?'}`
      }
      return String(value)
    case 'changeOpacity':
      return `${Math.round((value as number) * 100)}%`
    case 'changeTransform':
      return String(value)
    case 'changeVisibility':
      return value === 'visible' ? t('interaction.visibility.visible') : t('interaction.visibility.hidden')
    case 'changeContent':
      return String(value).substring(0, 20) + (String(value).length > 20 ? '...' : '')
    case 'triggerAnimation':
      return String(value)
    case 'custom':
      try {
        return JSON.stringify(value).substring(0, 30) + '...'
      } catch {
        return String(value)
      }
    default:
      return String(value)
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const isInteractionActive = (interaction: InteractionConfig) => {
  const index = props.interactions.indexOf(interaction)
  return activeInteractions.value.has(index)
}

// 事件处理
const handleEvent = (eventType: InteractionEventType, isActive = true) => {
  if (eventType === 'hover') {
    isHovering.value = isActive
    if (isActive) {
      executeInteractionsByEvent('hover')
    } else {
      // 悬停结束，可以添加恢复逻辑
      addLog('info', t('interaction.preview.hoverEnd'))
    }
  } else {
    executeInteractionsByEvent(eventType)
  }
}

const executeInteractionsByEvent = (eventType: InteractionEventType) => {
  const matchingInteractions = props.interactions
    .map((interaction, index) => ({ interaction, index }))
    .filter(({ interaction }) => interaction.event === eventType && interaction.enabled)
    .sort((a, b) => (b.interaction.priority || 0) - (a.interaction.priority || 0))

  if (matchingInteractions.length === 0) {
    addLog('warning', t('interaction.preview.noEnabledInteractions', { eventType: getEventDisplayName(eventType) }))
    return
  }

  addLog(
    'info',
    t('interaction.preview.triggerEvent', {
      eventType: getEventDisplayName(eventType),
      count: matchingInteractions.length
    })
  )

  matchingInteractions.forEach(({ interaction, index }) => {
    executeInteraction(interaction, index)
  })
}

const executeInteraction = (interaction: InteractionConfig, index: number) => {
  activeInteractions.value.add(index)

  addLog(
    'success',
    t('interaction.preview.startExecution', {
      name: interaction.name || t('interaction.template.configIndex', { index: index + 1 })
    })
  )

  interaction.responses.forEach((response, responseIndex) => {
    const delay = response.delay || 0

    setTimeout(() => {
      try {
        executeResponse(response)
        addLog(
          'success',
          t('interaction.preview.executeAction', {
            action: getActionDisplayName(response.action),
            value: formatResponseValue(response)
          })
        )
      } catch (error) {
        addLog('error', t('interaction.preview.actionFailed', { action: getActionDisplayName(response.action), error }))
      }
    }, delay)
  })

  // 标记交互完成
  setTimeout(
    () => {
      activeInteractions.value.delete(index)
    },
    Math.max(...interaction.responses.map(r => (r.delay || 0) + (r.duration || 300)))
  )
}

const executeResponse = (response: InteractionResponse) => {
  if (!previewElement.value) return

  const element = previewElement.value
  const { action, value, duration = 300, easing = 'ease' } = response

  // 设置过渡效果
  element.style.transition = `all ${duration}ms ${easing}`

  switch (action) {
    case 'changeBackgroundColor':
      element.style.backgroundColor = value
      break
    case 'changeTextColor':
      element.style.color = value
      break
    case 'changeBorderColor':
      element.style.borderColor = value
      break
    case 'changeSize':
      if (typeof value === 'object' && value) {
        if (value.width) element.style.width = `${value.width}px`
        if (value.height) element.style.height = `${value.height}px`
      }
      break
    case 'changeOpacity':
      element.style.opacity = String(value)
      break
    case 'changeTransform':
      element.style.transform = value
      break
    case 'changeVisibility':
      element.style.visibility = value
      break
    case 'changeContent':
      currentContent.value = String(value)
      break
    case 'triggerAnimation':
      // 移除之前的动画
      element.style.animation = ''
      // 强制重排
      element.offsetHeight
      // 应用新动画
      element.style.animation = `${value} ${duration}ms ${easing}`
      break
    case 'custom':
      // 自定义动作，尝试应用为样式对象
      if (typeof value === 'object' && value) {
        Object.assign(element.style, value)
      }
      break
  }
}

const testSingleInteraction = (interaction: InteractionConfig) => {
  const index = props.interactions.indexOf(interaction)
  executeInteraction(interaction, index)
}

const runAllInteractions = () => {
  addLog('info', t('interaction.preview.startExecutingAll'))

  // 模拟触发所有事件类型
  const eventTypes: InteractionEventType[] = ['click', 'hover', 'focus', 'blur', 'custom']

  eventTypes.forEach(eventType => {
    const hasEvent = props.interactions.some(i => i.event === eventType && i.enabled)
    if (hasEvent) {
      executeInteractionsByEvent(eventType)
    }
  })
}

const resetPreview = () => {
  if (!previewElement.value) return

  const element = previewElement.value

  // 重置所有样式
  element.style.cssText = ''
  element.className = 'preview-element'
  currentContent.value = t('interaction.editor.previewElement')

  // 清空活动状态
  activeInteractions.value.clear()

  addLog('info', t('interaction.messages.previewReset'))
  message.success(t('interaction.messages.previewReset'))
}

const toggleInteraction = (index: number, enabled: boolean) => {
  props.interactions[index].enabled = enabled
  const status = enabled ? t('interaction.events.enabled') : t('interaction.events.disabled')
  const name = props.interactions[index].name || t('interaction.template.configIndex', { index: index + 1 })
  addLog('info', t('interaction.preview.interactionToggled', { status, name }))
}

const addLog = (type: LogEntry['type'], message: string) => {
  executionLog.value.unshift({
    type,
    message,
    timestamp: new Date()
  })

  // 限制日志数量
  if (executionLog.value.length > 100) {
    executionLog.value = executionLog.value.slice(0, 100)
  }
}

const clearLog = () => {
  executionLog.value = []
  addLog('info', t('interaction.messages.logCleared'))
}

// 生命周期
onMounted(() => {
  if (previewElement.value) {
    // 保存原始样式
    const computedStyles = window.getComputedStyle(previewElement.value)
    originalStyles.value = {
      backgroundColor: computedStyles.backgroundColor,
      color: computedStyles.color,
      borderColor: computedStyles.borderColor,
      opacity: computedStyles.opacity,
      transform: computedStyles.transform,
      visibility: computedStyles.visibility
    }
  }

  addLog('info', t('interaction.preview.previewStarted'))
})

onUnmounted(() => {
  activeInteractions.value.clear()
})
</script>

<style scoped>
.interaction-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 600px;
}

.preview-controls {
  padding: 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.preview-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 32px;
  background: var(--body-color);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  position: relative;
}

.preview-element {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 120px;
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.element-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.element-icon {
  color: var(--primary-color);
}

.element-text {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
}

.element-subtitle {
  font-size: 12px;
  color: var(--text-color-3);
}

.interactions-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.interactions-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.interaction-item {
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.interaction-item.active {
  border-color: var(--primary-color);
  background: var(--primary-color-suppl);
  box-shadow: 0 2px 8px var(--primary-color-hover);
}

.interaction-item.disabled {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.interaction-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: 13px;
}

.responses-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-item {
  padding: 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.response-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.response-value {
  font-size: 12px;
  color: var(--text-color-2);
  font-family: Monaco, Consolas, monospace;
}

.response-timing {
  text-align: right;
}

.execution-log {
  display: flex;
  flex-direction: column;
  height: 150px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
}

.log-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: var(--body-color);
  font-family: Monaco, Consolas, monospace;
  font-size: 11px;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  word-break: break-all;
}

.log-entry.info {
  color: var(--text-color-2);
}

.log-entry.success {
  color: var(--success-color);
}

.log-entry.warning {
  color: var(--warning-color);
}

.log-entry.error {
  color: var(--error-color);
}

.log-time {
  flex-shrink: 0;
  width: 60px;
  color: var(--text-color-3);
}

.log-message {
  flex: 1;
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .interaction-preview {
    height: auto;
  }

  .interactions-grid {
    grid-template-columns: 1fr;
  }

  .preview-canvas {
    min-height: 150px;
    padding: 20px;
  }

  .preview-element {
    width: 150px;
    height: 100px;
  }
}

/* 滚动条样式 */
.interactions-grid::-webkit-scrollbar,
.log-content::-webkit-scrollbar {
  width: 6px;
}

.interactions-grid::-webkit-scrollbar-track,
.log-content::-webkit-scrollbar-track {
  background: var(--body-color);
  border-radius: 3px;
}

.interactions-grid::-webkit-scrollbar-thumb,
.log-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.interactions-grid::-webkit-scrollbar-thumb:hover,
.log-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 动画效果 */
.interaction-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 预览元素的交互状态 */
.preview-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.preview-element:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.preview-element:active {
  transform: translateY(0);
}
</style>
