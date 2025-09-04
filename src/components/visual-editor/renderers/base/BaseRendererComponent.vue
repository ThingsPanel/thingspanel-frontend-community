<!--
  基础渲染器 Vue 组件
  为 Vue 组件形式的渲染器提供统一的基础结构
-->
<script setup lang="ts" generic="TConfig extends Record<string, any> = Record<string, any>">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useVisualEditor } from '@/store/modules/visual-editor' // 1. 导入统一架构

// 基础 Props 接口
interface BaseRendererProps {
  readonly?: boolean
  config?: TConfig
}

// 基础 Emits 接口
interface BaseRendererEmits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'node-update', nodeId: string, updates: any): void
  (e: 'canvas-click', event?: MouseEvent): void
  (e: 'state-change', state: string): void
}

// Props 定义
const props = withDefaults(defineProps<BaseRendererProps>(), {
  readonly: false,
  config: () => ({}) as TConfig
})

// Emits 定义
const emit = defineEmits<BaseRendererEmits>()

// 2. 🔥 使用新的统一架构
const unifiedEditor = useVisualEditor()

const addWidget = async (componentType: string, position?: { x: number; y: number }) => {
  try {
    // 🔥 确保系统已初始化
    await unifiedEditor.initialize()

    // 创建新节点
    const newNode = {
      id: `${componentType}_${Date.now()}`,
      type: componentType,
      position: position || { x: 100, y: 100 },
      data: {
        componentType,
        title: componentType
      }
    }

    await unifiedEditor.addNode(newNode)
  } catch (error) {
    // 重新抛出错误让上层处理
    throw error
  }
}

// 渲染器状态
const rendererState = ref<'idle' | 'initializing' | 'ready' | 'rendering' | 'error' | 'destroyed'>('idle')
const rendererError = ref<Error | null>(null)
const isInitialized = ref(false)

// 主题支持
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.darkMode)

// 渲染器容器
const containerRef = ref<HTMLElement>()

// 计算属性
const isReady = computed(() => rendererState.value === 'ready')
const hasError = computed(() => rendererState.value === 'error')
const isReadonly = computed(() => props.readonly)

// 状态管理
const setState = (newState: typeof rendererState.value) => {
  if (rendererState.value !== newState) {
    const oldState = rendererState.value
    rendererState.value = newState
    emit('state-change', newState)
  }
}

// 错误处理
const handleError = (error: Error) => {
  rendererError.value = error
  setState('error')
  emit('error', error)
}

// 3. 实现统一的 handleDrop 逻辑
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (isReadonly.value) return

  const jsonData = event.dataTransfer?.getData('application/json')
  if (jsonData && containerRef.value) {
    try {
      const data = JSON.parse(jsonData)
      const { type, source } = data

      if (!type) {
        throw new Error('Dropped data is missing "type" property.')
      }

      const rect = containerRef.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 调用 addWidget 添加新组件
      addWidget(type, { x, y }).catch(handleError)
    } catch (e) {
      handleError(new Error('Failed to parse dropped data.'))
    }
    return
  }

  // Fallback for plain text data
  const widgetType = event.dataTransfer?.getData('text/plain')
  if (widgetType && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    addWidget(widgetType, { x, y }).catch(handleError)
  }
}

// 初始化方法
const initialize = async () => {
  if (isInitialized.value) return

  try {
    setState('initializing')

    if (!containerRef.value) {
      throw new Error('Renderer container not found')
    }

    await onRendererInit()

    setState('ready')
    isInitialized.value = true
    emit('ready')
  } catch (error) {
    handleError(error as Error)
  }
}

// 渲染方法
const render = async () => {
  if (!isReady.value) return

  try {
    setState('rendering')
    await onRendererRender()
    setState('ready')
  } catch (error) {
    handleError(error as Error)
  }
}

// 更新方法
const update = async (changes: Partial<TConfig>) => {
  try {
    await onRendererUpdate(changes)
  } catch (error) {
    handleError(error as Error)
  }
}

