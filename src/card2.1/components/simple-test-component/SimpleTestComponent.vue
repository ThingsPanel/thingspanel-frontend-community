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
      {{ currentData.title || interactionState.content || config.title || '简单测试组件' }}
    </div>
    <div class="component-content">
      <p>{{ currentData.content || config.content || '这是一个简单的测试组件' }}</p>
      <button
        v-if="config.showButton"
        :class="`btn-${config.buttonType || 'primary'}`"
        class="test-button"
        @click="handleClick"
      >
        {{ currentData.buttonText || config.buttonText || '测试按钮' }}
      </button>

      <!-- 交互状态指示器 -->
      <div v-if="showInteractionIndicator" class="interaction-indicator">
        <span class="indicator-label">交互状态:</span>
        <span class="indicator-value">{{ interactionStatusText }}</span>
      </div>

      <!-- 🔥 测试按钮 - 用于测试属性变化触发交互 -->
      <div v-if="showInteractionIndicator" class="test-buttons">
        <div class="test-buttons-title">属性变化测试:</div>
        <div class="test-buttons-group">
          <n-button size="small" type="primary" @click="changeTitle('你好')">标题改为"你好"</n-button>
          <n-button size="small" type="info" @click="changeTitle('你好吗')">标题改为"你好吗"</n-button>
          <n-button size="small" type="warning" @click="resetTitle">重置标题</n-button>
        </div>
        <div class="current-title">当前标题: {{ currentData.title }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useInteractionCapable } from '@/card2.1/core/mixins/InteractionCapable'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'
import type { ComponentInteractionState } from '@/card2.1/core/interaction-types'
import {
  propertyExposureRegistry,
  createPropertyExposure,
  createProperty,
  CommonProperties
} from '@/card2.1/core/property-exposure'

interface Props extends InteractionProps {
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
  showInteractionIndicator: false,
  allowExternalControl: true,
  previewMode: true
})

const emit = defineEmits<InteractionEmits>()

// 响应式引用
const componentRef = ref<HTMLElement>()

// 🔥 使用交互能力混入
const { currentInteractionState, createEventHandler, interactionStatusText, triggerInteractionEvent } =
  useInteractionCapable(props, emit, {
    enableDebug: true
  })

// 兼容性：保持原有的interactionState接口
const interactionState = currentInteractionState

// 🔥 数据模拟器 - 提供动态内容
const simulatedData = ref({
  clickCount: 0,
  lastClickTime: null as Date | null,
  status: '准备就绪',
  messages: ['欢迎使用！', '点击按钮试试', '数据更新中...', '运行正常']
})

const currentData = ref({
  title: props.config.title || '简单测试组件',
  content: props.config.content || '这是一个简单的测试组件',
  buttonText: props.config.buttonText || '测试按钮'
})

let dataSimulatorTimer: number | null = null

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

// 交互状态文本计算（由混入提供，这里留作备用）
// const interactionStatusText 已由 useInteractionCapable 提供

// 🔥 启动数据模拟器
const startDataSimulator = () => {
  // 每5秒更新一次内容
  dataSimulatorTimer = window.setInterval(() => {
    // 随机选择消息
    const messageIndex = Math.floor(Math.random() * simulatedData.value.messages.length)
    currentData.value.content = simulatedData.value.messages[messageIndex]

    // 更新状态
    const statuses = ['运行中', '数据更新', '监听中', '正常工作']
    const statusIndex = Math.floor(Math.random() * statuses.length)
    simulatedData.value.status = statuses[statusIndex]

    console.log(`[SimpleTestComponent] 内容更新 - ${props.componentId}:`, {
      content: currentData.value.content,
      status: simulatedData.value.status,
      timestamp: new Date().toLocaleTimeString()
    })
  }, 5000)

  console.log(`[SimpleTestComponent] 数据模拟器已启动 - ${props.componentId}`)
}

// 🔥 停止数据模拟器
const stopDataSimulator = () => {
  if (dataSimulatorTimer) {
    clearInterval(dataSimulatorTimer)
    dataSimulatorTimer = null
    console.log(`[SimpleTestComponent] 数据模拟器已停止 - ${props.componentId}`)
  }
}

