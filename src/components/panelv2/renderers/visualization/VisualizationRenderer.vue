<!--
  Visualization Renderer Component
  可视化大屏渲染器，支持精确像素定位和高级交互
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import type { 
  BaseRenderer, 
  RendererConfig, 
  RendererCapabilities,
  RendererState,
  RendererEvents
} from '../../types/renderer'
import type { BaseCanvasItem, Viewport, Position, Size } from '../../types/core'
import { useCanvasStore } from '../../store/canvasStore'
import eventBus from '../../core/EventBus'

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

// 主题支持
const themeStore = useThemeStore()
const visualColors = computed(() => ({
  primaryText: themeStore.isDark ? '#e5e7eb' : '#1a1a1a',
  secondaryText: themeStore.isDark ? '#9ca3af' : '#666',
  tertiaryText: themeStore.isDark ? '#6b7280' : '#555'
}))

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
class VisualizationRendererImpl implements BaseRenderer {
  readonly id = 'visualization'
  readonly name = 'Visualization Renderer'
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
const rendererInstance = new VisualizationRendererImpl()

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
    class="visualization-renderer-placeholder"
    :style="{
      '--primary-text': visualColors.primaryText,
      '--secondary-text': visualColors.secondaryText,
      '--tertiary-text': visualColors.tertiaryText
    }"
  >
    <div class="coming-soon-content">
      <div class="coming-soon-icon">
        <div class="icon-large">📊</div>
      </div>
      <h2 class="coming-soon-title">可视化大屏</h2>
      <p class="coming-soon-description">
        全新的可视化大屏功能正在开发中，敬请期待！
      </p>
      <div class="features-preview">
        <div class="feature-item">
          <span class="feature-icon">🎨</span>
          <span>自由画布布局</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📐</span>
          <span>精确像素定位</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔍</span>
          <span>画布缩放平移</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <span>高级交互功能</span>
        </div>
      </div>
      <div class="coming-soon-footer">
        <span class="version-info">即将在下个版本发布</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visualization-renderer-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 400px;
}

.coming-soon-content {
  text-align: center;
  padding: 48px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  margin: 0 auto;
}

.coming-soon-icon {
  margin-bottom: 24px;
}

.icon-large {
  font-size: 64px;
  line-height: 1;
  opacity: 0.8;
}

.coming-soon-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-text);
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: color 0.3s ease;
}

.coming-soon-description {
  font-size: 16px;
  color: var(--secondary-text);
  margin: 0 0 32px 0;
  line-height: 1.6;
  transition: color 0.3s ease;
}

.features-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: var(--tertiary-text);
  transition: all 0.2s ease, color 0.3s ease;
}

.feature-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.feature-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.coming-soon-footer {
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.version-info {
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 640px) {
  .coming-soon-content {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .coming-soon-title {
    font-size: 24px;
  }
  
  .features-preview {
    grid-template-columns: 1fr;
  }
}
</style>