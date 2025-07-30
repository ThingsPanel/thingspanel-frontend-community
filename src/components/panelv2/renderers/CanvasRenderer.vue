<!--
  Canvas Renderer Component
  自由画布渲染器，支持精确像素定位和高级交互
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { 
  BaseRenderer, 
  RendererConfig, 
  RendererCapabilities,
  RendererState,
  RendererEvents
} from '../types/renderer'
import type { BaseCanvasItem, Viewport, Position, Size } from '../types/core'
import { useCanvasStore } from '../store/canvasStore'
import eventBus from '../core/EventBus'

// Props
interface Props {
  config?: RendererConfig
  items?: BaseCanvasItem[]
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  items: () => ([]),
  readonly: false
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

// Store
const canvasStore = useCanvasStore()

// Refs
const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLElement>()

// Reactive state
const items = ref<BaseCanvasItem[]>([])
const selectedItems = ref<string[]>([])
const viewport = ref<Viewport>({ zoom: 1, offsetX: 0, offsetY: 0 })
const dragState = ref<{
  isDragging: boolean
  draggedItems: string[]
  startPosition: Position
  currentPosition: Position
} | null>(null)

// Renderer configuration
const rendererConfig = computed(() => ({
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  showGrid: true,
  gridSize: 10,
  snapToGrid: false,
  enableDrag: !props.readonly,
  enableResize: !props.readonly,
  enableSelect: true,
  enableMultiSelect: true,
  ...props.config
}))

// Renderer capabilities
const capabilities: RendererCapabilities = {
  supportsDrag: true,
  supportsResize: true,
  supportsRotate: true,
  supportsGrouping: true,
  supportsLayers: true,
  supportsSnapping: true,
  supportsPrecisePositioning: true,
  supportsCustomCoordinates: true,
  supportsZoom: true,
  supportsMultiSelect: true,
  supportsKeyboardShortcuts: true,
  supportsContextMenu: true,
  supportsUndo: true,
  supportsClipboard: true
}

// Renderer state
const state = computed<RendererState>(() => ({
  initialized: !!containerRef.value,
  readonly: props.readonly,
  selectedIds: selectedItems.value,
  viewport: viewport.value,
  draggedIds: dragState.value?.draggedItems || [],
  loading: false,
  error: null
}))

// Computed styles
const canvasStyle = computed(() => ({
  width: `${rendererConfig.value.width}px`,
  height: `${rendererConfig.value.height}px`,
  backgroundColor: rendererConfig.value.backgroundColor,
  transform: `scale(${viewport.value.zoom}) translate(${viewport.value.offsetX}px, ${viewport.value.offsetY}px)`,
  transformOrigin: '0 0',
  position: 'relative' as const,
  backgroundImage: rendererConfig.value.showGrid 
    ? `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`
    : 'none',
  backgroundSize: rendererConfig.value.showGrid 
    ? `${rendererConfig.value.gridSize}px ${rendererConfig.value.gridSize}px`
    : 'auto'
}))

// Renderer implementation class
class CanvasRendererImpl implements BaseRenderer {
  readonly id = 'canvas'
  readonly name = 'Canvas Renderer'
  readonly version = '1.0.0'
  readonly capabilities = capabilities
  
  get state() { return state.value }
  get config() { return rendererConfig.value }

  async initialize(container: HTMLElement, config: RendererConfig): Promise<void> {
    containerRef.value = container
    await nextTick()
    emit('ready')
  }

  async destroy(): Promise<void> {
    items.value = []
    selectedItems.value = []
    dragState.value = null
  }

  resize(width: number, height: number): void {
    if (containerRef.value) {
      containerRef.value.style.width = `${width}px`
      containerRef.value.style.height = `${height}px`
    }
  }

  setData(canvasItems: BaseCanvasItem[]): void {
    items.value = [...canvasItems]
  }

  getData(): BaseCanvasItem[] {
    return [...items.value]
  }

  addItem(item: BaseCanvasItem): void {
    items.value.push(item)
    emit('item-add', item)
  }