// 🔥 增强的事件处理函数
const handleClick = () => {
  // 更新点击计数
  simulatedData.value.clickCount++
  simulatedData.value.lastClickTime = new Date()

  // 更新按钮文字
  currentData.value.buttonText = `点击了${simulatedData.value.clickCount}次`

  // 调用原有的事件处理器
  createEventHandler('click')()

  console.log(`[SimpleTestComponent] 按钮被点击 - ${props.componentId}`, {
    clickCount: simulatedData.value.clickCount,
    lastClickTime: simulatedData.value.lastClickTime?.toLocaleTimeString()
  })
}

// 🔥 测试属性变化的方法
const changeTitle = (newTitle: string) => {
  const oldTitle = currentData.value.title
  console.log(`[INTERACTION-DEBUG] 属性变化: ${oldTitle} -> ${newTitle}`)

  // 更新当前数据中的标题
  currentData.value.title = newTitle

  // 🔥 检查交互配置
  console.log(`[INTERACTION-DEBUG] 交互配置:`, props.interactionConfigs)

  // 🔥 手动触发 dataChange 事件
  if (typeof triggerInteractionEvent === 'function') {
    const result = triggerInteractionEvent('dataChange', {
      property: 'title',
      oldValue: oldTitle,
      newValue: newTitle,
      source: 'component-internal-test'
    })
    console.log(`[INTERACTION-DEBUG] 触发结果:`, result)
  } else {
    console.warn('[INTERACTION-DEBUG] triggerInteractionEvent 不可用')
  }
}

const resetTitle = () => {
  changeTitle(props.config.title || '简单测试组件')
}

const handleMouseEnter = createEventHandler('hover')
const handleMouseLeave = () => {
  // 鼠标离开可以用于重置某些状态
  console.log(`[SimpleTestComponent] 鼠标离开 - ${props.componentId}`)
}
const handleFocus = createEventHandler('focus')
const handleBlur = createEventHandler('blur')

// 🔥 生命周期钩子 - 混入已处理大部分交互管理
// 这里只需要处理组件特定的初始化逻辑
onMounted(() => {
  console.log(`[SimpleTestComponent] 组件已挂载 - ${props.componentId}`)

  // 启动数据模拟器
  startDataSimulator()

  // 🔥 注册组件的可监听属性
  const propertyExposure = createPropertyExposure('simple-test-component', '简单测试组件', [
    // 内容相关属性
    { ...CommonProperties.title, defaultValue: props.config.title },
    { ...CommonProperties.content, defaultValue: props.config.content },

    // 样式相关属性
    { ...CommonProperties.backgroundColor, defaultValue: props.config.backgroundColor },
    { ...CommonProperties.textColor, defaultValue: props.config.textColor },
    { ...CommonProperties.visibility, defaultValue: 'visible' },

    // 组件特有属性
    createProperty('buttonText', '按钮文字', 'string', {
      description: '按钮显示的文字',
      group: '按钮',
      defaultValue: props.config.buttonText,
      example: '点击我'
    }),

    createProperty('buttonType', '按钮类型', 'string', {
      description: '按钮的样式类型',
      group: '按钮',
      defaultValue: props.config.buttonType,
      enum: [
        { label: '主要', value: 'primary' },
        { label: '次要', value: 'secondary' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '危险', value: 'danger' }
      ]
    }),

    createProperty('fontSize', '字体大小', 'number', {
      description: '文字的字体大小（像素）',
      group: '样式',
      defaultValue: props.config.fontSize,
      example: 16
    }),

    createProperty('showButton', '显示按钮', 'boolean', {
      description: '是否显示按钮',
      group: '按钮',
      defaultValue: props.config.showButton
    })
  ])

  propertyExposureRegistry.register(propertyExposure)

  // 混入已自动处理交互管理器的注册和监听
})

onUnmounted(() => {
  console.log(`[SimpleTestComponent] 组件已卸载 - ${props.componentId}`)
  // 停止数据模拟器
  stopDataSimulator()
  // 混入已自动处理清理工作
})
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

/* 🔥 测试按钮样式 */
.test-buttons {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
}

.test-buttons-title {
  font-size: 12px;
  font-weight: bold;
  color: #856404;
  margin-bottom: 8px;
}

.test-buttons-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.current-title {
  font-size: 11px;
  color: #6c757d;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-family: monospace;
}
</style>
