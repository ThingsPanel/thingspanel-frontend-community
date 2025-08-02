<!--
  DraggableResizableGrid - 通用可拖拽调整大小栅格组件
  支持拖拽、调整大小、碰撞检测、栅格吸附等功能
-->
<template>
  <div 
    ref="containerRef"
    class="draggable-resizable-grid"
    :class="containerClass"
    :style="[gridCalculation.gridStyle, containerStyle]"
    @click="handleContainerClick"
  >
    <GridItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      :config="gridConfig"
      :style="gridCalculation.itemStyle"
      :readonly="gridConfig.readonly"
      @drag-start="handleDragStart"
      @drag-move="handleDragMove"
      @drag-end="handleDragEnd"
      @resize-start="handleResizeStart"
      @resize-move="handleResizeMove"
      @resize-end="handleResizeEnd"
      @click="handleItemClick"
      @dblclick="handleItemDblclick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { useGridLayout } from './hooks'
import GridItem from './GridItem.vue'
import { checkCollisions, findValidPosition, constrainItemToBounds } from './utils'
import type { 
  GridItem as GridItemType,
  DraggableResizableGridProps,
  DraggableResizableGridEmits,
  DragEvent,
  ResizeEvent,
  GridConfig
} from './types'
import { DEFAULT_GRID_CONFIG } from './types'

// Props定义
interface Props extends DraggableResizableGridProps {}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  config: () => ({}),
  containerStyle: () => ({}),
  containerClass: ''
})

// Emits定义
interface Emits extends DraggableResizableGridEmits {}

const emit = defineEmits<Emits>()

// 容器引用
const containerRef = ref<HTMLElement>()

// 响应式网格项数据
const items = ref<GridItemType[]>([...props.items])

// 监听props变化
watch(() => props.items, (newItems) => {
  items.value = [...newItems]
}, { deep: true })

// 发射布局变化事件
watch(items, (newItems) => {
  emit('layout-change', [...newItems])
}, { deep: true })

// 使用网格布局Hook
const { 
  gridConfig, 
  gridCalculation,
  validatePosition,
  getItemPixelPosition,
  getItemPixelSize,
  pixelToGrid,
  gridToPixel
} = useGridLayout(items, props.config, containerRef)

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const currentDragItem = ref<GridItemType | null>(null)
const currentResizeItem = ref<GridItemType | null>(null)

// 拖拽开始处理
const handleDragStart = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (gridConfig.readonly || item.locked) return
  
  isDragging.value = true
  currentDragItem.value = item
  
  const dragEvent: DragEvent = {
    item,
    oldPosition: { col: item.gridCol, row: item.gridRow },
    newPosition: { col: item.gridCol, row: item.gridRow },
    event
  }
  
  emit('drag-start', dragEvent)
}

// 拖拽移动处理
const handleDragMove = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !currentDragItem.value) return
  
  const dragEvent: DragEvent = {
    item,
    oldPosition: { col: currentDragItem.value.gridCol, row: currentDragItem.value.gridRow },
    newPosition: { col: item.gridCol, row: item.gridRow },
    event
  }
  
  // 碰撞检测
  const collisionResult = checkCollisions(item, items.value)
  if (collisionResult.hasCollision) {
    emit('collision', item, collisionResult.collisions)
    
    // 根据碰撞策略处理
    switch (gridConfig.collision) {
      case 'block':
        // 阻止移动，恢复原位置
        return
      case 'push':
        // TODO: 实现推挤逻辑
        break
      case 'swap':
        // TODO: 实现交换逻辑
        break
      case 'allow':
        // 允许重叠，继续移动
        break
    }
  }
  
  emit('drag-move', dragEvent)
}

// 拖拽结束处理
const handleDragEnd = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !currentDragItem.value) return
  
  // 边界约束
  const constrainedItem = constrainItemToBounds(item, gridConfig)
  
  // 更新项目位置
  const itemIndex = items.value.findIndex(i => i.id === item.id)
  if (itemIndex !== -1) {
    items.value[itemIndex] = { ...items.value[itemIndex], ...constrainedItem }
  }
  
  const dragEvent: DragEvent = {
    item: constrainedItem,
    oldPosition: { col: currentDragItem.value.gridCol, row: currentDragItem.value.gridRow },
    newPosition: { col: constrainedItem.gridCol, row: constrainedItem.gridRow },
    event
  }
  
  isDragging.value = false
  currentDragItem.value = null
  
  emit('drag-end', dragEvent)
}

