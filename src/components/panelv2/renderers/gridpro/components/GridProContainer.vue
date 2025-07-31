<!--
  GridPro 容器组件
  负责管理网格布局、拖拽、调整大小、动画等核心功能
-->

<template>
  <div
    ref="containerRef"
    class="gridpro-container"
    :class="containerClasses"
    :style="containerStyles"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 网格背景（可选） -->
    <div
      v-if="config.showGrid"
      class="gridpro-grid-background"
      :style="gridBackgroundStyles"
    />

    <!-- GridPro 项目 -->
    <GridProItem
      v-for="item in visibleItems"
      :key="item.id"
      :item="item"
      :config="config"
      :is-selected="selectedItemIds.has(item.id)"
      :is-dragging="dragState.isDragging && dragState.draggedItemId === item.id"
      :is-resizing="resizeState.isResizing && resizeState.resizedItemId === item.id"
      :calculator="calculator"
      @drag-start="handleDragStart"
      @drag-move="handleDragMove"
      @drag-end="handleDragEnd"
      @resize-start="handleResizeStart"
      @resize-move="handleResizeMove"
      @resize-end="handleResizeEnd"
      @select="handleItemSelect"
      @contextmenu="handleItemContextMenu"
    />

    <!-- 拖拽指示器 -->
    <div
      v-if="dragState.isDragging && dragState.showIndicator"
      class="gridpro-drag-indicator"
      :style="dragIndicatorStyles"
    />

    <!-- 调整大小指示器 -->
    <div
      v-if="resizeIndicators.show"
      class="gridpro-resize-indicator"
      :style="resizeIndicatorStyles"
    />

    <!-- 选择框 -->
    <div
      v-if="selectionBox.show"
      class="gridpro-selection-box"
      :style="selectionBoxStyles"
    />

    <!-- 多选工具栏 -->
    <transition name="fade">
      <div
        v-if="selectedItemIds.size > 1"
        class="gridpro-multi-select-toolbar"
        :style="multiSelectToolbarStyles"
      >
        <n-button-group size="small">
          <n-button @click="alignSelectedItems('left')">
            <template #icon>
              <AlignLeft />  
            </template>
          </n-button>
          <n-button @click="alignSelectedItems('center')">
            <template #icon>
              <AlignCenter />
            </template>
          </n-button>
          <n-button @click="alignSelectedItems('right')">
            <template #icon>
              <AlignRight />
            </template>
          </n-button>
          <n-button @click="distributeSelectedItems('horizontal')">
            <template #icon>
              <DistributeHorizontal />
            </template>
          </n-button>
          <n-button @click="deleteSelectedItems" type="error">
            <template #icon>
              <TrashIcon />
            </template>
          </n-button>
        </n-button-group>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import { NButton, NButtonGroup } from 'naive-ui'
import {
  ArrowBackOutline as AlignLeft,
  RemoveOutline as AlignCenter,
  ArrowForwardOutline as AlignRight,
  SwapHorizontalOutline as DistributeHorizontal,
  TrashOutline as TrashIcon
} from '@vicons/ionicons5'

import GridProItem from './GridProItem.vue'
import type { BaseCanvasItem } from '../../../types/core'
import type { GridProItem as IGridProItem, GridProConfig } from '../types/gridpro'
import { GridProAdapter } from '../adapters/GridProAdapter'
import { GridCalculator } from '../utils/gridAlgorithms'
import { useGridProLayout } from '../composables/useGridProLayout'
import { useGridProDrag } from '../composables/useGridProDrag'
import { useGridProResize } from '../composables/useGridProResize'
import { useGridProAnimation } from '../composables/useGridProAnimation'
import { useGridProGesture } from '../composables/useGridProGesture'
import { useGridProVirtualization } from '../composables/useGridProVirtualization'

interface Props {
  items: BaseCanvasItem[]
  config: GridProConfig
  selectedItemIds?: Set<string>
  readonly?: boolean
}

interface Emits {
  (e: 'update:items', items: BaseCanvasItem[]): void
  (e: 'update:selectedItemIds', ids: Set<string>): void
  (e: 'item-added', item: BaseCanvasItem): void
  (e: 'item-updated', item: BaseCanvasItem): void
  (e: 'item-removed', itemId: string): void
  (e: 'selection-changed', selectedIds: Set<string>): void
  (e: 'layout-changed', items: BaseCanvasItem[]): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedItemIds: () => new Set(),
  readonly: false
})

const emit = defineEmits<Emits>()

// 模板引用
const containerRef = ref<HTMLElement>()

// 核心状态
const calculator = ref(new GridCalculator(props.config))
const adapter = ref(new GridProAdapter(props.config))
const gridProItems = ref<IGridProItem[]>([])
const selectedItemIds = ref(new Set(props.selectedItemIds))

