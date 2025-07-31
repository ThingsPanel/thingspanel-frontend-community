<!--
  Kanban Renderer Component
  基于vue3-grid-layout的看板渲染器实现
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'
import { useThemeStore } from '@/store/modules/theme'
import type { 
  BaseRenderer, 
  RendererConfig, 
  RendererCapabilities,
  RendererState,
  RendererEvents
} from '../../types/renderer'
import type { BaseCanvasItem, Viewport } from '../../types/core'
import type { GridLayoutItem } from '../../types/adapters'
import { BaseCanvasKanbanAdapter } from './adapters/BaseCanvasKanbanAdapter'
import { useCanvasStore } from '../../store/canvasStore'
import eventBus from '../../core/EventBus'
import { dragDropService, type DragData, type DropZone } from '../../core/DragDropService'
import { generateId } from '../../utils/id'
import CardRenderer from '../CardRenderer.vue'

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
const kanbanColors = computed(() => ({
  // 拖拽相关颜色
  dragHighlight: themeStore.isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(24, 144, 255, 0.05)',
  dragActive: themeStore.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(24, 144, 255, 0.1)',
  dragHover: themeStore.isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(24, 144, 255, 0.08)',
  
  // 边框颜色
  borderActive: themeStore.isDark ? '#3b82f6' : '#1890ff',
  
  // 文字颜色
  primaryText: themeStore.isDark ? '#e5e7eb' : '#262626',
  secondaryText: themeStore.isDark ? '#9ca3af' : '#595959'
}))

// Refs
const containerRef = ref<HTMLElement>()
const kanbanAdapter = new BaseCanvasKanbanAdapter()

// Reactive state
const layout = ref<GridLayoutItem[]>([])
const isDragging = ref(false)
const isResizing = ref(false)
const selectedItems = ref<string[]>([])

// 动态配置状态
const dynamicConfig = ref({
  colNum: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  showGrid: true,
  enableSnap: true,
  compactType: 'vertical' as 'vertical' | 'horizontal' | null
})

// Renderer configuration
const rendererConfig = computed(() => ({
  colNum: dynamicConfig.value.colNum,
  rowHeight: dynamicConfig.value.rowHeight,
  isDraggable: !props.readonly && (props.config.enableDrag ?? true),
  isResizable: !props.readonly && (props.config.enableResize ?? true),
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  preventCollision: false,  // 允许自动重排防止重叠
  compactType: dynamicConfig.value.compactType,  // 动态紧凑模式
  margin: dynamicConfig.value.margin,
  useCssTransforms: true,
  responsive: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: dynamicConfig.value.colNum, md: Math.min(10, dynamicConfig.value.colNum), sm: Math.min(6, dynamicConfig.value.colNum), xs: Math.min(4, dynamicConfig.value.colNum), xxs: Math.min(2, dynamicConfig.value.colNum) },
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
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, // Kanban renderer doesn't support viewport
  draggedIds: isDragging.value ? selectedItems.value : [],
  loading: false,
  error: null
}))

