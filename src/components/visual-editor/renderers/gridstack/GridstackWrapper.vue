<template>
  <div 
    ref="containerRef" 
    class="gridstack-wrapper"
    :class="{
      'readonly': readonly,
      'dark-theme': isDarkTheme
    }"
  >
    <div 
      ref="gridRef" 
      class="grid-stack"
      :style="gridStyles"
    >
      <!-- 网格项将通过 GridStack API 动态添加 -->
    </div>
    
    <!-- 拖拽提示 -->
    <div 
      v-if="isDragging" 
      class="drag-overlay"
    >
      <div class="drag-hint">
        <n-icon size="20">
          <component :is="MoveOutline" />
        </n-icon>
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
import { MoveOutline } from '@vicons/ionicons5'
import type { GraphData } from '../../types'
import { useEditor } from '../../hooks/useEditor'

// Props
interface Props {
  items?: GraphData[]
  readonly?: boolean
  columns?: number
  cellHeight?: number | string
  margin?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => ([]),
  readonly: false,
  columns: 12,
  cellHeight: 'auto',
  margin: 10
})

// Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'item-add', item: GraphData): void
  (e: 'item-remove', ids: string[]): void
  (e: 'item-update', id: string, updates: Partial<GraphData>): void
  (e: 'layout-change', items: GraphData[]): void
  (e: 'item-select', ids: string[]): void
}

const emit = defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLElement>()
const gridRef = ref<HTMLElement>()
const gridstack = ref<GridStack | null>(null)

// Store
const themeStore = useThemeStore()
const { selectNode, addWidget: editorAddWidget } = useEditor()

// State
const isDragging = ref(false)
const internalItems = ref<GraphData[]>([...props.items])

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

const gridStyles = computed(() => ({
  width: '100%',
  height: '100%',
  minHeight: '400px'
}))