  removeItem(id: string): void {
    items.value = items.value.filter(item => item.id !== id)
    selectedItems.value = selectedItems.value.filter(selectedId => selectedId !== id)
    emit('item-remove', [id])
  }

  updateItem(id: string, updates: Partial<BaseCanvasItem>): void {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = {
        ...items.value[index],
        ...updates,
        metadata: {
          ...items.value[index].metadata,
          updatedAt: Date.now()
        }
      }
      emit('item-update', id, updates)
    }
  }

  render(): void {
    // Vue reactivity handles rendering
  }

  refresh(): void {
    this.setData(props.items)
  }

  clear(): void {
    items.value = []
    selectedItems.value = []
  }

  setViewport(newViewport: Viewport): void {
    viewport.value = { ...newViewport }
    emit('viewport-change', viewport.value)
  }

  getViewport(): Viewport {
    return { ...viewport.value }
  }

  fitToContent(): void {
    if (items.value.length === 0) return

    const bounds = this.calculateContentBounds()
    const containerWidth = containerRef.value?.clientWidth || 800
    const containerHeight = containerRef.value?.clientHeight || 600

    const scaleX = containerWidth / bounds.width
    const scaleY = containerHeight / bounds.height
    const scale = Math.min(scaleX, scaleY, 1) * 0.9 // 90% to add padding

    viewport.value = {
      zoom: scale,
      offsetX: (containerWidth - bounds.width * scale) / 2 - bounds.minX * scale,
      offsetY: (containerHeight - bounds.height * scale) / 2 - bounds.minY * scale
    }
    
    emit('viewport-change', viewport.value)
  }

  centerView(): void {
    const containerWidth = containerRef.value?.clientWidth || 800
    const containerHeight = containerRef.value?.clientHeight || 600
    
    viewport.value = {
      zoom: 1,
      offsetX: (containerWidth - rendererConfig.value.width) / 2,
      offsetY: (containerHeight - rendererConfig.value.height) / 2
    }
    
    emit('viewport-change', viewport.value)
  }

  enableEdit(): void {
    // Handled by reactive config
  }

  disableEdit(): void {
    // Handled by reactive config
  }

  setReadonly(readonly: boolean): void {
    // Handled by props
  }

  selectItems(ids: string[]): void {
    selectedItems.value = [...ids]
    emit('item-select', ids)
  }

  clearSelection(): void {
    selectedItems.value = []
    emit('item-select', [])
  }

  getSelection(): string[] {
    return [...selectedItems.value]
  }

  on<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void {
    // Event handling through Vue emits and event bus
  }

  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void {
    // Event handling through Vue emits and event bus
  }

  emit<K extends keyof RendererEvents>(event: K, ...args: Parameters<RendererEvents[K]>): void {
    // Event handling through Vue emits and event bus
  }

  updateConfig(config: Partial<RendererConfig>): void {
    Object.assign(rendererConfig.value, config)
  }

  getConfig(): RendererConfig {
    return rendererConfig.value
  }

  hitTest(position: Position): string | null {
    const adjustedPos = this.screenToCanvas(position)
    
    // 从上到下检测（高zIndex优先）
    const sortedItems = [...items.value].sort((a, b) => b.zIndex - a.zIndex)
    
    for (const item of sortedItems) {
      if (this.isPointInItem(adjustedPos, item)) {
        return item.id
      }
    }
    
    return null
  }

  getBounds(id: string): { position: Position, size: Size } | null {
    const item = items.value.find(item => item.id === id)
    if (!item) return null
    
    return {
      position: { ...item.position },
      size: { ...item.size }
    }
  }

  isVisible(id: string): boolean {
    const item = items.value.find(item => item.id === id)
    return item?.visible ?? false
  }