// Renderer implementation class
class KanbanRendererImpl implements BaseRenderer {
  readonly id = 'kanban'
  readonly name = 'Kanban Renderer'
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
    layout.value = kanbanAdapter.toGridFormat(items)
  }

  getData(): BaseCanvasItem[] {
    return kanbanAdapter.fromGridFormat(layout.value, props.items)
  }

  addItem(item: BaseCanvasItem): void {
    const gridItem = kanbanAdapter.toGridFormat([item])[0]
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
        const gridItem = kanbanAdapter.toGridFormat([updatedItem])[0]
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
    // Kanban renderer doesn't support viewport operations
    console.warn('Kanban renderer does not support viewport operations')
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
const rendererInstance = new KanbanRendererImpl()

// Watch for external data changes
watch(() => props.items, (newItems) => {
  layout.value = kanbanAdapter.toGridFormat(newItems)
}, { deep: true, immediate: true })

// Grid layout event handlers
const handleLayoutChange = (newLayout: GridLayoutItem[]) => {
  layout.value = newLayout
  const updatedItems = kanbanAdapter.fromGridFormat(newLayout, props.items)
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

// Drop zone handling
let dropZoneId: string | null = null

const setupDropZone = () => {
  if (!containerRef.value || props.readonly) return
  
  dropZoneId = `kanban-${generateId()}`
  const dropZone: DropZone = {
    id: dropZoneId,
    accepts: ['card', 'component'],
    element: containerRef.value,
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave
  }
  
  dragDropService.registerDropZone(dropZone)
}

const cleanupDropZone = () => {
  if (dropZoneId) {
    dragDropService.unregisterDropZone(dropZoneId)
    dropZoneId = null
  }
}

const handleDrop = (data: DragData, position: { x: number, y: number }) => {
  if (data.type === 'card' && data.cardConfig) {
    // 计算首选网格位置
    const preferredPosition = calculateGridPosition(position)
    const itemSize = {
      w: data.cardConfig.preset?.w || 4,
      h: data.cardConfig.preset?.h || 3
    }
    
    // 寻找可用位置（防止重叠）
    const finalPosition = findFreePosition(preferredPosition, itemSize)
    
    console.log('拖拽位置计算:', {
      drop: position,
      preferred: preferredPosition, 
      final: finalPosition,
      size: itemSize
    })
    
    // 创建新的canvas item
    const newItem: BaseCanvasItem = {
      id: generateId(),
      type: 'component',
      cardData: {
        cardId: data.cardId!,
        title: data.cardName || 'New Card',
        config: data.cardConfig.config || {},
        dataConfig: {},
        styleConfig: {}
      },
      position: {
        x: finalPosition.x * rendererConfig.value.rowHeight,
        y: finalPosition.y * rendererConfig.value.rowHeight
      },
      size: {
        width: itemSize.w * rendererConfig.value.rowHeight,
        height: itemSize.h * rendererConfig.value.rowHeight
      },
      constraints: {
        minWidth: (data.cardConfig.preset?.minW || 2) * rendererConfig.value.rowHeight,
        minHeight: (data.cardConfig.preset?.minH || 2) * rendererConfig.value.rowHeight,
        maxWidth: data.cardConfig.preset?.maxW ? data.cardConfig.preset.maxW * rendererConfig.value.rowHeight : undefined,
        maxHeight: data.cardConfig.preset?.maxH ? data.cardConfig.preset.maxH * rendererConfig.value.rowHeight : undefined
      },
      zIndex: 1,
      locked: false,
      visible: true,
      // 添加渲染器数据
      rendererData: {
        grid: {
          x: finalPosition.x,
          y: finalPosition.y,
          w: itemSize.w,
          h: itemSize.h
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        ...data.metadata
      }
    }
    
    // 添加到画布
    rendererInstance.addItem(newItem)
    canvasStore.addItem(newItem)
    
    console.log('添加新卡片:', newItem)
  }
}

const handleDragOver = (data: DragData, position: { x: number, y: number }): boolean => {
  // 只允许卡片类型的拖拽
  return data.type === 'card'
}

const handleDragEnter = (data: DragData) => {
  if (containerRef.value) {
    containerRef.value.classList.add('drag-over-active')
  }
}

const handleDragLeave = (data: DragData) => {
  if (containerRef.value) {
    containerRef.value.classList.remove('drag-over-active')
  }
}

// 计算网格位置（带碰撞检测）
const calculateGridPosition = (dropPosition: { x: number, y: number }) => {
  const config = rendererConfig.value
  const containerWidth = containerRef.value?.clientWidth || 1200
  const colWidth = containerWidth / config.colNum
  
  const gridX = Math.floor(dropPosition.x / colWidth)
  const gridY = Math.floor(dropPosition.y / (config.rowHeight + config.margin[1]))
  
  return {
    x: Math.max(0, Math.min(gridX, config.colNum - 1)),
    y: Math.max(0, gridY)
  }
}

// 寻找空闲位置（防止重叠）
const findFreePosition = (preferredPosition: { x: number, y: number }, itemSize: { w: number, h: number }) => {
  const config = rendererConfig.value
  const maxCols = config.colNum
  
  // 检查指定位置是否可用
  const isPositionFree = (x: number, y: number, w: number, h: number) => {
    // 检查是否超出边界
    if (x + w > maxCols || x < 0 || y < 0) return false
    
    // 检查是否与现有元素重叠
    return !layout.value.some(item => {
      return !(
        x >= item.x + item.w || // 在右侧
        x + w <= item.x ||      // 在左侧
        y >= item.y + item.h || // 在下方
        y + h <= item.y        // 在上方
      )
    })
  }
  
  const { x: prefX, y: prefY } = preferredPosition
  const { w, h } = itemSize
  
  // 首先检查首选位置
  if (isPositionFree(prefX, prefY, w, h)) {
    return { x: prefX, y: prefY }
  }
  
  // 如果首选位置不可用，从首选位置开始向下找
  for (let y = prefY; y < prefY + 20; y++) { // 最多向下找20行
    for (let x = 0; x <= maxCols - w; x++) {
      if (isPositionFree(x, y, w, h)) {
        return { x, y }
      }
    }
  }
  
  // 如果还找不到，就放在最底部
  const maxY = Math.max(0, ...layout.value.map(item => item.y + item.h))
  return { x: 0, y: maxY }
}

// 配置变更处理
const handleConfigChange = (newConfig: any) => {
  console.log('KanbanRenderer: Received config change:', newConfig)
  
  // 更新动态配置
  if (newConfig.columns !== undefined) {
    dynamicConfig.value.colNum = newConfig.columns
    console.log('Updated colNum to:', newConfig.columns)
  }
  if (newConfig.rowHeight !== undefined) {
    dynamicConfig.value.rowHeight = newConfig.rowHeight
    console.log('Updated rowHeight to:', newConfig.rowHeight)
  }
  if (newConfig.margin !== undefined) {
    dynamicConfig.value.margin = newConfig.margin
    console.log('Updated margin to:', newConfig.margin)
  }
  if (newConfig.compactType !== undefined) {
    dynamicConfig.value.compactType = newConfig.compactType
    console.log('Updated compactType to:', newConfig.compactType)
  }
  if (newConfig.showGrid !== undefined) {
    dynamicConfig.value.showGrid = newConfig.showGrid
    console.log('Updated showGrid to:', newConfig.showGrid)
    // 显示/隐藏网格的实现
    updateGridDisplay(newConfig.showGrid)
  }
  if (newConfig.enableSnap !== undefined) {
    dynamicConfig.value.enableSnap = newConfig.enableSnap
    console.log('Updated enableSnap to:', newConfig.enableSnap)
  }
  
  console.log('KanbanRenderer: Final config:', dynamicConfig.value)
  console.log('KanbanRenderer: Computed rendererConfig:', rendererConfig.value)
}

// 更新网格显示
const updateGridDisplay = (showGrid: boolean) => {
  if (containerRef.value) {
    if (showGrid) {
      containerRef.value.classList.add('show-grid')
    } else {
      containerRef.value.classList.remove('show-grid')
    }
  }
}

// Expose renderer instance
defineExpose({
  renderer: rendererInstance
})

onMounted(() => {
  if (containerRef.value) {
    rendererInstance.initialize(containerRef.value, props.config)
    setupDropZone()
    
    // 初始化网格显示状态
    updateGridDisplay(dynamicConfig.value.showGrid)
  }
  
  // 监听配置变更事件
  eventBus.on('kanban:config-change', handleConfigChange)
})

onUnmounted(() => {
  rendererInstance.destroy()
  cleanupDropZone()
  
  // 清理事件监听
  eventBus.off('kanban:config-change', handleConfigChange)
})
</script>

<template>
  <div
    ref="containerRef"
    class="kanban-renderer"
    :style="{
      '--drag-highlight': kanbanColors.dragHighlight,
      '--drag-active': kanbanColors.dragActive,
      '--drag-hover': kanbanColors.dragHover,
      '--border-active': kanbanColors.borderActive,
      '--primary-text': kanbanColors.primaryText,
      '--secondary-text': kanbanColors.secondaryText
    }"
    @click="handleContainerClick"
  >
    <GridLayout
      :key="`grid-${dynamicConfig.colNum}-${dynamicConfig.rowHeight}-${dynamicConfig.margin.join('-')}`"
      v-model:layout="layout"
      :col-num="rendererConfig.colNum"
      :row-height="rendererConfig.rowHeight"
      :is-draggable="rendererConfig.isDraggable"
      :is-resizable="rendererConfig.isResizable"
      :is-mirrored="rendererConfig.isMirrored"
      :auto-size="rendererConfig.autoSize"
      :vertical-compact="rendererConfig.verticalCompact"
      :prevent-collision="rendererConfig.preventCollision"
      :compact-type="rendererConfig.compactType"
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
          <!-- 使用CardRenderer渲染实际的卡片组件 -->
          <CardRenderer
            v-if="props.items.find(canvasItem => canvasItem.id === item.i)"
            :item="props.items.find(canvasItem => canvasItem.id === item.i)!"
            :readonly="props.readonly"
            class="h-full w-full"
          />
          
          <!-- 占位符（当找不到对应的canvas item时） -->
          <div v-else class="default-card-content">
            <div class="card-header">
              <h4>Item {{ item.i }}</h4>
            </div>
            <div class="card-body">
              <p>Position: {{ item.x }}, {{ item.y }}</p>
              <p>Size: {{ item.w }} × {{ item.h }}</p>
              <p class="text-red-500 text-xs">Canvas item not found</p>
            </div>
          </div>
        </div>
      </GridItem>
    </GridLayout>
  </div>
</template>

<style scoped>
.kanban-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--canvas-bg-color, #f5f5f5);
  transition: background-color 0.2s ease;
}

/* 拖拽状态样式 */
.kanban-renderer.can-drop {
  background-color: var(--drag-highlight);
  transition: background-color 0.3s ease;
}

.kanban-renderer.drag-over {
  background-color: var(--drag-active) !important;
  box-shadow: inset 0 0 0 2px var(--border-active);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.kanban-renderer.drag-over-active {
  background-color: var(--drag-hover) !important;
  box-shadow: inset 0 0 0 1px var(--border-active);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
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
  box-shadow: 0 0 0 2px var(--border-active);
  border-color: var(--border-active);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
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
  color: var(--primary-text);
  transition: color 0.3s ease;
}

.card-body {
  flex: 1;
  font-size: 14px;
  color: var(--secondary-text);
  transition: color 0.3s ease;
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
  background: var(--border-active);
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
  background-color: var(--drag-active);
  transition: background-color 0.3s ease;
}

/* 网格显示样式 */
.kanban-renderer.show-grid {
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: calc(100% / var(--grid-cols, 12)) var(--grid-row-height, 110px);
}

.kanban-renderer {
  --grid-cols: v-bind('dynamicConfig.colNum');
  --grid-row-height: v-bind('(dynamicConfig.rowHeight + dynamicConfig.margin[1]) + "px"');
}
</style>