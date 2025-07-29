<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import CanvasItem from './CanvasItem.vue'
import type { CanvasItem as CanvasItemType, Position, Size, DragState } from '../../types'

interface Props {
  /** 画布项目列表 */
  items: CanvasItemType[]
  /** 选中的项目ID列表 */
  selectedIds: string[]
  /** 是否为编辑模式 */
  isEditMode: boolean
  /** 画布尺寸 */
  canvasSize?: Size
  /** 网格配置 */
  grid?: {
    enabled: boolean
    size: number
    snap: boolean
  }
  /** 是否正在拖拽 */
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canvasSize: () => ({ width: 1200, height: 800 }),
  grid: () => ({ enabled: true, size: 10, snap: true }),
  isDragging: false
})

const emit = defineEmits<{
  'item-select': [ids: string[]]
  'item-update': [id: string, updates: Partial<CanvasItemType>]
  'item-remove': [id: string]
  'item-add': [item: CanvasItemType]
  'drag-over': [event: DragEvent]
  'drop': [event: DragEvent]
}>()

// Canvas reference
const canvasRef = ref<HTMLElement>()

// Drag and drop state
const dragState = reactive<DragState>({
  isDragging: false,
  dragData: null,
  dragType: 'component'
})

// Selection state
const selectionState = reactive({
  isSelecting: false,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 }
})

// Computed properties
const selectionBox = computed(() => {
  if (!selectionState.isSelecting) return null
  
  const start = selectionState.startPosition
  const current = selectionState.currentPosition
  
  return {
    left: Math.min(start.x, current.x),
    top: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y)
  }
})

const canvasStyle = computed(() => ({
  width: props.canvasSize.width + 'px',
  height: props.canvasSize.height + 'px',
  backgroundImage: props.grid.enabled ? 
    `radial-gradient(circle, #d1d5db 1px, transparent 1px)` : 'none',
  backgroundSize: props.grid.enabled ? 
    `${props.grid.size}px ${props.grid.size}px` : 'auto'
}))

// Position helpers
const snapToGrid = (position: Position): Position => {
  if (!props.grid.snap || !props.grid.enabled) return position
  
  const { size } = props.grid
  return {
    x: Math.round(position.x / size) * size,
    y: Math.round(position.y / size) * size
  }
}

const getRelativePosition = (event: MouseEvent): Position => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

// Canvas event handlers
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (!props.isEditMode) return
  
  // Only handle left mouse button
  if (event.button !== 0) return
  
  // Check if click is on empty space
  const target = event.target as HTMLElement
  if (!canvasRef.value?.contains(target) || target !== canvasRef.value) return
  
  event.preventDefault()
  
  // Start selection box
  const position = getRelativePosition(event)
  selectionState.isSelecting = true
  selectionState.startPosition = position
  selectionState.currentPosition = position
  
  // Clear current selection
  emit('item-select', [])
  
  // Add mouse move and up listeners
  document.addEventListener('mousemove', handleSelectionMouseMove)
  document.addEventListener('mouseup', handleSelectionMouseUp)
}

const handleSelectionMouseMove = (event: MouseEvent) => {
  if (!selectionState.isSelecting) return
  
  event.preventDefault()
  selectionState.currentPosition = getRelativePosition(event)
  
  // Check for items within selection box
  if (selectionBox.value) {
    const selectedIds = getItemsInSelectionBox(selectionBox.value)
    emit('item-select', selectedIds)
  }
}

const handleSelectionMouseUp = () => {
  selectionState.isSelecting = false
  
  // Remove listeners
  document.removeEventListener('mousemove', handleSelectionMouseMove)
  document.removeEventListener('mouseup', handleSelectionMouseUp)
}

const getItemsInSelectionBox = (box: { left: number, top: number, width: number, height: number }) => {
  return props.items
    .filter(item => {
      const itemRight = item.position.x + item.size.width
      const itemBottom = item.position.y + item.size.height
      const boxRight = box.left + box.width
      const boxBottom = box.top + box.height
      
      // Check if item overlaps with selection box
      return !(item.position.x > boxRight || 
               itemRight < box.left || 
               item.position.y > boxBottom || 
               itemBottom < box.top)
    })
    .map(item => item.id)
}

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  if (!props.isEditMode) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
  emit('drag-over', event)
}

