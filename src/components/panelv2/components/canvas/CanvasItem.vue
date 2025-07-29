<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { CanvasItem, Position, Size } from '../../types'
import { getComponentById } from '../../mock/mockData'

interface Props {
  /** 画布项目数据 */
  item: CanvasItem
  /** 是否被选中 */
  isSelected: boolean
  /** 是否为编辑模式 */
  isEditMode: boolean
  /** 网格配置 */
  grid: {
    enabled: boolean
    size: number
    snap: boolean
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select': [item: CanvasItem]
  'update': [id: string, updates: Partial<CanvasItem>]
  'remove': [id: string]
}>()

// Refs
const itemRef = ref<HTMLElement>()

// Drag state
const dragState = ref({
  isDragging: false,
  startPosition: { x: 0, y: 0 },
  startItemPosition: { x: 0, y: 0 },
  isResizing: false,
  resizeDirection: ''
})

// Computed properties
const componentInfo = computed(() => {
  return getComponentById(props.item.type)
})

const itemStyle = computed(() => ({
  left: props.item.position.x + 'px',
  top: props.item.position.y + 'px',
  width: props.item.size.width + 'px',
  height: props.item.size.height + 'px',
  zIndex: props.item.zIndex || 1
}))

const itemClasses = computed(() => [
  'canvas-item',
  {
    'selected': props.isSelected && props.isEditMode,
    'dragging': dragState.value.isDragging,
    'edit-mode': props.isEditMode,
    'locked': props.item.locked,
    'hidden': props.item.hidden
  }
])

// Position helpers
const snapToGrid = (position: Position): Position => {
  if (!props.grid.snap || !props.grid.enabled) return position
  
  const { size } = props.grid
  return {
    x: Math.round(position.x / size) * size,
    y: Math.round(position.y / size) * size
  }
}

const constrainToCanvas = (position: Position, size: Size): Position => {
  return {
    x: Math.max(0, Math.min(position.x, 1200 - size.width)), // TODO: Use actual canvas size
    y: Math.max(0, Math.min(position.y, 800 - size.height))
  }
}

// Event handlers
const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  
  if (props.isEditMode && !props.item.locked) {
    emit('select', props.item)
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (!props.isEditMode || props.item.locked) return
  
  // Only handle left mouse button
  if (event.button !== 0) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // Select the item if not already selected
  if (!props.isSelected) {
    emit('select', props.item)
  }
  
  // Start dragging
  const rect = itemRef.value?.getBoundingClientRect()
  if (!rect) return
  
  dragState.value = {
    isDragging: true,
    startPosition: { x: event.clientX, y: event.clientY },
    startItemPosition: { ...props.item.position },
    isResizing: false,
    resizeDirection: ''
  }
  
  // Add global mouse listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // Add dragging class for visual feedback
  document.body.style.cursor = 'grabbing'
}

const handleMouseMove = (event: MouseEvent) => {
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  
  const deltaX = event.clientX - dragState.value.startPosition.x
  const deltaY = event.clientY - dragState.value.startPosition.y
  
  const newPosition = {
    x: dragState.value.startItemPosition.x + deltaX,
    y: dragState.value.startItemPosition.y + deltaY
  }
  
  // Apply constraints
  const constrainedPosition = constrainToCanvas(newPosition, props.item.size)
  const snappedPosition = snapToGrid(constrainedPosition)
  
  // Update position
  emit('update', props.item.id, {
    position: snappedPosition
  })
}

const handleMouseUp = () => {
  if (dragState.value.isDragging) {
    dragState.value.isDragging = false
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    // Reset cursor
    document.body.style.cursor = ''
  }
}

const handleDoubleClick = (event: MouseEvent) => {
  if (!props.isEditMode || props.item.locked) return
  
  event.stopPropagation()
  
  // TODO: Enter inline editing mode for title or content
  console.log('Double clicked item:', props.item.id)
}

const handleRemove = (event: MouseEvent) => {
  event.stopPropagation()
  emit('remove', props.item.id)
}

// Resize handlers (for future implementation)
const handleResizeStart = (direction: string, event: MouseEvent) => {
  if (!props.isEditMode || props.item.locked) return
  
  event.preventDefault()
  event.stopPropagation()
  
  console.log('Resize start:', direction)
  // TODO: Implement resize functionality
}

// Cleanup on unmount
const cleanup = () => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = ''
}

// Expose cleanup for parent component
defineExpose({ cleanup })
</script>

