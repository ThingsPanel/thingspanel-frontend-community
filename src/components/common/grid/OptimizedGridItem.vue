<!--
  OptimizedGridItem - 优化版网格项组件
  解决性能问题，提供更流畅的拖拽和缩放体验
-->
<template>
  <div
    ref="itemRef"
    class="optimized-grid-item"
    :class="itemClasses"
    :style="itemStyles"
    @mousedown="handleMouseDown"
    @click="handleClick"
    @dblclick="handleDblclick"
  >
    <!-- 内容区域 -->
    <div class="grid-item-content" :style="contentStyle">
      <!-- 渲染自定义组件 -->
      <component 
        :is="item.component"
        v-if="item.component"
        v-bind="item.props || {}"
      />
      
      <!-- 默认内容插槽 -->
      <slot v-else :item="item">
        <div class="default-content">
          <div class="item-id">{{ item.id }}</div>
          <div class="item-position">
            {{ item.gridCol }},{{ item.gridRow }}
          </div>
          <div class="item-size">
            {{ item.gridColSpan }}×{{ item.gridRowSpan }}
          </div>
        </div>
      </slot>
      
      <!-- 锁定图标 -->
      <div v-if="item.locked" class="lock-icon">
        🔒
      </div>
    </div>

    <!-- 调整大小控制点 -->
    <template v-if="!readonly && item.resizable !== false && !item.locked">
      <div 
        v-for="handle in resizeHandles" 
        :key="handle.name"
        :class="['resize-handle', `handle-${handle.name}`]"
        :style="handle.style"
        @mousedown.stop="handleResizeStart($event, handle.name)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { GridItem, GridConfig } from './types'
import { 
  getItemPixelPosition, 
  getItemPixelSize, 
  calculateColWidth,
  pixelToGrid,
  constrainItemToBounds
} from './utils'

// Props
interface Props {
  item: GridItem
  config: GridConfig
  containerWidth: number
  style?: Record<string, any>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  style: () => ({}),
  readonly: false
})