const handleDrop = (event: DragEvent) => {
  if (!props.isEditMode) return
  
  event.preventDefault()
  emit('drop', event)
}

// Item event handlers
const handleItemSelect = (item: CanvasItemType) => {
  if (!props.isEditMode) return
  
  emit('item-select', [item.id])
}

const handleItemUpdate = (id: string, updates: Partial<CanvasItemType>) => {
  // Snap position to grid if enabled
  if (updates.position) {
    updates.position = snapToGrid(updates.position)
  }
  
  emit('item-update', id, updates)
}

const handleItemRemove = (id: string) => {
  emit('item-remove', id)
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.isEditMode) return
  
  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      if (props.selectedIds.length > 0) {
        event.preventDefault()
        props.selectedIds.forEach(id => {
          emit('item-remove', id)
        })
      }
      break
    
    case 'Escape':
      event.preventDefault()
      emit('item-select', [])
      break
  }
}

// Focus management for keyboard events
const handleCanvasClick = () => {
  nextTick(() => {
    canvasRef.value?.focus()
  })
}
</script>

<template>
  <div 
    ref="canvasRef"
    class="canvas-container relative overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none"
    :class="{ 
      'cursor-crosshair': isEditMode && selectionState.isSelecting,
      'drag-over': isDragging 
    }"
    tabindex="0"
    @mousedown="handleCanvasMouseDown"
    @click="handleCanvasClick"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @keydown="handleKeyDown"
  >
    <!-- Canvas content area -->
    <div 
      class="canvas-content relative"
      :style="canvasStyle"
    >
      <!-- Grid overlay (optional visual grid) -->
      <div 
        v-if="grid.enabled"
        class="absolute inset-0 pointer-events-none opacity-20"
        :style="{
          backgroundImage: `
            linear-gradient(rgba(156, 163, 175, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${grid.size}px ${grid.size}px`
        }"
      />
      
      <!-- Canvas items -->
      <CanvasItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :is-selected="selectedIds.includes(item.id)"
        :is-edit-mode="isEditMode"
        :grid="grid"
        @select="handleItemSelect"
        @update="handleItemUpdate"
        @remove="handleItemRemove"
      />
      
      <!-- Selection box -->
      <div
        v-if="selectionBox && isEditMode"
        class="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
        :style="{
          left: selectionBox.left + 'px',
          top: selectionBox.top + 'px',
          width: selectionBox.width + 'px',
          height: selectionBox.height + 'px'
        }"
      />
      
      <!-- Empty state -->
      <div 
        v-if="items.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none"
      >
        <SvgIcon 
          :icon="isEditMode ? 'material-symbols:drag-pan' : 'material-symbols:empty-dashboard'" 
          class="w-16 h-16 mb-4" 
        />
        <p class="text-lg font-medium mb-2">
          {{ isEditMode ? '拖拽组件到这里' : '画布为空' }}
        </p>
        <p class="text-sm text-center max-w-xs">
          {{ isEditMode ? '从左侧组件库拖拽组件到画布开始设计，或使用工具栏添加测试组件' : '切换到编辑模式开始设计面板' }}
        </p>
      </div>
      
      <!-- Drag overlay -->
      <div 
        v-if="isDragging && isEditMode"
        class="absolute inset-0 bg-blue-50 dark:bg-blue-900 bg-opacity-50 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none"
      >
        <div class="text-blue-600 dark:text-blue-400 text-lg font-medium">
          松开鼠标放置组件
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  min-height: 400px;
}

.canvas-content {
  min-width: 100%;
  min-height: 100%;
}

.drag-over {
  background-color: rgba(59, 130, 246, 0.05);
}

/* Custom scrollbar */
.canvas-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.canvas-container::-webkit-scrollbar-track {
  background: rgba(156, 163, 175, 0.1);
  border-radius: 4px;
}

.canvas-container::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

.canvas-container::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>