  // Helper methods
  private calculateContentBounds() {
    if (items.value.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    items.value.forEach(item => {
      minX = Math.min(minX, item.position.x)
      minY = Math.min(minY, item.position.y)
      maxX = Math.max(maxX, item.position.x + item.size.width)
      maxY = Math.max(maxY, item.position.y + item.size.height)
    })

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  private screenToCanvas(screenPos: Position): Position {
    return {
      x: (screenPos.x - viewport.value.offsetX) / viewport.value.zoom,
      y: (screenPos.y - viewport.value.offsetY) / viewport.value.zoom
    }
  }

  private canvasToScreen(canvasPos: Position): Position {
    return {
      x: canvasPos.x * viewport.value.zoom + viewport.value.offsetX,
      y: canvasPos.y * viewport.value.zoom + viewport.value.offsetY
    }
  }

  private isPointInItem(point: Position, item: BaseCanvasItem): boolean {
    return point.x >= item.position.x && 
           point.x <= item.position.x + item.size.width &&
           point.y >= item.position.y && 
           point.y <= item.position.y + item.size.height
  }

  private snapToGrid(position: Position): Position {
    if (!rendererConfig.value.snapToGrid) return position
    
    const gridSize = rendererConfig.value.gridSize
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    }
  }
}

// Create renderer instance
const rendererInstance = new CanvasRendererImpl()

// Watch for external data changes
watch(() => props.items, (newItems) => {
  items.value = [...newItems]
}, { deep: true, immediate: true })

// Event handlers
const handleItemClick = (event: MouseEvent, item: BaseCanvasItem) => {
  event.stopPropagation()
  
  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    if (selectedItems.value.includes(item.id)) {
      selectedItems.value = selectedItems.value.filter(id => id !== item.id)
    } else {
      selectedItems.value.push(item.id)
    }
  } else {
    // Single select
    selectedItems.value = [item.id]
  }
  
  emit('item-select', selectedItems.value)
  canvasStore.selectItems(selectedItems.value)
}

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === canvasRef.value) {
    selectedItems.value = []
    emit('item-select', [])
    canvasStore.clearSelection()
  }
}

const handleMouseDown = (event: MouseEvent, item: BaseCanvasItem) => {
  if (!rendererConfig.value.enableDrag || props.readonly) return
  
  event.preventDefault()
  
  const rect = containerRef.value!.getBoundingClientRect()
  const startPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  const draggedIds = selectedItems.value.includes(item.id) 
    ? selectedItems.value 
    : [item.id]
  
  dragState.value = {
    isDragging: true,
    draggedItems: draggedIds,
    startPosition: startPos,
    currentPosition: startPos
  }
  
  // Add global mouse event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!dragState.value) return
  
  const rect = containerRef.value!.getBoundingClientRect()
  const currentPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  const deltaX = (currentPos.x - dragState.value.startPosition.x) / viewport.value.zoom
  const deltaY = (currentPos.y - dragState.value.startPosition.y) / viewport.value.zoom
  
  // Update positions of dragged items
  dragState.value.draggedItems.forEach(itemId => {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      let newPosition = {
        x: item.position.x + deltaX,
        y: item.position.y + deltaY
      }
      
      if (rendererConfig.value.snapToGrid) {
        newPosition = rendererInstance.snapToGrid(newPosition)
      }
      
      // Update item position
      const index = items.value.findIndex(i => i.id === itemId)
      if (index !== -1) {
        items.value[index] = {
          ...items.value[index],
          position: newPosition
        }
      }
    }
  })
  
  dragState.value.currentPosition = currentPos
}

const handleMouseUp = (event: MouseEvent) => {
  if (!dragState.value) return
  
  // Emit layout change
  emit('layout-change', items.value)
  canvasStore.setItems(items.value)
  
  // Clean up
  dragState.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Zoom handlers
const handleWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.metaKey) return
  
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(0.1, Math.min(5, viewport.value.zoom * delta))
  
  // Zoom towards mouse position
  const rect = containerRef.value!.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  const zoomRatio = newZoom / viewport.value.zoom
  
  viewport.value = {
    zoom: newZoom,
    offsetX: mouseX - (mouseX - viewport.value.offsetX) * zoomRatio,
    offsetY: mouseY - (mouseY - viewport.value.offsetY) * zoomRatio
  }
  
  emit('viewport-change', viewport.value)
}