// 销毁方法
const destroy = async () => {
  try {
    await onRendererDestroy()
    setState('destroyed')
    isInitialized.value = false
  } catch (error) {}
}

// 事件处理方法
const handleNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
  onNodeSelected(nodeId)
}

const handleNodeUpdate = (nodeId: string, updates: any) => {
  emit('node-update', nodeId, updates)
  onNodeUpdated(nodeId, updates)
}

const handleCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
  onCanvasClicked(event)
}

// 生命周期钩子 - 子类需要实现这些方法
const onRendererInit = async (): Promise<void> => {}
const onRendererRender = async (): Promise<void> => {}
const onRendererUpdate = async (changes: Partial<TConfig>): Promise<void> => {}
const onRendererDestroy = async (): Promise<void> => {}

// 事件钩子 - 子类可以重写
const onNodeSelected = (nodeId: string): void => {}
const onNodeUpdated = (nodeId: string, updates: any): void => {}
const onCanvasClicked = (event?: MouseEvent): void => {}

// 监听配置变化
watch(
  () => props.config,
  async (newConfig, oldConfig) => {
    if (isReady.value && JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
      await update(newConfig)
    }
  },
  { deep: true }
)

// 监听主题变化
watch(isDark, async () => {
  if (isReady.value) {
    await onThemeChange(isDark.value)
  }
})

// 主题变化钩子
const onThemeChange = async (isDark: boolean): Promise<void> => {}

// 组件生命周期
onMounted(async () => {
  await initialize()
})

onUnmounted(async () => {
  await destroy()
})

// 暴露给父组件的方法和属性
defineExpose({
  isReady,
  hasError,
  rendererState,
  rendererError,
  initialize,
  render,
  update,
  destroy,
  handleNodeSelect,
  handleNodeUpdate,
  handleCanvasClick,
  containerRef
})
</script>

<template>
  <div
    ref="containerRef"
    class="base-renderer"
    :class="{
      'renderer-ready': isReady,
      'renderer-error': hasError,
      'renderer-readonly': isReadonly,
      'renderer-dark': isDark
    }"
    @click="handleCanvasClick"
    @drop="handleDrop"
    @dragover.prevent
  >
    <!-- 加载状态 -->
    <div v-if="rendererState === 'initializing'" class="renderer-loading">
      <n-spin size="large">
        <template #description>初始化渲染器...</template>
      </n-spin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="renderer-error-state">
      <n-result status="error" title="渲染器错误" :description="rendererError?.message">
        <template #footer>
          <n-button @click="initialize">重试</n-button>
        </template>
      </n-result>
    </div>

    <!-- 渲染器内容插槽 -->
    <slot v-else-if="isReady" />

    <!-- 默认状态 -->
    <div v-else class="renderer-idle">
      <n-empty description="渲染器未准备就绪" />
    </div>
  </div>
</template>

<style scoped>
.base-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  /* 🔥 核心修复：基础渲染器容器设置最小高度 */
  min-height: 600px;
  overflow: hidden;
  background-color: var(--n-body-color);
  transition: background-color 0.3s var(--n-bezier);
}

.base-renderer.renderer-readonly {
  cursor: default;
  user-select: none;
}

.renderer-loading,
.renderer-error-state,
.renderer-idle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.renderer-error-state {
  background-color: var(--n-error-color-suppl);
  border-radius: var(--n-border-radius);
  margin: 16px;
}

/* 主题适配 */
.renderer-dark {
  --renderer-bg: #1a1a1a;
  --renderer-border: #404040;
  --renderer-text: #ffffff;
}

.base-renderer:not(.renderer-dark) {
  --renderer-bg: #ffffff;
  --renderer-border: #e0e0e0;
  --renderer-text: #000000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .base-renderer {
    min-height: 300px;
  }

  .renderer-loading,
  .renderer-error-state,
  .renderer-idle {
    min-height: 150px;
  }
}
</style>