// 调整大小开始处理
const handleResizeStart = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (gridConfig.readonly || item.locked || !item.resizable) return
  
  isResizing.value = true
  currentResizeItem.value = item
  
  const resizeEvent: ResizeEvent = {
    item,
    oldSize: { colSpan: item.gridColSpan, rowSpan: item.gridRowSpan },
    newSize: { colSpan: item.gridColSpan, rowSpan: item.gridRowSpan },
    event
  }
  
  emit('resize-start', resizeEvent)
}

// 调整大小移动处理
const handleResizeMove = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (!isResizing.value || !currentResizeItem.value) return
  
  const resizeEvent: ResizeEvent = {
    item,
    oldSize: { colSpan: currentResizeItem.value.gridColSpan, rowSpan: currentResizeItem.value.gridRowSpan },
    newSize: { colSpan: item.gridColSpan, rowSpan: item.gridRowSpan },
    event
  }
  
  emit('resize-move', resizeEvent)
}

// 调整大小结束处理
const handleResizeEnd = (item: GridItemType, event: MouseEvent | TouchEvent) => {
  if (!isResizing.value || !currentResizeItem.value) return
  
  // 边界约束
  const constrainedItem = constrainItemToBounds(item, gridConfig)
  
  // 最小尺寸约束
  if (item.minColSpan) {
    constrainedItem.gridColSpan = Math.max(constrainedItem.gridColSpan, item.minColSpan)
  }
  if (item.minRowSpan) {
    constrainedItem.gridRowSpan = Math.max(constrainedItem.gridRowSpan, item.minRowSpan)
  }
  
  // 最大尺寸约束
  if (item.maxColSpan) {
    constrainedItem.gridColSpan = Math.min(constrainedItem.gridColSpan, item.maxColSpan)
  }
  if (item.maxRowSpan) {
    constrainedItem.gridRowSpan = Math.min(constrainedItem.gridRowSpan, item.maxRowSpan)
  }
  
  // 更新项目尺寸
  const itemIndex = items.value.findIndex(i => i.id === item.id)
  if (itemIndex !== -1) {
    items.value[itemIndex] = { ...items.value[itemIndex], ...constrainedItem }
  }
  
  const resizeEvent: ResizeEvent = {
    item: constrainedItem,
    oldSize: { colSpan: currentResizeItem.value.gridColSpan, rowSpan: currentResizeItem.value.gridRowSpan },
    newSize: { colSpan: constrainedItem.gridColSpan, rowSpan: constrainedItem.gridRowSpan },
    event
  }
  
  isResizing.value = false
  currentResizeItem.value = null
  
  emit('resize-end', resizeEvent)
}

// 项目点击处理
const handleItemClick = (item: GridItemType, event: MouseEvent) => {
  emit('item-click', item, event)
}

// 项目双击处理
const handleItemDblclick = (item: GridItemType, event: MouseEvent) => {
  emit('item-dblclick', item, event)
}

// 容器点击处理
const handleContainerClick = (event: MouseEvent) => {
  emit('container-click', event)
}

// 暴露的方法
defineExpose({
  /** 添加网格项 */
  addItem: (item: GridItemType) => {
    // 寻找有效位置
    const validPosition = findValidPosition(item, items.value, gridConfig)
    if (validPosition) {
      const newItem = { ...item, ...validPosition }
      items.value.push(newItem)
      return newItem
    }
    return null
  },
  
  /** 移除网格项 */
  removeItem: (id: string) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const removedItem = items.value.splice(index, 1)[0]
      return removedItem
    }
    return null
  },
  
  /** 更新网格项 */
  updateItem: (id: string, updates: Partial<GridItemType>) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
      return items.value[index]
    }
    return null
  },
  
  /** 获取网格项 */
  getItem: (id: string) => {
    return items.value.find(item => item.id === id) || null
  },
  
  /** 获取所有网格项 */
  getAllItems: () => [...items.value],
  
  /** 清空所有网格项 */
  clearItems: () => {
    items.value.splice(0, items.value.length)
  },
  
  /** 检查位置是否有效 */
  isValidPosition: validatePosition,
  
  /** 获取项目像素位置 */
  getItemPixelPosition,
  
  /** 获取项目像素尺寸 */
  getItemPixelSize
})
</script>

<style scoped>
.draggable-resizable-grid {
  user-select: none;
  box-sizing: border-box;
}

/* 网格背景样式 */
.draggable-resizable-grid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

/* 拖拽状态样式 */
.draggable-resizable-grid.dragging {
  cursor: grabbing;
}

.draggable-resizable-grid.resizing {
  cursor: nw-resize;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .draggable-resizable-grid {
    grid-template-columns: repeat(6, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .draggable-resizable-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}
</style>