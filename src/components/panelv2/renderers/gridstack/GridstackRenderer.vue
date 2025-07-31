<!--
  Gridstack Renderer Component
  基于 gridstack.js 的网格布局渲染器实现
-->
<template>
  <div 
    ref="containerRef" 
    class="gridstack-renderer"
    :class="{
      'readonly': readonly,
      'dark-theme': isDarkTheme
    }"
  >
    <!-- GridStack 容器将在这里动态创建 -->
    <div 
      ref="gridRef" 
      class="grid-stack"
      :style="gridStyles"
    >
      <!-- 网格项将通过 GridStack API 动态添加 -->
    </div>
    
    <!-- 工具栏 -->
    <GridstackToolbar 
      v-if="!readonly && showToolbar"
      :renderer="rendererInstance"
      :item-count="internalItems.length"
      @add-item="handleAddItem"
      @clear-all="handleClearAll"
      @save-layout="handleSaveLayout"
      @load-layout="handleLoadLayout"
      @config-change="handleConfigChange"
    />
    
    <!-- 拖拽提示 -->
    <div 
      v-if="isDragging" 
      class="drag-overlay"
    >
      <div class="drag-hint">
        <i class="icon-move" />
        <span>拖拽到网格中释放</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { useThemeStore } from '@/store/modules/theme'
import type { 
  BaseRenderer, 
  RendererConfig, 
  RendererCapabilities,
  RendererState,
  RendererEvents
} from '../../types/renderer'
import type { BaseCanvasItem, Viewport } from '../../types/core'
import { useCanvasStore } from '../../store/canvasStore'
import eventBus from '../../core/EventBus'
import { dragDropService, type DragData, type DropZone } from '../../core/DragDropService'
import { generateId } from '../../utils/id'
import GridstackToolbar from './GridstackToolbar.vue'

// Props
interface Props {
  config?: RendererConfig
  items?: BaseCanvasItem[]
  readonly?: boolean
  showToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  items: () => ([]),
  readonly: false,
  showToolbar: true
})

// Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'item-add', item: BaseCanvasItem): void
  (e: 'item-remove', ids: string[]): void
  (e: 'item-update', id: string, updates: Partial<BaseCanvasItem>): void
  (e: 'layout-change', items: BaseCanvasItem[]): void
  (e: 'item-select', ids: string[]): void
  (e: 'viewport-change', viewport: Viewport): void
}

const emit = defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLElement>()
const gridRef = ref<HTMLElement>()
const gridstack = ref<GridStack | null>(null)
const rendererInstance = ref<BaseRenderer | null>(null)

// Store
const themeStore = useThemeStore()
const canvasStore = useCanvasStore()

// State
const isDragging = ref(false)
const selectedItems = ref<string[]>([])
const internalItems = ref<BaseCanvasItem[]>([...props.items])

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

const gridStyles = computed(() => ({
  width: '100%',
  height: '100%',
  minHeight: '400px'
}))

const gridOptions = computed(() => ({
  column: props.config.columns || 12,
  cellHeight: props.config.cellHeight || 'auto',
  margin: props.config.margin || 10,
  resizable: {
    handles: 'e, se, s, sw, w'
  },
  draggable: {
    handle: '.grid-stack-item-content',
    scroll: true
  },
  acceptWidgets: true,
  removable: false,
  animate: true,
  float: false,
  disableResize: props.readonly,
  disableDrag: props.readonly
}))

// Methods
/**
 * 初始化 GridStack
 */
const initializeGridStack = async () => {
  try {
    if (!gridRef.value) {
      throw new Error('Grid container not found')
    }

    // 初始化 GridStack 实例
    gridstack.value = GridStack.init(gridOptions.value, gridRef.value)
    
    // 设置事件监听
    setupEventListeners()
    
    // 加载初始数据
    if (internalItems.value.length > 0) {
      loadItems(internalItems.value)
    }
    
    // 设置拖拽支持
    setupDragDrop()
    
    emit('ready')
    
  } catch (error) {
    console.error('GridStack initialization failed:', error)
    emit('error', error as Error)
  }
}

/**
 * 设置事件监听
 */
const setupEventListeners = () => {
  if (!gridstack.value) return
  
  // 拖拽事件
  gridstack.value.on('dragstart', (event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    isDragging.value = true
    emit('item-select', [id])
  })
  
  gridstack.value.on('dragstop', (event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    isDragging.value = false
    updateItemFromElement(id, element)
  })
  
  // 调整大小事件
  gridstack.value.on('resizestart', (event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    emit('item-select', [id])
  })
  
  gridstack.value.on('resizestop', (event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    updateItemFromElement(id, element)
  })
  
  // 布局变化事件
  gridstack.value.on('change', (event, items) => {
    emit('layout-change', internalItems.value)
  })
  
  // 项目移除事件
  gridstack.value.on('removed', (event, items) => {
    const removedIds = items.map(item => item.id || item.el?.getAttribute('gs-id')).filter(Boolean)
    if (removedIds.length > 0) {
      emit('item-remove', removedIds)
    }
  })
}

/**
 * 设置拖拽支持
 */