// 选择框状态
const selectionBox = reactive({
  show: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// 事件处理函数（需要在 composable 初始化之前定义）
const handleTap = (position: { x: number; y: number }, event: PointerEvent) => {
  // 点击空白区域取消选择
  selectedItemIds.value.clear()
  emit('update:selectedItemIds', selectedItemIds.value)
  emit('selection-changed', selectedItemIds.value)
}

const handleLongPress = (position: { x: number; y: number }, event: PointerEvent) => {
  // 长按处理
  console.log('Long press at:', position)
}

const handleSwipe = (direction: string, velocity: { x: number; y: number }) => {
  // 滑动手势处理
  console.log('Swipe:', direction, velocity)
}

// 工具栏操作函数（需要在 handleKeyboardShortcut 之前定义）
const deleteSelectedItems = () => {
  selectedItemIds.value.forEach(itemId => {
    removeItem(itemId)
    emit('item-removed', itemId)
  })
  selectedItemIds.value.clear()
  emit('update:selectedItemIds', selectedItemIds.value)
}

const selectAllItems = () => {
  selectedItemIds.value = new Set(gridProItems.value.map(item => item.id))
  emit('update:selectedItemIds', selectedItemIds.value)
  emit('selection-changed', selectedItemIds.value)
}

const copySelectedItems = () => {
  // 复制选中项目到剪贴板
  console.log('Copy selected items')
}

const pasteItems = () => {
  // 从剪贴板粘贴项目
  console.log('Paste items')
}

const handleKeyboardShortcut = (action: string, event: KeyboardEvent) => {
  switch (action) {
    case 'delete':
      deleteSelectedItems()
      break
    case 'selectAll':
      selectAllItems()
      break
    case 'copy':
      copySelectedItems()
      break
    case 'paste':
      pasteItems()
      break
    default:
      console.log('Unhandled keyboard shortcut:', action)
  }
}

// 初始化核心 composables
const {
  layoutItems,
  addItem,
  updateItem,
  removeItem,
  compactLayout,
  getCollisions
} = useGridProLayout({
  config: props.config,
  calculator: calculator.value,
  items: gridProItems,
  onItemsChange: (items) => {
    updateCanvasItems(items)
  }
})

const {
  dragState,
  startDrag,
  moveDrag,
  endDrag,
  cancelDrag
} = useGridProDrag({
  config: props.config,
  calculator: calculator.value,
  items: gridProItems,
  onDragStart: (itemId) => {
    animateSystem.animateDragStart(itemId)
  },
  onDragEnd: (itemId) => {
    animateSystem.animateDragEnd(itemId)
  }
})

const {
  resizeState,
  resizeIndicators,
  startResize,
  endResize,
  cancelResize
} = useGridProResize({
  config: props.config,
  calculator: calculator.value,
  items: gridProItems,
  onResizeStart: (itemId) => {
    animateSystem.animateResizeStart(itemId)
  },
  onResizeEnd: (itemId) => {
    animateSystem.animateResizeEnd(itemId)
  }
})

const animateSystem = useGridProAnimation({
  config: props.config,
  calculator: calculator.value,
  onAnimationStart: (itemId, type) => {
    console.debug(`Animation started: ${itemId} - ${type}`)
  },
  onAnimationComplete: (itemId, type) => {
    console.debug(`Animation completed: ${itemId} - ${type}`)
  }
})

const {
  initializeGesture,
  destroyGesture
} = useGridProGesture({
  config: props.config,
  onTap: handleTap,
  onLongPress: handleLongPress,
  onSwipe: handleSwipe,
  onKeyboardShortcut: handleKeyboardShortcut
})

const {
  visibleItems: virtualizedItems,
  registerItemElement,
  unregisterItemElement
} = useGridProVirtualization({
  config: props.config,
  calculator: calculator.value,
  containerElement: containerRef.value,
  items: gridProItems,
  onVisibilityChange: (visible, hidden) => {
    console.debug(`Virtualization: ${visible.length} visible, ${hidden.length} hidden`)
  }
})

// 计算属性
const containerClasses = computed(() => ({
  'gridpro-container--readonly': props.readonly,
  'gridpro-container--dragging': dragState.isDragging,
  'gridpro-container--resizing': resizeState.isResizing,
  [`gridpro-container--layout-${props.config.layoutMode}`]: true
}))

const containerStyles = computed(() => ({
  '--gridpro-columns': props.config.columns,
  '--gridpro-row-height': `${props.config.rowHeight}px`,
  '--gridpro-gap': `${props.config.gap}px`,
  '--gridpro-margin-x': `${props.config.margin[0]}px`,
  '--gridpro-margin-y': `${props.config.margin[1]}px`,
  minHeight: `${calculateContainerHeight()}px`
}))

const gridBackgroundStyles = computed(() => {
  const gridInfo = calculator.value.calculateGrid()
  return {
    backgroundImage: `
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(180deg, rgba(0,0,0,0.1) 1px, transparent 1px)
    `,
    backgroundSize: `${gridInfo.cellWidth}px ${gridInfo.cellHeight}px`,
    backgroundPosition: `${props.config.margin[0]}px ${props.config.margin[1]}px`
  }
})

const dragIndicatorStyles = computed(() => {
  if (!dragState.isDragging || !dragState.indicatorPosition) return {}
  
  return {
    left: `${dragState.indicatorPosition.x}px`,
    top: `${dragState.indicatorPosition.y}px`,
    width: `${dragState.indicatorSize?.width || 100}px`,
    height: `${dragState.indicatorSize?.height || 100}px`
  }
})

const resizeIndicatorStyles = computed(() => {
  if (!resizeIndicators.show) return {}
  
  return {
    left: `${resizeIndicators.bounds.x}px`,
    top: `${resizeIndicators.bounds.y}px`,
    width: `${resizeIndicators.bounds.width}px`,
    height: `${resizeIndicators.bounds.height}px`
  }
})

const selectionBoxStyles = computed(() => {
  if (!selectionBox.show) return {}
  
  const left = Math.min(selectionBox.startX, selectionBox.endX)
  const top = Math.min(selectionBox.startY, selectionBox.endY)
  const width = Math.abs(selectionBox.endX - selectionBox.startX)
  const height = Math.abs(selectionBox.endY - selectionBox.startY)
  
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

const multiSelectToolbarStyles = computed(() => {
  if (selectedItemIds.value.size <= 1) return {}
  
  // 计算所选项目的中心位置
  const selectedItems = gridProItems.value.filter(item => selectedItemIds.value.has(item.id))
  if (selectedItems.length === 0) return {}
  
  const bounds = calculateSelectionBounds(selectedItems)
  return {
    left: `${bounds.x + bounds.width / 2 - 100}px`,
    top: `${bounds.y - 40}px`
  }
})

const visibleItems = computed(() => {
  return props.config.virtualization ? virtualizedItems.value : gridProItems.value
})

// 生命周期方法
onMounted(async () => {
  await nextTick()
  
  if (containerRef.value) {
    initializeGesture(containerRef.value)
    updateCalculatorContainer()
  }
  
  convertToGridProItems()
})

onUnmounted(() => {
  destroyGesture()
})

// 监听器
watch(() => props.items, () => {
  convertToGridProItems()
}, { deep: true })

watch(() => props.config, (newConfig) => {
  calculator.value.updateConfig(newConfig)
  adapter.value.updateConfig(newConfig)
}, { deep: true })

watch(() => props.selectedItemIds, (newIds) => {
  selectedItemIds.value = new Set(newIds)
})

// 核心方法
const convertToGridProItems = () => {
  const result = adapter.value.batchToGridPro(props.items)
  if (result.success) {
    gridProItems.value = result.data
  } else {
    console.error('Failed to convert items to GridPro format:', result.errors)
  }
}

const updateCanvasItems = (items: IGridProItem[]) => {
  const result = adapter.value.batchToBaseCanvas(items)
  if (result.success) {
    emit('update:items', result.data)
    emit('layout-changed', result.data)
  } else {
    console.error('Failed to convert items to Canvas format:', result.errors)
  }
}

const updateCalculatorContainer = () => {
  if (containerRef.value) {
    calculator.value.updateContainer(containerRef.value)
  }
}

const calculateContainerHeight = (): number => {
  if (gridProItems.value.length === 0) return props.config.rowHeight * 3
  
  const maxY = Math.max(...gridProItems.value.map(item => item.y + item.h))
  return maxY * (props.config.rowHeight + props.config.gap) + props.config.margin[1] * 2
}

const calculateSelectionBounds = (items: IGridProItem[]) => {
  const bounds = items.map(item => calculator.value.getItemBounds(item))
  
  const minX = Math.min(...bounds.map(b => b.x))
  const minY = Math.min(...bounds.map(b => b.y))
  const maxX = Math.max(...bounds.map(b => b.x + b.width))
  const maxY = Math.max(...bounds.map(b => b.y + b.height))
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// 事件处理器
const handleDragStart = (itemId: string, startEvent: PointerEvent, element: HTMLElement) => {
  if (props.readonly) return
  startDrag(itemId, startEvent, element)
}

const handleDragMove = (itemId: string, position: { x: number; y: number }) => {
  moveDrag(itemId, position)
}

const handleDragEnd = (itemId: string, finalPosition: { x: number; y: number }) => {
  endDrag(itemId, finalPosition)
}

const handleResizeStart = (itemId: string, handle: string, startEvent: PointerEvent, element: HTMLElement) => {
  if (props.readonly) return
  startResize(itemId, handle as any, startEvent, element)
}

const handleResizeMove = (itemId: string, bounds: any) => {
  // 调整大小移动处理
}

const handleResizeEnd = (itemId: string, finalBounds: any) => {
  endResize(finalBounds)
}

const handleItemSelect = (itemId: string, event: Event) => {
  const ctrlKey = (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey
  
  if (ctrlKey) {
    // 多选模式
    const newSelection = new Set(selectedItemIds.value)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    selectedItemIds.value = newSelection
  } else {
    // 单选模式
    selectedItemIds.value = new Set([itemId])
  }
  
  emit('update:selectedItemIds', selectedItemIds.value)
  emit('selection-changed', selectedItemIds.value)
}

const handleItemContextMenu = (itemId: string, event: MouseEvent) => {
  // 右键菜单处理
  console.log('Context menu for item:', itemId)
}

const handleContextMenu = (event: MouseEvent) => {
  // 容器右键菜单
  console.log('Container context menu')
}

// 工具栏操作
const alignSelectedItems = (alignment: 'left' | 'center' | 'right') => {
  const selectedItems = gridProItems.value.filter(item => selectedItemIds.value.has(item.id))
  if (selectedItems.length < 2) return
  
  const bounds = calculateSelectionBounds(selectedItems)
  
  selectedItems.forEach(item => {
    switch (alignment) {
      case 'left':
        item.x = calculator.value.pixelToGrid(bounds.x, 0).x
        break
      case 'center':
        item.x = calculator.value.pixelToGrid(bounds.x + bounds.width / 2 - calculator.value.getItemBounds(item).width / 2, 0).x
        break
      case 'right':
        item.x = calculator.value.pixelToGrid(bounds.x + bounds.width - calculator.value.getItemBounds(item).width, 0).x
        break
    }
    updateItem(item.id, item)
  })
}

const distributeSelectedItems = (direction: 'horizontal' | 'vertical') => {
  const selectedItems = gridProItems.value.filter(item => selectedItemIds.value.has(item.id))
  if (selectedItems.length < 3) return
  
  // 分布式对齐逻辑
  selectedItems.sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y)
  
  const first = selectedItems[0]
  const last = selectedItems[selectedItems.length - 1]
  const totalSpace = direction === 'horizontal' 
    ? last.x - first.x - first.w
    : last.y - first.y - first.h
  
  const spacing = totalSpace / (selectedItems.length - 1)
  
  selectedItems.forEach((item, index) => {
    if (index === 0 || index === selectedItems.length - 1) return
    
    if (direction === 'horizontal') {
      item.x = first.x + first.w + spacing * index
    } else {
      item.y = first.y + first.h + spacing * index
    }
    updateItem(item.id, item)
  })
}

// 暴露公共方法
defineExpose({
  addItem: (item: BaseCanvasItem) => {
    const result = adapter.value.toGridProItem(item)
    if (result.success) {
      addItem(result.data)
      emit('item-added', item)
    }
  },
  removeItem: (itemId: string) => {
    removeItem(itemId)
    emit('item-removed', itemId)
  },
  updateItem: (item: BaseCanvasItem) => {
    const result = adapter.value.toGridProItem(item)
    if (result.success) {
      updateItem(item.id, result.data)
      emit('item-updated', item)
    }
  },
  compactLayout: () => {
    compactLayout()
  },
  getSelectedItems: () => {
    return Array.from(selectedItemIds.value)
  },
  clearSelection: () => {
    selectedItemIds.value.clear()
    emit('update:selectedItemIds', selectedItemIds.value)
  }
})
</script>

<style scoped>
.gridpro-container {
  position: relative;
  width: 100%;
  min-height: 300px;
  background: var(--gridpro-container-bg, #fafafa);
  user-select: none;
  overflow: auto;
}

.gridpro-container--readonly {
  pointer-events: none;
}

.gridpro-container--dragging {
  cursor: grabbing;
}

.gridpro-grid-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.gridpro-drag-indicator {
  position: absolute;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed #1890ff;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.1s ease;
}

.gridpro-resize-indicator {
  position: absolute;
  background: rgba(82, 196, 26, 0.1);
  border: 2px dashed #52c41a;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
}

.gridpro-selection-box {
  position: absolute;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid #1890ff;
  pointer-events: none;
  z-index: 999;
}

.gridpro-multi-select-toolbar {
  position: absolute;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 1001;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全局拖拽状态样式 */
:global(.gridpro-drag-active) {
  cursor: grabbing !important;
}

:global(.gridpro-resize-active) {
  cursor: crosshair !important;
}
</style>