// Item style computation
const getItemStyle = (item: BaseCanvasItem) => ({
  position: 'absolute' as const,
  left: `${item.position.x}px`,
  top: `${item.position.y}px`,
  width: `${item.size.width}px`,
  height: `${item.size.height}px`,
  zIndex: item.zIndex,
  opacity: item.visible ? 1 : 0.5,
  cursor: dragState.value?.draggedItems.includes(item.id) ? 'grabbing' : 'grab',
  transform: dragState.value?.draggedItems.includes(item.id) ? 'scale(1.02)' : 'scale(1)',
  transition: dragState.value?.draggedItems.includes(item.id) ? 'none' : 'transform 0.2s ease'
})

// Expose renderer instance
defineExpose({
  renderer: rendererInstance
})

onMounted(() => {
  if (containerRef.value) {
    rendererInstance.initialize(containerRef.value, props.config)
  }
})

onUnmounted(() => {
  rendererInstance.destroy()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-renderer"
    @click="handleCanvasClick"
    @wheel="handleWheel"
  >
    <div
      ref="canvasRef"
      class="canvas-content"
      :style="canvasStyle"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="canvas-item"
        :class="{
          'canvas-item-selected': selectedItems.includes(item.id),
          'canvas-item-dragging': dragState?.draggedItems.includes(item.id),
          'canvas-item-locked': item.locked
        }"
        :style="getItemStyle(item)"
        @click="(event: MouseEvent) => handleItemClick(event, item)"
        @mousedown="(event: MouseEvent) => handleMouseDown(event, item)"
      >
        <div class="canvas-item-content">
          <!-- 这里渲染实际的卡片内容 -->
          <slot :item="item" :canvas-item="item">
            <div class="default-card-content">
              <div class="card-header">
                <h4>{{ item.cardData.title || `Item ${item.id}` }}</h4>
              </div>
              <div class="card-body">
                <p>Card ID: {{ item.cardData.cardId || 'Unknown' }}</p>
                <p>Position: {{ Math.round(item.position.x) }}, {{ Math.round(item.position.y) }}</p>
                <p>Size: {{ item.size.width }} × {{ item.size.height }}</p>
                <p>Z-Index: {{ item.zIndex }}</p>
              </div>
            </div>
          </slot>
        </div>
        
        <!-- 选择指示器 -->
        <div v-if="selectedItems.includes(item.id)" class="selection-indicators">
          <div class="selection-border"></div>
          <div class="resize-handles">
            <div class="resize-handle resize-handle-nw"></div>
            <div class="resize-handle resize-handle-ne"></div>
            <div class="resize-handle resize-handle-sw"></div>
            <div class="resize-handle resize-handle-se"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 缩放指示器 -->
    <div class="zoom-indicator">
      {{ Math.round(viewport.zoom * 100) }}%
    </div>
  </div>
</template>

<style scoped>
.canvas-renderer {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  background-color: #fafafa;
}

.canvas-content {
  position: relative;
  cursor: crosshair;
}

.canvas-item {
  border-radius: 8px;
  overflow: hidden;
  user-select: none;
}

.canvas-item-content {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  transition: box-shadow 0.2s ease;
}

.canvas-item-selected .canvas-item-content {
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
}

.canvas-item-dragging .canvas-item-content {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.canvas-item-locked {
  cursor: not-allowed !important;
}

.canvas-item-locked .canvas-item-content {
  opacity: 0.7;
  border: 2px dashed #d9d9d9;
}

.default-card-content {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.card-body {
  flex: 1;
  font-size: 14px;
  color: #595959;
}

.card-body p {
  margin: 4px 0;
}

.selection-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.selection-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #1890ff;
  border-radius: 8px;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #1890ff;
  border: 2px solid white;
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
}

.resize-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}

/* 滚动条样式 */
.canvas-renderer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.canvas-renderer::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.canvas-renderer::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}

.canvas-renderer::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>