const setupDragDrop = () => {
  if (!gridRef.value || !gridstack.value) return
  
  // 注册为拖拽目标
  const dropZone: DropZone = {
    element: gridRef.value,
    accepts: ['card', 'widget', 'component'],
    onDragEnter: (data) => {
      isDragging.value = true
    },
    onDragLeave: () => {
      isDragging.value = false
    },
    onDrop: (data, position) => {
      isDragging.value = false
      handleExternalDrop(data, position)
    }
  }
  
  dragDropService.registerDropZone(dropZone)
}

/**
 * 处理外部拖拽
 */
const handleExternalDrop = (data: DragData, position: { x: number, y: number }) => {
  const newItem: BaseCanvasItem = {
    id: generateId(),
    type: data.type || 'widget',
    position: {
      x: Math.floor(position.x / (gridOptions.value.cellHeight as number || 60)),
      y: Math.floor(position.y / (gridOptions.value.cellHeight as number || 60))
    },
    size: {
      width: 2,
      height: 2
    },
    data: {
      title: data.title || '新组件',
      content: data.content || '拖拽的组件内容',
      ...data.payload
    }
  }
  
  addItem(newItem)
}

/**
 * 加载项目到网格
 */
const loadItems = (items: BaseCanvasItem[]) => {
  if (!gridstack.value) return
  
  // 清空现有项目
  gridstack.value.removeAll(false)
  
  // 添加新项目
  items.forEach(item => {
    addGridItem(item)
  })
}

/**
 * 添加网格项
 */
const addGridItem = (item: BaseCanvasItem) => {
  if (!gridstack.value) return
  
  // 创建网格项元素
  const widget = document.createElement('div')
  widget.className = 'grid-stack-item'
  widget.setAttribute('gs-id', item.id)
  
  // 创建内容容器
  const content = document.createElement('div')
  content.className = 'grid-stack-item-content'
  
  // 添加标题栏
  const header = document.createElement('div')
  header.className = 'item-header'
  header.innerHTML = `
    <span class="item-title">${item.data?.title || item.type || 'Grid Item'}</span>
    <div class="item-actions">
      <button class="btn-edit" title="编辑">
        <i class="icon-edit"></i>
      </button>
      <button class="btn-delete" title="删除">
        <i class="icon-delete"></i>
      </button>
    </div>
  `
  
  // 添加内容区域
  const body = document.createElement('div')
  body.className = 'item-body'
  body.innerHTML = `
    <div class="item-content">${item.data?.content || `Item ${item.id}`}</div>
  `
  
  content.appendChild(header)
  content.appendChild(body)
  widget.appendChild(content)
  
  // 绑定事件
  bindItemEvents(widget, item)
  
  // 添加到网格 - 使用makeWidget方法兼容GridStack v11
  const gridOptions = {
    x: item.position?.x || 0,
    y: item.position?.y || 0,
    w: item.size?.width || 2,
    h: item.size?.height || 2,
    id: item.id
  }
  
  // 使用makeWidget方法替代直接传递HTMLElement
  const gridWidget = gridstack.value.makeWidget(widget)
  gridstack.value.addWidget(gridWidget, gridOptions)
}

/**
 * 绑定项目事件
 */
const bindItemEvents = (element: HTMLElement, item: BaseCanvasItem) => {
  // 编辑按钮
  const editBtn = element.querySelector('.btn-edit')
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleEditItem(item.id)
    })
  }
  
  // 删除按钮
  const deleteBtn = element.querySelector('.btn-delete')
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleDeleteItem(item.id)
    })
  }
  
  // 点击选择
  element.addEventListener('click', (e) => {
    if (!e.defaultPrevented) {
      handleSelectItem(item.id)
    }
  })
}

/**
 * 从元素更新项目数据
 */
const updateItemFromElement = (id: string, element: HTMLElement) => {
  const item = internalItems.value.find(item => item.id === id)
  if (!item) return
  
  // 获取网格位置信息
  const node = gridstack.value?.getGridItems().find(el => 
    (el.getAttribute('gs-id') || el.id) === id
  )
  
  if (node) {
    const rect = node.getBoundingClientRect()
    const containerRect = gridRef.value?.getBoundingClientRect()
    
    const updates: Partial<BaseCanvasItem> = {
      position: {
        x: parseInt(node.getAttribute('gs-x') || '0'),
        y: parseInt(node.getAttribute('gs-y') || '0')
      },
      size: {
        width: parseInt(node.getAttribute('gs-w') || '2'),
        height: parseInt(node.getAttribute('gs-h') || '2')
      }
    }
    
    // 更新内部数据
    const index = internalItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      internalItems.value[index] = { ...internalItems.value[index], ...updates }
      emit('item-update', id, updates)
    }
  }
}

/**
 * 添加项目
 */
const addItem = (item: BaseCanvasItem) => {
  internalItems.value.push(item)
  addGridItem(item)
  emit('item-add', item)
}

/**
 * 移除项目
 */
