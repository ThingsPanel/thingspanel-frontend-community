<!--
  Grid Renderer Component
  基于vue3-grid-layout的网格渲染器实现
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'
import type { 
  BaseRenderer, 
  RendererConfig, 
  RendererCapabilities,
  RendererState,
  RendererEvents
} from '../types/renderer'
import type { BaseCanvasItem, Viewport } from '../types/core'
import type { GridLayoutItem } from '../types/adapters'
import { BaseCanvasGridAdapter } from './adapters/BaseCanvasGridAdapter'
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
const gridAdapter = new BaseCanvasGridAdapter()

// Reactive state
const layout = ref<GridLayoutItem[]>([])
const isDragging = ref(false)
const isResizing = ref(false)
const selectedItems = ref<string[]>([])

// Renderer configuration
const rendererConfig = computed(() => ({
  colNum: 12,
  rowHeight: 100,
  isDraggable: !props.readonly && (props.config.enableDrag ?? true),
  isResizable: !props.readonly && (props.config.enableResize ?? true),
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  margin: [10, 10],
  useCssTransforms: true,
  responsive: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  ...props.config
}))

// Renderer capabilities
const capabilities: RendererCapabilities = {
  supportsDrag: true,
  supportsResize: true,
  supportsRotate: false,
  supportsGrouping: false,
  supportsLayers: false,
  supportsSnapping: true,
  supportsPrecisePositioning: false,
  supportsCustomCoordinates: false,
  supportsZoom: false,
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
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, // Grid renderer doesn't support viewport
  draggedIds: isDragging.value ? selectedItems.value : [],
  loading: false,
  error: null
}))

// Renderer implementation class
class GridRendererImpl implements BaseRenderer {
  readonly id = 'grid'
  readonly name = 'Grid Renderer'
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
    layout.value = []
    selectedItems.value = []
  }

  resize(width: number, height: number): void {
    // Grid layout handles resizing automatically
  }

  setData(items: BaseCanvasItem[]): void {
    layout.value = gridAdapter.toGridFormat(items)
  }

  getData(): BaseCanvasItem[] {
    return gridAdapter.fromGridFormat(layout.value, props.items)
  }

  addItem(item: BaseCanvasItem): void {
    const gridItem = gridAdapter.toGridFormat([item])[0]
    layout.value.push(gridItem)
    emit('item-add', item)
  }

  removeItem(id: string): void {
    layout.value = layout.value.filter(item => item.i !== id)
    selectedItems.value = selectedItems.value.filter(selectedId => selectedId !== id)
    emit('item-remove', [id])
  }

  updateItem(id: string, updates: Partial<BaseCanvasItem>): void {
    const index = layout.value.findIndex(item => item.i === id)
    if (index !== -1) {
      // 更新网格项目
      const currentItem = props.items.find(item => item.id === id)
      if (currentItem) {
        const updatedItem = { ...currentItem, ...updates }
        const gridItem = gridAdapter.toGridFormat([updatedItem])[0]
        layout.value[index] = gridItem
        emit('item-update', id, updates)
      }
    }
  }

  render(): void {
    // Vue reactivity handles rendering
  }

  refresh(): void {
    this.setData(props.items)
  }

  clear(): void {
    layout.value = []
    selectedItems.value = []
  }

  setViewport(viewport: Viewport): void {
    // Grid renderer doesn't support viewport operations
    console.warn('Grid renderer does not support viewport operations')
  }

  getViewport(): Viewport {
    return { zoom: 1, offsetX: 0, offsetY: 0 }
  }

  fitToContent(): void {
    // Auto-handled by grid layout
  }

  centerView(): void {
    // Not applicable for grid layout
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
    // Event handling is done through Vue emits and event bus
  }

  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void {
    // Event handling is done through Vue emits and event bus
  }

  emit<K extends keyof RendererEvents>(event: K, ...args: Parameters<RendererEvents[K]>): void {
    // Event handling is done through Vue emits and event bus
  }

  updateConfig(config: Partial<RendererConfig>): void {
    Object.assign(rendererConfig.value, config)
  }

  getConfig(): RendererConfig {
    return rendererConfig.value
  }

  hitTest(position: { x: number, y: number }): string | null {
    // 简单的碰撞检测实现
    const gridX = Math.floor(position.x / (rendererConfig.value.rowHeight + rendererConfig.value.margin[0]))
    const gridY = Math.floor(position.y / (rendererConfig.value.rowHeight + rendererConfig.value.margin[1]))
    
    const hitItem = layout.value.find(item => 
      gridX >= item.x && gridX < item.x + item.w &&
      gridY >= item.y && gridY < item.y + item.h
    )
    
    return hitItem?.i || null
  }

  getBounds(id: string): { position: { x: number, y: number }, size: { width: number, height: number } } | null {
    const item = layout.value.find(item => item.i === id)
    if (!item) return null
    
    return {
      position: {
        x: item.x * (rendererConfig.value.rowHeight + rendererConfig.value.margin[0]),
        y: item.y * (rendererConfig.value.rowHeight + rendererConfig.value.margin[1])
      },
      size: {
        width: item.w * rendererConfig.value.rowHeight,
        height: item.h * rendererConfig.value.rowHeight
      }
    }
  }

  isVisible(id: string): boolean {
    return layout.value.some(item => item.i === id)
  }
}

