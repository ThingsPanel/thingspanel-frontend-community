<script setup lang="ts">
// Canvas渲染器视图组件 - 纯粹的渲染器，不包含工具栏等UI
// Canvas renderer view component - Pure renderer without toolbars or other UI

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { CanvasRenderer } from './CanvasRenderer'
import { CanvasAdapter, type ExternalPanelData } from '../adapters/CanvasAdapter'
import type { CanvasItem, CanvasConfig } from './types'
import type { BaseItem, RenderMode } from '../base/types'

// Props定义 - 只包含渲染必需的属性
interface Props {
  /** 项目数据 */
  items?: BaseItem[]
  /** 外部数据 */
  externalData?: ExternalPanelData
  /** 渲染模式 */
  mode?: RenderMode
  /** 选中的项目ID */
  selectedIds?: string[]
  /** Canvas配置 */
  config?: Partial<CanvasConfig>
  /** 是否可编辑 */
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  selectedIds: () => [],
  mode: 'edit',
  config: () => ({}),
  editable: true
})

// Events - 只包含渲染器核心事件
interface Events {
  'item-select': [ids: string[]]
  'item-update': [id: string, updates: any]
  'item-add': [item: BaseItem]
  'item-remove': [id: string]
  'ready': [renderer: CanvasRenderer]
  'error': [error: string]
}

const emit = defineEmits<Events>()

// 响应式状态
const containerRef = ref<HTMLElement>()
const rendererInstance = ref<CanvasRenderer>()
const isReady = ref(false)
const error = ref<string>()

// 计算属性
const canvasItems = computed(() => {
  if (props.externalData) {
    // 转换外部数据 - 使用静态方法
    return CanvasAdapter.convertPanelToCanvasItems(props.externalData)
  }
  return props.items || []
})

const rendererConfig = computed((): CanvasConfig => ({
  width: 1200,
  height: 800,
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 5,
  backgroundColor: '#ffffff',
  grid: {
    enabled: true,
    size: 20,
    snap: props.editable,
    color: '#e5e7eb',
    opacity: 0.5,
    visible: true
  },
  selectionBox: props.editable,
  multiSelect: props.editable,
  drag: {
    enabled: props.editable,
    threshold: 5,
    containment: true
  },
  resize: {
    enabled: props.editable,
    handleSize: 8,
    aspectRatio: false
  },
  ...props.config
}))

// 方法
const initializeRenderer = async () => {
  if (!containerRef.value) {
    console.warn('Container not ready')
    return
  }

  try {
    error.value = undefined
    
    // 创建渲染器实例
    rendererInstance.value = new CanvasRenderer(containerRef.value, rendererConfig.value)
    
    // 设置事件监听
    setupEventListeners()
    
    // 初始化
    rendererInstance.value.init()
    
    // 加载数据
    if (canvasItems.value.length > 0) {
      canvasItems.value.forEach(item => {
        rendererInstance.value?.addItem(item)
      })
    }
    
    isReady.value = true
    emit('ready', rendererInstance.value)
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    error.value = errorMessage
    emit('error', errorMessage)
    console.error('Failed to initialize Canvas renderer:', err)
  }
}

const setupEventListeners = () => {
  if (!rendererInstance.value) return
  
  rendererInstance.value.on('item-select', (ids: string[]) => {
    emit('item-select', ids)
  })
  
  rendererInstance.value.on('item-update', (id: string, updates: any) => {
    emit('item-update', id, updates)
  })
  
  rendererInstance.value.on('item-add', (item: BaseItem) => {
    emit('item-add', item)
  })
  
  rendererInstance.value.on('item-remove', (id: string) => {
    emit('item-remove', id)
  })
}

const destroyRenderer = () => {
  if (rendererInstance.value) {
    rendererInstance.value.destroy()
    rendererInstance.value = undefined
  }
  isReady.value = false
}

// 暴露方法给父组件
defineExpose({
  renderer: rendererInstance,
  isReady,
  refresh: () => rendererInstance.value?.refresh(),
  addItem: (item: BaseItem) => rendererInstance.value?.addItem(item),
  removeItem: (id: string) => rendererInstance.value?.removeItem(id),
  updateItem: (id: string, updates: any) => rendererInstance.value?.updateItem(id, updates),
  selectItems: (ids: string[]) => rendererInstance.value?.selectItems(ids),
  clearSelection: () => rendererInstance.value?.clearSelection(),
  setMode: (mode: RenderMode) => rendererInstance.value?.setMode(mode)
})

// 生命周期
onMounted(async () => {
  await nextTick()
  initializeRenderer()
})

onUnmounted(() => {
  destroyRenderer()
})

// 监听器
watch(() => props.items, () => {
  if (isReady.value && rendererInstance.value) {
    // 重新加载项目
    rendererInstance.value.clearAll()
    canvasItems.value.forEach(item => {
      rendererInstance.value?.addItem(item)
    })
  }
}, { deep: true })

watch(() => props.mode, (newMode) => {
  if (rendererInstance.value && newMode) {
    rendererInstance.value.setMode(newMode)
  }
})

watch(() => props.selectedIds, (newIds) => {
  if (rendererInstance.value && newIds) {
    rendererInstance.value.selectItems(newIds)
  }
}, { deep: true })

watch(() => props.config, () => {
  // 配置变化时重新初始化
  destroyRenderer()
  nextTick(() => {
    initializeRenderer()
  })
}, { deep: true })
</script>

<template>
  <div class="canvas-renderer-view w-full h-full relative">
    <!-- 错误提示 -->
    <div 
      v-if="error" 
      class="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/10 z-10"
    >
      <div class="text-center p-6">
        <div class="text-red-500 text-4xl mb-2">⚠️</div>
        <h3 class="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
          渲染器错误
        </h3>
        <p class="text-sm text-red-700 dark:text-red-300">
          {{ error }}
        </p>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div 
      v-else-if="!isReady" 
      class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900/10"
    >
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">初始化Canvas渲染器...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-else-if="isReady && canvasItems.length === 0" 
      class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900/10"
    >
      <div class="text-center p-8 max-w-md">
        <div class="text-gray-400 text-6xl mb-4">🎨</div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          空白画布
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          画布渲染器已准备就绪，但还没有添加任何组件。您可以开始在画布上放置组件来创建您的自定义布局。
        </p>
        <div class="text-xs text-gray-500 dark:text-gray-500">
          {{ props.externalData ? '外部数据为空或格式不正确' : '没有提供项目数据' }}
        </div>
      </div>
    </div>
    
    <!-- Canvas容器 -->
    <div 
      ref="containerRef" 
      class="canvas-container w-full h-full"
      :class="{
        'pointer-events-none': mode === 'preview',
        'cursor-default': !editable,
        'opacity-0': !isReady || canvasItems.length === 0
      }"
    >
      <!-- Canvas元素将由渲染器动态创建 -->
    </div>
  </div>
</template>

<style scoped>
.canvas-renderer-view {
  min-height: 400px;
  background: #f8f9fa;
}

.canvas-container {
  overflow: hidden;
  position: relative;
}

/* 预览模式样式 */
.canvas-renderer-view[data-mode="preview"] .canvas-container {
  cursor: default;
}

/* 深色模式 */
.dark .canvas-renderer-view {
  background: #1f2937;
}
</style>