const removeItem = (id: string) => {
  const element = gridRef.value?.querySelector(`[gs-id="${id}"]`)
  if (element && gridstack.value) {
    gridstack.value.removeWidget(element as HTMLElement, false)
  }
  
  internalItems.value = internalItems.value.filter(item => item.id !== id)
  emit('item-remove', [id])
}

/**
 * 更新项目
 */
const updateItem = (id: string, updates: Partial<BaseCanvasItem>) => {
  const itemIndex = internalItems.value.findIndex(item => item.id === id)
  if (itemIndex !== -1) {
    internalItems.value[itemIndex] = { ...internalItems.value[itemIndex], ...updates }
    
    // 更新网格中的元素
    const element = gridRef.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement
    if (element && gridstack.value && updates.position) {
      gridstack.value.update(element, {
        x: updates.position.x,
        y: updates.position.y,
        w: updates.size?.width,
        h: updates.size?.height
      })
    }
    
    emit('item-update', internalItems.value[itemIndex])
  }
}

/**
 * 清空所有项目
 */
const clearItems = () => {
  if (gridstack.value) {
    gridstack.value.removeAll(false)
  }
  internalItems.value = []
  emit('layout-change', [])
}

/**
 * 事件处理
 */
const handleAddItem = () => {
  const newItem: BaseCanvasItem = {
    id: generateId(),
    type: 'widget',
    position: { x: 0, y: 0 },
    size: { width: 2, height: 2 },
    data: {
      title: '新组件',
      content: '这是一个新添加的组件'
    }
  }
  
  addItem(newItem)
}

const handleClearAll = () => {
  if (gridstack.value) {
    gridstack.value.removeAll(false)
  }
  internalItems.value = []
  emit('layout-change', [])
}

const handleSaveLayout = () => {
  // 保存布局逻辑
  console.log('保存布局:', internalItems.value)
}

const handleLoadLayout = () => {
  // 加载布局逻辑
  console.log('加载布局')
}

const handleEditItem = (id: string) => {
  console.log('编辑项目:', id)
  // 实现编辑逻辑
}

const handleDeleteItem = (id: string) => {
  removeItem(id)
}

const handleSelectItem = (id: string) => {
  selectedItems.value = [id]
  emit('item-select', [id])
}

const handleConfigChange = (config: any) => {
  console.log('Config change:', config)
  if (gridstack.value) {
    if (config.columns) {
      gridstack.value.column(config.columns)
    }
    if (config.margin !== undefined) {
      gridstack.value.margin(config.margin)
    }
    if (config.animate !== undefined) {
      gridstack.value.setAnimation(config.animate)
    }
  }
}

// Watchers
watch(() => props.items, (newItems) => {
  internalItems.value = [...newItems]
  if (gridstack.value) {
    loadItems(newItems)
  }
}, { deep: true })

watch(() => props.config, (newConfig) => {
  if (gridstack.value && newConfig) {
    // 更新网格配置
    gridstack.value.column(newConfig.columns || 12)
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeGridStack()
})

onUnmounted(() => {
  if (gridstack.value) {
    gridstack.value.destroy(false)
  }
  
  // 清理拖拽服务
  if (gridRef.value) {
    dragDropService.unregisterDropZone(gridRef.value)
  }
})

// 暴露组件方法
defineExpose({
  addItem,
  removeItem,
  updateItem,
  clearItems,
  getItems: () => internalItems.value,
  getGridStack: () => gridstack.value,
  refresh: () => gridstack.value?.batchUpdate(false)
})
</script>

<style scoped>
.gridstack-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.grid-stack {
  background: var(--bg-color, #f8f9fa);
}

.readonly .grid-stack {
  pointer-events: none;
}

.dark-theme .grid-stack {
  background: var(--bg-color-dark, #1a1a1a);
}

/* 网格项样式 */
:deep(.grid-stack-item) {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

:deep(.grid-stack-item:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

:deep(.grid-stack-item-content) {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.dark-theme .grid-stack-item-content) {
  background: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

/* 项目头部 */
:deep(.item-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  font-size: 14px;
  font-weight: 500;
}

:deep(.dark-theme .item-header) {
  background: #3a3a3a;
  border-bottom-color: #404040;
}

:deep(.item-title) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.item-actions) {
  display: flex;
  gap: 4px;
}

:deep(.item-actions button) {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 3px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
}

:deep(.item-actions button:hover) {
  background: #e9ecef;
  color: #495057;
}

:deep(.dark-theme .item-actions button:hover) {
  background: #4a4a4a;
  color: #ffffff;
}

/* 项目内容 */
:deep(.item-body) {
  flex: 1;
  padding: 12px;
  overflow: auto;
}

:deep(.item-content) {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

:deep(.dark-theme .item-content) {
  color: #b0b0b0;
}

/* 拖拽覆盖层 */
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 123, 255, 0.1);
  border: 2px dashed #007bff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drag-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: #007bff;
  font-weight: 500;
}

.dark-theme .drag-hint {
  background: #2d2d2d;
  color: #4dabf7;
}

/* 图标样式 */
.icon-move::before { content: '↔'; }
.icon-edit::before { content: '✏'; }
.icon-delete::before { content: '🗑'; }
</style>