// Create renderer instance
const rendererInstance = new GridRendererImpl()

// Watch for external data changes
watch(() => props.items, (newItems) => {
  layout.value = gridAdapter.toGridFormat(newItems)
}, { deep: true, immediate: true })

// Grid layout event handlers
const handleLayoutChange = (newLayout: GridLayoutItem[]) => {
  layout.value = newLayout
  const updatedItems = gridAdapter.fromGridFormat(newLayout, props.items)
  emit('layout-change', updatedItems)
  
  // Update store
  canvasStore.setItems(updatedItems)
}

const handleItemResize = (i: string, h: number, w: number, hPx: number, wPx: number) => {
  isResizing.value = true
  
  // Find and update the item
  const itemIndex = layout.value.findIndex(item => item.i === i)
  if (itemIndex !== -1) {
    layout.value[itemIndex] = {
      ...layout.value[itemIndex],
      w,
      h
    }
  }
}

const handleItemMove = (i: string, newX: number, newY: number) => {
  isDragging.value = true
  
  // Find and update the item
  const itemIndex = layout.value.findIndex(item => item.i === i)
  if (itemIndex !== -1) {
    layout.value[itemIndex] = {
      ...layout.value[itemIndex],
      x: newX,
      y: newY
    }
  }
}

const handleItemResized = (i: string, h: number, w: number, hPx: number, wPx: number) => {
  isResizing.value = false
  handleLayoutChange(layout.value)
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  isDragging.value = false
  handleLayoutChange(layout.value)
}

const handleContainerResized = (containerNewWidth: number, containerNewHeight: number, colNum: number, rowHeight: number) => {
  // Handle container resize if needed
}

// Item click handler
const handleItemClick = (event: MouseEvent, itemId: string) => {
  event.stopPropagation()
  
  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    if (selectedItems.value.includes(itemId)) {
      selectedItems.value = selectedItems.value.filter(id => id !== itemId)
    } else {
      selectedItems.value.push(itemId)
    }
  } else {
    // Single select
    selectedItems.value = [itemId]
  }
  
  emit('item-select', selectedItems.value)
  canvasStore.selectItems(selectedItems.value)
}

// Container click handler (clear selection)
const handleContainerClick = (event: MouseEvent) => {
  if (event.target === containerRef.value) {
    selectedItems.value = []
    emit('item-select', [])
    canvasStore.clearSelection()
  }
}

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
})
</script>