<template>
  <div
    ref="itemRef"
    :class="itemClasses"
    :style="itemStyle"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <!-- Selection indicators -->
    <div
      v-if="isSelected && isEditMode"
      class="selection-outline absolute inset-0 border-2 border-blue-500 pointer-events-none"
    />
    
    <!-- Resize handles (only when selected and in edit mode) -->
    <template v-if="isSelected && isEditMode && !item.locked">
      <!-- Corner handles -->
      <div 
        class="resize-handle corner top-left"
        @mousedown="handleResizeStart('nw', $event)"
      />
      <div 
        class="resize-handle corner top-right"
        @mousedown="handleResizeStart('ne', $event)"
      />
      <div 
        class="resize-handle corner bottom-left"
        @mousedown="handleResizeStart('sw', $event)"
      />
      <div 
        class="resize-handle corner bottom-right"
        @mousedown="handleResizeStart('se', $event)"
      />
      
      <!-- Edge handles -->
      <div 
        class="resize-handle edge top"
        @mousedown="handleResizeStart('n', $event)"
      />
      <div 
        class="resize-handle edge right"
        @mousedown="handleResizeStart('e', $event)"
      />
      <div 
        class="resize-handle edge bottom"
        @mousedown="handleResizeStart('s', $event)"
      />
      <div 
        class="resize-handle edge left"
        @mousedown="handleResizeStart('w', $event)"
      />
    </template>
    
    <!-- Remove button -->
    <button
      v-if="isEditMode && !item.locked"
      class="remove-button absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
      @click="handleRemove"
    >
      ×
    </button>
    
    <!-- Lock indicator -->
    <div
      v-if="item.locked"
      class="lock-indicator absolute top-1 right-1 w-4 h-4 bg-gray-500 text-white rounded-sm flex items-center justify-center text-xs"
    >
      <SvgIcon icon="material-symbols:lock" class="w-3 h-3" />
    </div>
    
    <!-- Item content -->
    <div class="item-content h-full flex flex-col p-3">
      <!-- Header with icon and title -->
      <div class="item-header flex items-center space-x-2 mb-2 flex-shrink-0">
        <div 
          v-if="componentInfo"
          class="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
          :style="{ backgroundColor: componentInfo.color }"
        >
          <SvgIcon :icon="componentInfo.icon" class="w-3 h-3" />
        </div>
        <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
          {{ item.title || componentInfo?.name || item.type }}
        </span>
      </div>
      
      <!-- Content area -->
      <div class="item-body flex-1 bg-gray-50 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ item.type }} 组件内容
        </span>
      </div>
      
      <!-- Footer (optional) -->
      <div 
        v-if="isEditMode && isSelected"
        class="item-footer mt-2 text-xs text-gray-400 text-center"
      >
        {{ item.size.width }} × {{ item.size.height }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-item {
  @apply absolute bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200;
  @apply dark:bg-gray-800 dark:border-gray-600;
  user-select: none;
}

.canvas-item.edit-mode {
  @apply cursor-move hover:shadow-md;
}

.canvas-item.selected {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

.canvas-item.dragging {
  @apply shadow-lg z-50;
  opacity: 0.8;
}

.canvas-item.locked {
  @apply cursor-not-allowed opacity-75;
}

.canvas-item.hidden {
  @apply opacity-30;
}

/* Selection outline */
.selection-outline {
  border-radius: inherit;
}

/* Resize handles */
.resize-handle {
  @apply absolute bg-blue-500 border border-white;
  width: 8px;
  height: 8px;
}

.resize-handle.corner {
  @apply rounded-full;
}

.resize-handle.corner.top-left {
  @apply -top-1 -left-1 cursor-nw-resize;
}

.resize-handle.corner.top-right {
  @apply -top-1 -right-1 cursor-ne-resize;
}

.resize-handle.corner.bottom-left {
  @apply -bottom-1 -left-1 cursor-sw-resize;
}

.resize-handle.corner.bottom-right {
  @apply -bottom-1 -right-1 cursor-se-resize;
}

.resize-handle.edge {
  @apply rounded-sm;
}

.resize-handle.edge.top {
  @apply -top-1 left-1/2 transform -translate-x-1/2 cursor-n-resize;
}

.resize-handle.edge.right {
  @apply -right-1 top-1/2 transform -translate-y-1/2 cursor-e-resize;
}

.resize-handle.edge.bottom {
  @apply -bottom-1 left-1/2 transform -translate-x-1/2 cursor-s-resize;
}

.resize-handle.edge.left {
  @apply -left-1 top-1/2 transform -translate-y-1/2 cursor-w-resize;
}

/* Remove button */
.remove-button {
  @apply shadow-sm;
}

.remove-button:hover {
  @apply scale-110;
}

/* Lock indicator */
.lock-indicator {
  @apply shadow-sm;
}

/* Item content */
.item-content {
  height: 100%;
  pointer-events: none; /* Prevent interference with drag events */
}

.item-header {
  pointer-events: auto; /* Allow clicking on header elements */
}
</style>