// Emits
interface Emits {
  (e: 'drag-start', item: GridItem, event: MouseEvent): void
  (e: 'drag-move', item: GridItem, event: MouseEvent): void
  (e: 'drag-end', item: GridItem, event: MouseEvent): void
  (e: 'resize-start', item: GridItem, event: MouseEvent): void
  (e: 'resize-move', item: GridItem, event: MouseEvent): void
  (e: 'resize-end', item: GridItem, event: MouseEvent): void
  (e: 'click', item: GridItem, event: MouseEvent): void
  (e: 'dblclick', item: GridItem, event: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 引用
const itemRef = ref<HTMLElement>()

// 状态
const isDragging = ref(false)
const isResizing = ref(false)
const currentResizeHandle = ref<string>('')
const dragStartPos = ref({ x: 0, y: 0 })
const itemStartPos = ref({ x: 0, y: 0 })
const itemStartSize = ref({ width: 0, height: 0 })

// 计算属性
const colWidth = computed(() => 
  calculateColWidth(props.config, props.containerWidth)
)

const pixelPosition = computed(() => 
  getItemPixelPosition(props.item, props.config, props.containerWidth)
)

const pixelSize = computed(() => 
  getItemPixelSize(props.item, props.config, props.containerWidth)
)

const itemClasses = computed(() => ([
  'grid-item',
  {
    'dragging': isDragging.value,
    'resizing': isResizing.value,
    'locked': props.item.locked,
    'readonly': props.readonly,
    'no-drag': !props.item.draggable || props.item.locked,
    'no-resize': !props.item.resizable || props.item.locked
  }
]))

const itemStyles = computed(() => ({
  position: 'absolute',
  left: `${pixelPosition.value.x}px`,
  top: `${pixelPosition.value.y}px`,
  width: `${pixelSize.value.width}px`,
  height: `${pixelSize.value.height}px`,
  zIndex: props.item.zIndex || 1,
  transform: isDragging.value ? 'scale(1.02)' : 'scale(1)',
  transition: isDragging.value || isResizing.value ? 'none' : 'all 0.2s ease',
  ...props.style
}))

const contentStyle = computed(() => ({
  ...props.item.style
}))

// 调整大小控制点配置
const resizeHandles = computed(() => [
  { name: 'nw', style: { top: '-4px', left: '-4px', cursor: 'nw-resize' } },
  { name: 'n', style: { top: '-4px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
  { name: 'ne', style: { top: '-4px', right: '-4px', cursor: 'ne-resize' } },
  { name: 'e', style: { top: '50%', right: '-4px', transform: 'translateY(-50%)', cursor: 'e-resize' } },
  { name: 'se', style: { bottom: '-4px', right: '-4px', cursor: 'se-resize' } },
  { name: 's', style: { bottom: '-4px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
  { name: 'sw', style: { bottom: '-4px', left: '-4px', cursor: 'sw-resize' } },
  { name: 'w', style: { top: '50%', left: '-4px', transform: 'translateY(-50%)', cursor: 'w-resize' } }
])

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

// 鼠标按下处理（拖拽开始）
const handleMouseDown = (event: MouseEvent) => {
  if (props.readonly || props.item.locked || !props.item.draggable) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  itemStartPos.value = { ...pixelPosition.value }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
  
  emit('drag-start', props.item, event)
}

// 鼠标移动处理（拖拽中）- 使用节流优化性能
const handleMouseMove = throttle((event: MouseEvent) => {
  if (isDragging.value) {
    handleDragMove(event)
  } else if (isResizing.value) {
    handleResizeMove(event)
  }
}, 16) // 约60fps

// 拖拽移动
const handleDragMove = (event: MouseEvent) => {
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  const newX = itemStartPos.value.x + deltaX
  const newY = itemStartPos.value.y + deltaY
  
  // 转换为网格坐标
  const newCol = pixelToGrid(newX, colWidth.value, props.config.gap)
  const newRow = pixelToGrid(newY, props.config.rowHeight, props.config.gap)
  
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: Math.max(1, newCol),
    gridRow: Math.max(1, newRow)
  }
  
  emit('drag-move', updatedItem, event)
}

// 鼠标释放处理（拖拽结束）
const handleMouseUp = (event: MouseEvent) => {
  if (isDragging.value) {
    handleDragEnd(event)
  } else if (isResizing.value) {
    handleResizeEnd(event)
  }
  
  // 清理
  isDragging.value = false
  isResizing.value = false
  currentResizeHandle.value = ''
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// 拖拽结束
const handleDragEnd = (event: MouseEvent) => {
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  const newX = itemStartPos.value.x + deltaX
  const newY = itemStartPos.value.y + deltaY
  
  // 转换为网格坐标并约束边界
  const newCol = pixelToGrid(newX, colWidth.value, props.config.gap)
  const newRow = pixelToGrid(newY, props.config.rowHeight, props.config.gap)
  
  let updatedItem: GridItem = {
    ...props.item,
    gridCol: Math.max(1, newCol),
    gridRow: Math.max(1, newRow)
  }
  
  // 边界约束
  updatedItem = constrainItemToBounds(updatedItem, props.config)
  
  emit('drag-end', updatedItem, event)
}

// 调整大小开始
const handleResizeStart = (event: MouseEvent, handle: string) => {
  if (props.readonly || props.item.locked || !props.item.resizable) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  currentResizeHandle.value = handle
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  itemStartPos.value = { ...pixelPosition.value }
  itemStartSize.value = { ...pixelSize.value }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.userSelect = 'none'
  
  emit('resize-start', props.item, event)
}

// 调整大小移动
const handleResizeMove = (event: MouseEvent) => {
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  let newX = itemStartPos.value.x
  let newY = itemStartPos.value.y
  let newWidth = itemStartSize.value.width
  let newHeight = itemStartSize.value.height
  
  // 根据控制点调整位置和尺寸
  const handle = currentResizeHandle.value
  
  if (handle.includes('n')) {
    newY = itemStartPos.value.y + deltaY
    newHeight = itemStartSize.value.height - deltaY
  }
  if (handle.includes('s')) {
    newHeight = itemStartSize.value.height + deltaY
  }
  if (handle.includes('w')) {
    newX = itemStartPos.value.x + deltaX
    newWidth = itemStartSize.value.width - deltaX
  }
  if (handle.includes('e')) {
    newWidth = itemStartSize.value.width + deltaX
  }
  
  // 最小尺寸约束
  const minWidth = (props.item.minColSpan || 1) * colWidth.value + ((props.item.minColSpan || 1) - 1) * props.config.gap
  const minHeight = (props.item.minRowSpan || 1) * props.config.rowHeight + ((props.item.minRowSpan || 1) - 1) * props.config.gap
  
  newWidth = Math.max(minWidth, newWidth)
  newHeight = Math.max(minHeight, newHeight)
  
  // 转换为网格坐标
  const newCol = pixelToGrid(newX, colWidth.value, props.config.gap)
  const newRow = pixelToGrid(newY, props.config.rowHeight, props.config.gap)
  const newColSpan = Math.max(1, Math.round(newWidth / (colWidth.value + props.config.gap)))
  const newRowSpan = Math.max(1, Math.round(newHeight / (props.config.rowHeight + props.config.gap)))
  
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: Math.max(1, newCol),
    gridRow: Math.max(1, newRow),
    gridColSpan: newColSpan,
    gridRowSpan: newRowSpan
  }
  
  emit('resize-move', updatedItem, event)
}

// 调整大小结束
const handleResizeEnd = (event: MouseEvent) => {
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  let newX = itemStartPos.value.x
  let newY = itemStartPos.value.y
  let newWidth = itemStartSize.value.width
  let newHeight = itemStartSize.value.height
  
  // 根据控制点调整位置和尺寸
  const handle = currentResizeHandle.value
  
  if (handle.includes('n')) {
    newY = itemStartPos.value.y + deltaY
    newHeight = itemStartSize.value.height - deltaY
  }
  if (handle.includes('s')) {
    newHeight = itemStartSize.value.height + deltaY
  }
  if (handle.includes('w')) {
    newX = itemStartPos.value.x + deltaX
    newWidth = itemStartSize.value.width - deltaX
  }
  if (handle.includes('e')) {
    newWidth = itemStartSize.value.width + deltaX
  }
  
  // 最小/最大尺寸约束
  const minWidth = (props.item.minColSpan || 1) * colWidth.value + ((props.item.minColSpan || 1) - 1) * props.config.gap
  const minHeight = (props.item.minRowSpan || 1) * props.config.rowHeight + ((props.item.minRowSpan || 1) - 1) * props.config.gap
  const maxWidth = (props.item.maxColSpan || props.config.columns) * colWidth.value + ((props.item.maxColSpan || props.config.columns) - 1) * props.config.gap
  const maxHeight = (props.item.maxRowSpan || 20) * props.config.rowHeight + ((props.item.maxRowSpan || 20) - 1) * props.config.gap
  
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
  
  // 转换为网格坐标并约束边界
  const newCol = pixelToGrid(newX, colWidth.value, props.config.gap)
  const newRow = pixelToGrid(newY, props.config.rowHeight, props.config.gap)
  const newColSpan = Math.max(1, Math.round(newWidth / (colWidth.value + props.config.gap)))
  const newRowSpan = Math.max(1, Math.round(newHeight / (props.config.rowHeight + props.config.gap)))
  
  let updatedItem: GridItem = {
    ...props.item,
    gridCol: Math.max(1, newCol),
    gridRow: Math.max(1, newRow),
    gridColSpan: newColSpan,
    gridRowSpan: newRowSpan
  }
  
  // 边界约束
  updatedItem = constrainItemToBounds(updatedItem, props.config)
  
  emit('resize-end', updatedItem, event)
}

// 点击事件
const handleClick = (event: MouseEvent) => {
  if (!isDragging.value && !isResizing.value) {
    emit('click', props.item, event)
  }
}

// 双击事件
const handleDblclick = (event: MouseEvent) => {
  if (!isDragging.value && !isResizing.value) {
    emit('dblclick', props.item, event)
  }
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.optimized-grid-item {
  box-sizing: border-box;
  user-select: none;
  will-change: transform;
}

.grid-item-content {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: var(--n-card-color, #ffffff);
  border: 1px solid var(--n-border-color, #e0e0e6);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.grid-item-content:hover {
  border-color: var(--n-primary-color, #18a058);
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.15);
}

.grid-item.dragging .grid-item-content {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--n-primary-color, #18a058);
}

.grid-item.resizing .grid-item-content {
  border-color: var(--n-warning-color, #f0a020);
}

.grid-item.locked .grid-item-content {
  border-color: #f56565;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(245, 101, 101, 0.1) 10px,
    rgba(245, 101, 101, 0.1) 20px
  );
}

.grid-item.readonly .grid-item-content {
  pointer-events: none;
  opacity: 0.8;
}

.grid-item.no-drag {
  cursor: default;
}

.grid-item:not(.no-drag):not(.readonly):not(.locked) {
  cursor: grab;
}

.grid-item.dragging {
  cursor: grabbing;
  z-index: 1000;
}

.default-content {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  color: var(--n-text-color-2, #666);
  line-height: 1.4;
}

.item-id {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--n-text-color, #333);
}

.item-position {
  color: var(--n-primary-color, #18a058);
  margin-bottom: 2px;
}

.item-size {
  color: var(--n-text-color-3, #999);
}

.lock-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  opacity: 0.7;
}

/* 调整大小控制点 */
.resize-handle {
  position: absolute;
  background: var(--n-primary-color, #18a058);
  border: 1px solid #fff;
  border-radius: 2px;
  width: 8px;
  height: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.grid-item:hover .resize-handle,
.grid-item.resizing .resize-handle {
  opacity: 1;
}

.resize-handle:hover {
  background: var(--n-primary-color-hover, #36ad6a);
  transform: scale(1.2);
}

/* 暗色主题支持 */
.dark .grid-item-content {
  background: var(--n-card-color, #2d2d2d);
  border-color: var(--n-border-color, #404040);
  color: var(--n-text-color, #ffffff);
}

.dark .grid-item-content:hover {
  border-color: var(--n-primary-color, #63e2b7);
  box-shadow: 0 2px 8px rgba(99, 226, 183, 0.15);
}
</style>