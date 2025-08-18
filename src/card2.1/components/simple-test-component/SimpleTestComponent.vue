<template>
  <div
    ref="componentRef"
    class="simple-test-component"
    :style="finalComponentStyles"
    tabindex="0"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <div v-if="config.showTitle" class="component-title">
      {{ interactionState.content || config.title || '简单测试组件' }}
    </div>
    <div class="component-content">
      <p>{{ config.content || '这是一个简单的测试组件' }}</p>
      <button v-if="config.showButton" :class="`btn-${config.buttonType || 'primary'}`" class="test-button">
        {{ config.buttonText || '测试按钮' }}
      </button>

      <!-- 交互状态指示器 -->
      <div v-if="showInteractionIndicator" class="interaction-indicator">
        <span class="indicator-label">交互状态:</span>
        <span class="indicator-value">{{ interactionStatusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { ComponentInteractionState } from '@/card2.1/core/interaction-types'

interface Props {
  config?: {
    title?: string
    showTitle?: boolean
    content?: string
    backgroundColor?: string
    textColor?: string
    showButton?: boolean
    buttonText?: string
    buttonType?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    fontSize?: number
    padding?: number
    borderRadius?: number
  }
  // 新增：支持组件ID用于交互系统
  componentId?: string
  // 新增：是否显示交互状态指示器
  showInteractionIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '简单测试组件',
    showTitle: true,
    content: '这是一个简单的测试组件',
    backgroundColor: '#f0f8ff',
    textColor: '#333333',
    showButton: true,
    buttonText: '测试按钮',
    buttonType: 'primary',
    fontSize: 14,
    padding: 16,
    borderRadius: 8
  }),
  componentId: '',
  showInteractionIndicator: false
})

// 响应式引用
const componentRef = ref<HTMLElement>()
const interactionState = ref<ComponentInteractionState>({})

// 计算基础组件样式
const componentStyles = computed(() => ({
  backgroundColor: props.config.backgroundColor || '#f0f8ff',
  color: props.config.textColor || '#333333',
  fontSize: `${props.config.fontSize || 14}px`,
  padding: `${props.config.padding || 16}px`,
  borderRadius: `${props.config.borderRadius || 8}px`
}))

// 计算最终样式（合并交互状态）
const finalComponentStyles = computed(() => {
  const baseStyles = componentStyles.value
  const state = interactionState.value

  return {
    ...baseStyles,
    backgroundColor: state.backgroundColor || baseStyles.backgroundColor,
    color: state.textColor || baseStyles.color,
    borderColor: state.borderColor,
    width: state.width ? `${state.width}px` : undefined,
    height: state.height ? `${state.height}px` : undefined,
    opacity: state.opacity !== undefined ? state.opacity : 1,
    transform: state.transform || 'none',
    visibility: state.visibility || 'visible',
    transition: 'all 0.3s ease',
    // 动画状态
    ...(state.isAnimating && {
      transform: `${state.transform || ''} scale(1.1)`,
      boxShadow: '0 4px 20px rgba(0, 123, 255, 0.3)'
    })
  }
})

// 交互状态文本
const interactionStatusText = computed(() => {
  const state = interactionState.value
  const statusParts = []

  if (state.backgroundColor) statusParts.push('背景色已修改')
  if (state.textColor) statusParts.push('文字色已修改')
  if (state.borderColor) statusParts.push('边框色已修改')
  if (state.opacity !== undefined && state.opacity !== 1) statusParts.push(`透明度${state.opacity}`)
  if (state.isAnimating) statusParts.push('动画中')

  return statusParts.length > 0 ? statusParts.join(', ') : '默认状态'
})

// 事件处理函数
const handleClick = () => {
  if (props.componentId) {
    console.log(`[SimpleTestComponent] 点击事件 - ${props.componentId}`)
    interactionManager.triggerEvent(props.componentId, 'click')
  }
}

const handleMouseEnter = () => {
  if (props.componentId) {
    console.log(`[SimpleTestComponent] 鼠标进入 - ${props.componentId}`)
    interactionManager.triggerEvent(props.componentId, 'hover')
  }
}

const handleMouseLeave = () => {
  if (props.componentId) {
    console.log(`[SimpleTestComponent] 鼠标离开 - ${props.componentId}`)
    // 可以触发自定义事件或重置某些状态
  }
}

const handleFocus = () => {
  if (props.componentId) {
    console.log(`[SimpleTestComponent] 获得焦点 - ${props.componentId}`)
    interactionManager.triggerEvent(props.componentId, 'focus')
  }
}

const handleBlur = () => {
  if (props.componentId) {
    console.log(`[SimpleTestComponent] 失去焦点 - ${props.componentId}`)
    interactionManager.triggerEvent(props.componentId, 'blur')
  }
}

// 监听交互状态变化
const updateInteractionState = () => {
  if (props.componentId) {
    const state = interactionManager.getComponentState(props.componentId) || {}
    interactionState.value = state
  }
}

// 生命周期钩子
onMounted(() => {
  if (props.componentId) {
    // 注册默认交互配置（如果没有其他配置的话）
    if (!interactionManager.hasComponent(props.componentId)) {
      console.log(`[SimpleTestComponent] 注册默认交互配置 - ${props.componentId}`)
      interactionManager.registerComponent(props.componentId, [
        {
          id: `${props.componentId}-click-demo`,
          name: '点击演示',
          event: 'click',
          responses: [
            {
              action: 'changeBackgroundColor',
              value: '#ffeb3b',
              duration: 300
            }
          ],
          enabled: true,
          priority: 1
        },
        {
          id: `${props.componentId}-hover-demo`,
          name: '悬停演示',
          event: 'hover',
          responses: [
            {
              action: 'changeTextColor',
              value: '#e91e63',
              duration: 200
            }
          ],
          enabled: true,
          priority: 1
        }
      ])
    }

    // 添加事件监听器来更新本地状态
    interactionManager.addEventListener(props.componentId, updateInteractionState)

    // 初始化状态
    updateInteractionState()
  }
})

onUnmounted(() => {
  if (props.componentId) {
    interactionManager.removeEventListener(props.componentId, updateInteractionState)
  }
})

// 监听组件ID变化
watch(
  () => props.componentId,
  (newId, oldId) => {
    if (oldId) {
      interactionManager.removeEventListener(oldId, updateInteractionState)
    }
    if (newId) {
      interactionManager.addEventListener(newId, updateInteractionState)
      updateInteractionState()
    }
  }
)
</script>

<style scoped>
.simple-test-component {
  border: 2px solid #007bff;
  background: #f0f8ff;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.component-title {
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.component-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  max-width: 120px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.test-button:hover {
  opacity: 0.8;
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
.simple-test-component:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.simple-test-component:hover {
  cursor: pointer;
}
</style>