<template>
  <div
    ref="containerRef"
    class="grid-renderer"
    @click="handleContainerClick"
  >
    <GridLayout
      v-model:layout="layout"
      :col-num="rendererConfig.colNum"
      :row-height="rendererConfig.rowHeight"
      :is-draggable="rendererConfig.isDraggable"
      :is-resizable="rendererConfig.isResizable"
      :is-mirrored="rendererConfig.isMirrored"
      :auto-size="rendererConfig.autoSize"
      :vertical-compact="rendererConfig.verticalCompact"
      :margin="rendererConfig.margin"
      :use-css-transforms="rendererConfig.useCssTransforms"
      :responsive="rendererConfig.responsive"
      :breakpoints="rendererConfig.breakpoints"
      :cols="rendererConfig.cols"
      @layout-change="handleLayoutChange"
      @item-resize="handleItemResize"
      @item-move="handleItemMove"
      @item-resized="handleItemResized"
      @item-moved="handleItemMoved"
      @container-resized="handleContainerResized"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :min-w="item.minW"
        :min-h="item.minH"
        :max-w="item.maxW"
        :max-h="item.maxH"
        :static="item.static"
        :is-draggable="item.isDraggable"
        :is-resizable="item.isResizable"
        :class="{
          'grid-item-selected': selectedItems.includes(item.i),
          'grid-item-dragging': isDragging && selectedItems.includes(item.i),
          'grid-item-resizing': isResizing && selectedItems.includes(item.i)
        }"
        @click="(event: MouseEvent) => handleItemClick(event, item.i)"
      >
        <div class="grid-item-content">
          <!-- 这里渲染实际的卡片内容 -->
          <slot :item="item" :canvas-item="props.items.find(canvasItem => canvasItem.id === item.i)">
            <div class="default-card-content">
              <div class="card-header">
                <h4>{{ props.items.find(canvasItem => canvasItem.id === item.i)?.cardData.title || `Item ${item.i}` }}</h4>
              </div>
              <div class="card-body">
                <p>Card ID: {{ props.items.find(canvasItem => canvasItem.id === item.i)?.cardData.cardId || 'Unknown' }}</p>
                <p>Position: {{ item.x }}, {{ item.y }}</p>
                <p>Size: {{ item.w }} × {{ item.h }}</p>
              </div>
            </div>
          </slot>
        </div>
      </GridItem>
    </GridLayout>
  </div>
</template>

<style scoped>
.grid-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--canvas-bg-color, #f5f5f5);
}

.grid-item-content {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;
}

.grid-item-selected .grid-item-content {
  box-shadow: 0 0 0 2px #1890ff;
  border-color: #1890ff;
}

.grid-item-dragging .grid-item-content {
  opacity: 0.8;
  transform: rotate(2deg);
}

.grid-item-resizing .grid-item-content {
  box-shadow: 0 0 0 2px #52c41a;
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

/* Vue Grid Layout 样式覆盖 */
:deep(.vue-grid-item) {
  transition: all 200ms ease;
}

:deep(.vue-grid-item.no-touch) {
  -ms-touch-action: none;
  touch-action: none;
}

:deep(.vue-grid-item.cssTransforms) {
  transition-property: transform;
}

:deep(.vue-grid-item.resizing) {
  opacity: 0.6;
  z-index: 3;
}

:deep(.vue-grid-item.vue-draggable-dragging) {
  transition: none;
  z-index: 3;
}

:deep(.vue-grid-item.vue-grid-placeholder) {
  background: #1890ff;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  user-select: none;
}

:deep(.vue-resizable-handle) {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBjeD0iMSIgY3k9IjEiIHI9IjEiLz4KPGRvdHMgZmlsbD0iIzk5OSIgY3g9IjEiIGN5PSIzIiByPSIxIi8+CjxkdXN0cyBmaWxsPSIjOTk5IiBjeD0iMSIgY3k9IjUiIHI9IjEiLz4KPGR1c3RzIGZpbGw9IiM5OTkiIGN4PSIzIiBjeT0iMyIgcj0iMSIvPgo8ZHVzdHMgZmlsbD0iIzk5OSIgY3g9IjMiIGN5PSI1IiByPSIxIi8+CjxkdXN0cyBmaWxsPSIjOTk5IiBjeD0iNSIgY3k9IjUiIHI9IjEiLz4KPC9zdmc+');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

:deep(.vue-resizable-handle:hover) {
  background-color: rgba(24, 144, 255, 0.1);
}
</style>