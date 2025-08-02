<!--
  OptimizedDraggableResizableGrid - 优化版可拖拽调整大小栅格组件
  解决性能问题，提供更流畅的拖拽和缩放体验
-->
<template>
  <div 
    ref="containerRef"
    class="optimized-draggable-grid"
    :class="containerClass"
    :style="[gridCalculation.gridStyle, containerStyle]"
    @click="handleContainerClick"
  >
    <OptimizedGridItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      :config="gridConfig"
      :container-width="containerWidth"
      :readonly="gridConfig.readonly"
      @drag-start="handleDragStart"
      @drag-move="handleDragMove"
      @drag-end="handleDragEnd"
      @resize-start="handleResizeStart"
      @resize-move="handleResizeMove"
      @resize-end="handleResizeEnd"
      @click="handleItemClick"
      @dblclick="handleItemDblclick"
    >
      <template #default="{ item }">
        <slot :item="item" />
      </template>
    </OptimizedGridItem>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue'
import OptimizedGridItem from './OptimizedGridItem.vue'
import { checkCollisions, findValidPosition, constrainItemToBounds, isItemsOverlapping } from './utils'
import type { 
  GridItem as GridItemType,
  DraggableResizableGridProps,
  DraggableResizableGridEmits,
  DragEvent,
  ResizeEvent,
  GridConfig,
  GridCalculation
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
const containerWidth = ref(1200)

// 响应式网格项数据
const items = ref<GridItemType[]>([...props.items])

// 合并网格配置
const gridConfig = reactive<GridConfig>({
  ...DEFAULT_GRID_CONFIG,
  ...props.config
})

// 监听props变化
watch(() => props.items, (newItems) => {
  items.value = [...newItems]
}, { deep: true })

watch(() => props.config, (newConfig) => {
  Object.assign(gridConfig, { ...DEFAULT_GRID_CONFIG, ...newConfig })
}, { deep: true })

// 发射布局变化事件 - 使用防抖优化性能
const debouncedLayoutChange = debounce((newItems: GridItemType[]) => {
  emit('layout-change', [...newItems])
}, 100)

watch(items, (newItems) => {
  debouncedLayoutChange(newItems)
}, { deep: true })

// 计算列宽
const colWidth = computed(() => {
  const totalGap = (gridConfig.columns - 1) * gridConfig.gap
  return (containerWidth.value - totalGap) / gridConfig.columns
})

// 计算总行数
const totalRows = computed(() => {
  if (items.value.length === 0) return gridConfig.minRows || 3
  const maxRow = Math.max(...items.value.map(item => item.gridRow + item.gridRowSpan - 1))
  return Math.max(maxRow, gridConfig.minRows || 3)
})

// 计算容器高度
const containerHeight = computed(() => {
  const calculatedHeight = totalRows.value * gridConfig.rowHeight + (totalRows.value - 1) * gridConfig.gap
  return Math.max(calculatedHeight, gridConfig.minHeight || 0)
})

// 网格样式计算
const gridCalculation = computed<GridCalculation>(() => {
  const gridStyle: Record<string, any> = {
    position: 'relative',
    width: '100%',
    height: `${containerHeight.value}px`,
    minHeight: `${gridConfig.minHeight || 0}px`,
    overflow: 'hidden'
  }
  
  // 添加网格背景
  if (gridConfig.showGrid) {
    const gridSize = `${colWidth.value + gridConfig.gap}px ${gridConfig.rowHeight + gridConfig.gap}px`
    const gridImage = `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `
    Object.assign(gridStyle, {
      backgroundImage: gridImage,
      backgroundSize: gridSize,
      backgroundPosition: '0 0'
    })
  }
  
  return {
    gridStyle,
    itemStyle: {},
    totalRows: totalRows.value,
    containerHeight: containerHeight.value
  }
})

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const currentDragItem = ref<GridItemType | null>(null)
const currentResizeItem = ref<GridItemType | null>(null)

// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }) as T
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

// 拖拽开始处理
const handleDragStart = (item: GridItemType, event: MouseEvent) => {
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

// 拖拽移动处理 - 使用节流优化性能
const handleDragMove = throttle((item: GridItemType, event: MouseEvent) => {
  if (!isDragging.value || !currentDragItem.value) return
  
  // 更新当前拖拽项的位置
  const itemIndex = items.value.findIndex(i => i.id === item.id)
  if (itemIndex !== -1) {
    items.value[itemIndex] = { ...items.value[itemIndex], gridCol: item.gridCol, gridRow: item.gridRow }
  }
  
  const dragEvent: DragEvent = {
    item,
    oldPosition: { col: currentDragItem.value.gridCol, row: currentDragItem.value.gridRow },
    newPosition: { col: item.gridCol, row: item.gridRow },
    event
  }
  
  // 碰撞检测（可选，根据性能需求决定是否启用）
  if (gridConfig.collision !== 'allow') {
    const collisionResult = checkCollisions(item, items.value)
    if (collisionResult.hasCollision) {
      emit('collision', item, collisionResult.collisions)
      
      // 根据碰撞策略处理
      switch (gridConfig.collision) {
        case 'block':
          // 阻止移动，恢复原位置
          if (itemIndex !== -1) {
            items.value[itemIndex] = { ...items.value[itemIndex], gridCol: currentDragItem.value.gridCol, gridRow: currentDragItem.value.gridRow }
          }
          return
        case 'push':
          // TODO: 实现推挤逻辑
          break
        case 'swap':
          // TODO: 实现交换逻辑
          break
      }
    }
  }
  
  emit('drag-move', dragEvent)
}, 16) // 约60fps

// 拖拽结束处理
const handleDragEnd = (item: GridItemType, event: MouseEvent) => {
  if (!isDragging.value || !currentDragItem.value) return
  
  // 边界约束
  let constrainedItem = constrainItemToBounds(item, gridConfig)
  
  // 更新项目位置
  const itemIndex = items.value.findIndex(i => i.id === item.id)
  if (itemIndex !== -1) {
    items.value[itemIndex] = { ...items.value[itemIndex], ...constrainedItem }
  }
  
  // 自动排列：检查并解决重叠问题
  autoArrangeItems()
  
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
const handleResizeStart = (item: GridItemType, event: MouseEvent) => {
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

// 调整大小移动处理 - 使用节流优化性能
const handleResizeMove = throttle((item: GridItemType, event: MouseEvent) => {
  if (!isResizing.value || !currentResizeItem.value) return
  
  // 更新当前调整大小项的尺寸和位置
  const itemIndex = items.value.findIndex(i => i.id === item.id)
  if (itemIndex !== -1) {
    items.value[itemIndex] = { 
      ...items.value[itemIndex], 
      gridCol: item.gridCol,
      gridRow: item.gridRow,
      gridColSpan: item.gridColSpan, 
      gridRowSpan: item.gridRowSpan 
    }
  }
  
  const resizeEvent: ResizeEvent = {
    item,
    oldSize: { colSpan: currentResizeItem.value.gridColSpan, rowSpan: currentResizeItem.value.gridRowSpan },
    newSize: { colSpan: item.gridColSpan, rowSpan: item.gridRowSpan },
    event
  }
  
  emit('resize-move', resizeEvent)
}, 16) // 约60fps

// 调整大小结束处理
const handleResizeEnd = (item: GridItemType, event: MouseEvent) => {
  if (!isResizing.value || !currentResizeItem.value) return
  
  // 边界约束
  let constrainedItem = constrainItemToBounds(item, gridConfig)
  
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
  
  // 自动排列：检查并解决重叠问题
  autoArrangeItems()
  
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

// 自动排列函数：解决重叠问题
const autoArrangeItems = () => {
  if (gridConfig.collision === 'allow') return // 如果允许重叠，则不进行自动排列
  
  const arrangedItems = [...items.value]
  let hasChanges = false
  
  // 检查每个项目是否与其他项目重叠
  for (let i = 0; i < arrangedItems.length; i++) {
    const currentItem = arrangedItems[i]
    
    // 检查与其他项目的重叠
    for (let j = i + 1; j < arrangedItems.length; j++) {
      const otherItem = arrangedItems[j]
      
      if (isItemsOverlapping(currentItem, otherItem)) {
        // 为重叠的项目寻找新位置
        const newPosition = findValidPosition(otherItem, arrangedItems.slice(0, j), gridConfig)
        
        if (newPosition) {
          arrangedItems[j] = {
            ...otherItem,
            gridCol: newPosition.col,
            gridRow: newPosition.row
          }
          hasChanges = true
        }
      }
    }
  }
  
  // 如果有变化，更新items
  if (hasChanges) {
    items.value = arrangedItems
  }
}

// 容器尺寸监听
const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth || 1200
    
    // 监听容器尺寸变化
    resizeObserver.value = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    
    resizeObserver.value.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver.value && containerRef.value) {
    resizeObserver.value.unobserve(containerRef.value)
  }
})

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
  }
})
</script>

<style scoped>
.optimized-draggable-grid {
  user-select: none;
  box-sizing: border-box;
  /* 启用硬件加速 */
  transform: translateZ(0);
  will-change: auto;
}

/* 拖拽状态样式 */
.optimized-draggable-grid.dragging {
  cursor: grabbing;
}

.optimized-draggable-grid.resizing {
  cursor: nw-resize;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .optimized-draggable-grid {
    /* 移动端优化 */
    touch-action: none;
  }
}

@media (max-width: 480px) {
  .optimized-draggable-grid {
    /* 小屏幕优化 */
    overflow-x: auto;
  }
}
</style>