const gridOptions = computed(() => ({
  column: props.columns,
  cellHeight: props.cellHeight,
  margin: props.margin,
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
    
    // 设置拖拽支持
    setupDragDrop()
    
    // 标记GridStack已准备就绪
    isGridStackReady.value = true
    console.log('🔧 GridStack初始化完成，ready状态已设置')
    
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
  gridstack.value.on('dragstart', (_event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    isDragging.value = true
    selectNode(id)
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
    selectNode(id)
    emit('item-select', [id])
  })
  
  gridstack.value.on('resizestop', (event, element) => {
    const id = element.getAttribute('gs-id') || element.id
    updateItemFromElement(id, element)
  })
  
  // 布局变化事件
  gridstack.value.on('change', (_event, _items) => {
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
  
  // 监听外部拖拽进入
  gridRef.value.addEventListener('dragenter', (e) => {
    e.preventDefault()
    isDragging.value = true
  })
  
  gridRef.value.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  
  gridRef.value.addEventListener('dragleave', (e) => {
    if (!gridRef.value?.contains(e.relatedTarget as Node)) {
      isDragging.value = false
    }
  })
  
  gridRef.value.addEventListener('drop', (e) => {
    e.preventDefault()
    isDragging.value = false
    
    const widgetType = e.dataTransfer?.getData('text/plain')
    if (widgetType) {
      handleExternalDrop(widgetType, { x: e.offsetX, y: e.offsetY })
    }
  })
}

/**
 * 处理外部拖拽
 */
const handleExternalDrop = (widgetType: string, position: { x: number, y: number }) => {
  console.log('🎯 GridStack接收拖拽:', widgetType, position)
  
  const cellSize = (typeof props.cellHeight === 'number' ? props.cellHeight : 60)
  const margin = props.margin
  
  // 计算网格位置
  const gridX = Math.floor(position.x / (cellSize + margin))
  const gridY = Math.floor(position.y / (cellSize + margin))
  
  console.log('📍 计算网格位置:', { gridX, gridY })
  
  // 使用 editor 的 addWidget 方法添加到状态管理器
  // 新增的组件会通过 props.items 的变化自动显示在网格中
  editorAddWidget(widgetType, { x: gridX, y: gridY })
  
  console.log('✅ 已通过editor添加组件，等待props更新...')
}

/**
 * 加载项目到网格
 */
const loadItems = (items: GraphData[]) => {
  if (!gridstack.value) {
    console.log('❌ loadItems: GridStack未初始化')
    return
  }
  
  console.log('🔄 loadItems: 开始加载', items.length, '个items')
  
  // 清空现有项目
  gridstack.value.removeAll(false)
  
  // 添加新项目
  items.forEach((item, index) => {
    console.log(`📦 添加第${index + 1}个item:`, item)
    addGridItem(item)
  })
  
  console.log('✅ loadItems: 加载完成')
}

/**
 * 添加网格项
 */
const addGridItem = (item: GraphData) => {
  if (!gridstack.value) {
    console.log('❌ addGridItem: GridStack未初始化')
    return
  }
  
  console.log('🔨 addGridItem: 创建widget元素', item.id, item.type)
  
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
    <span class="item-title">${getWidgetDisplayName(item.type)}</span>
    <div class="item-actions">
      <button class="btn-edit" title="编辑">
        <span>✏</span>
      </button>
      <button class="btn-delete" title="删除">
        <span>🗑</span>
      </button>
    </div>
  `
  
  // 添加内容区域 - 渲染真实的widget组件
  const body = document.createElement('div')
  body.className = 'item-body'
  body.innerHTML = `
    <div class="widget-preview">
      <div class="widget-type">${item.type}</div>
      <div class="widget-id">${item.id}</div>
    </div>
  `
  
  content.appendChild(header)
  content.appendChild(body)
  widget.appendChild(content)
  
  // 绑定事件
  bindItemEvents(widget, item)
  
  // 设置网格项属性 - 使用GridStack专用的网格单位
  const gridItemOptions = {
    x: item.x || 0,
    y: item.y || 0,
    w: item.layout?.gridstack?.w || 2,   // 使用网格单位
    h: item.layout?.gridstack?.h || 2,   // 使用网格单位
    id: item.id
  }
  
  widget.setAttribute('gs-x', String(gridItemOptions.x))
  widget.setAttribute('gs-y', String(gridItemOptions.y))
  widget.setAttribute('gs-w', String(gridItemOptions.w))
  widget.setAttribute('gs-h', String(gridItemOptions.h))
  widget.setAttribute('gs-id', gridItemOptions.id)
  
  // GridStack v12 API: 先添加到DOM，再makeWidget
  gridRef.value.appendChild(widget)
  gridstack.value.makeWidget(widget)
}

/**
 * 绑定项目事件
 */
const bindItemEvents = (element: HTMLElement, item: GraphData) => {
  // 编辑按钮
  const editBtn = element.querySelector('.btn-edit')
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      selectNode(item.id)
    })
  }
  
  // 删除按钮
  const deleteBtn = element.querySelector('.btn-delete')
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      removeItem(item.id)
    })
  }
  
  // 点击选择
  element.addEventListener('click', (e) => {
    if (!e.defaultPrevented) {
      selectNode(item.id)
      emit('item-select', [item.id])
    }
  })
}

/**
 * 从元素更新项目数据
 */
const updateItemFromElement = (id: string, _element: HTMLElement) => {
  const item = internalItems.value.find(item => item.id === id)
  if (!item) return
  
  // 获取网格位置信息
  const node = gridstack.value?.getGridItems().find(el => 
    (el.getAttribute('gs-id') || el.id) === id
  )
  
  if (node) {
    const gridX = parseInt(node.getAttribute('gs-x') || '0')
    const gridY = parseInt(node.getAttribute('gs-y') || '0')  
    const gridW = parseInt(node.getAttribute('gs-w') || '2')
    const gridH = parseInt(node.getAttribute('gs-h') || '2')
    
    const updates: Partial<GraphData> = {
      x: gridX,
      y: gridY,
      // 更新layout中的gridstack数据，而不是直接更新width/height
      layout: {
        ...item.layout,
        gridstack: {
          w: gridW,
          h: gridH
        }
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
 * 添加项目到网格显示（不添加到状态管理器）
 */
const addItem = (item: GraphData) => {
  console.log('📦 添加项目到GridStack网格:', item)
  // 检查是否已存在，避免重复添加
  if (!internalItems.value.find(existing => existing.id === item.id)) {
    internalItems.value.push(item)
    addGridItem(item)
    emit('item-add', item)
  } else {
    console.log('⚠️ 项目已存在，跳过添加:', item.id)
  }
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
const updateItem = (id: string, updates: Partial<GraphData>) => {
  const itemIndex = internalItems.value.findIndex(item => item.id === id)
  if (itemIndex !== -1) {
    internalItems.value[itemIndex] = { ...internalItems.value[itemIndex], ...updates }
    
    // 更新网格中的元素
    const element = gridRef.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement
    if (element && gridstack.value) {
      if (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) {
        gridstack.value.update(element, {
          x: updates.x,
          y: updates.y,
          w: updates.width,
          h: updates.height
        })
      }
    }
    
    emit('item-update', id, updates)
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
 * 获取组件显示名称
 */
const getWidgetDisplayName = (type: string): string => {
  const nameMap: Record<string, string> = {
    'text': '文本',
    'image': '图片',
    'bar-chart': '柱状图',
    'line-chart': '折线图',
    'pie-chart': '饼图',
    'digit-indicator': '数字指示器',
    'chart-digit-indicator': '数据指示器',
    'chart-bar': '数据柱状图'
  }
  return nameMap[type] || type
}

/**
 * 获取默认属性
 */
const getDefaultProperties = (type: string) => {
  switch (type) {
    case 'text':
      return {
        content: '文本内容',
        fontSize: 14,
        color: '#333333',
        textAlign: 'left'
      }
    case 'image':
      return {
        src: '',
        alt: '图片',
        objectFit: 'cover'
      }
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
      return {
        title: '图表标题',
        data: [
          { name: '数据1', value: 120 },
          { name: '数据2', value: 200 },
          { name: '数据3', value: 150 },
          { name: '数据4', value: 80 }
        ],
        color: '#18a058'
      }
    case 'digit-indicator':
      return {
        value: 888,
        label: '数据指示器',
        unit: '',
        color: '#18a058',
        backgroundColor: '#f0f0f0',
        fontSize: 24
      }
    case 'chart-digit-indicator':
      return {
        title: '数据指示器',
        deviceId: '',
        metricsId: '',
        metricsType: 'telemetry',
        icon: 'uil:analytics',
        color: '#18a058',
        backgroundColor: '#f0f0f0'
      }
    case 'chart-bar':
      return {
        title: '数据柱状图',
        deviceIds: [],
        metricsIds: [],
        colors: ['#18a058', '#2080f0', '#f0a020', '#d03050'],
        showLegend: true,
        showGrid: true
      }
    default:
      return {}
  }
}

// Watchers
watch(() => props.items, (newItems, oldItems) => {
  console.log('📦 GridstackWrapper接收到新的items:', newItems.length, newItems)
  console.log('🔄 oldItems:', oldItems?.length || 0)
  
  internalItems.value = [...newItems]
  
  if (gridstack.value) {
    console.log('🔄 重新加载GridStack items')
    loadItems(newItems)
  } else {
    console.log('⏳ GridStack未初始化，等待ready后加载')
  }
}, { deep: true, immediate: true })

// 监听GridStack初始化完成，加载数据
const isGridStackReady = ref(false)
watch(isGridStackReady, (ready) => {
  if (ready && internalItems.value.length > 0) {
    console.log('🚀 GridStack已准备就绪，加载初始数据')
    loadItems(internalItems.value)
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeGridStack()
})

onUnmounted(() => {
  if (gridstack.value) {
    gridstack.value.destroy(false)
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
.gridstack-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  
  /* CSS变量定义 */
  --bg-color: #ffffff;
  --bg-color-dark: #1a1a1a;
  --border-color: #e1e5e9;
  --border-color-dark: #404040;
  --text-color: #495057;
  --text-color-dark: #ffffff;
  --header-bg: #f8f9fa;
  --header-bg-dark: #3a3a3a;
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  background: transparent;
}

:deep(.grid-stack-item:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

:deep(.grid-stack-item-content) {
  background: var(--bg-color, white);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s ease;
}

:deep(.dark-theme .grid-stack-item-content) {
  background: var(--bg-color-dark, #2d2d2d);
  border-color: var(--border-color-dark, #404040);
  color: var(--text-color-dark, #ffffff);
}

/* 项目头部 */
:deep(.item-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--header-bg, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.dark-theme .item-header) {
  background: var(--header-bg-dark, #3a3a3a);
  border-bottom-color: var(--border-color-dark, #404040);
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

:deep(.widget-preview) {
  text-align: center;
  color: #6c757d;
  font-size: 12px;
}

:deep(.widget-type) {
  font-weight: 500;
  margin-bottom: 4px;
}

:deep(.widget-id) {
  opacity: 0.7;
  font-size: 10px;
}

:deep(.dark-theme .widget-preview) {
  color: #b0b0b0;
}

/* 拖拽覆盖层 */
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
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
</style>