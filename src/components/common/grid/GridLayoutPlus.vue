<!--
  Grid Layout Plus 包装组件
  基于 grid-layout-plus 的企业级网格布局组件
-->
<template>
  <div
    class="grid-layout-plus-wrapper grid-background-base"
    :class="{
      readonly: readonly,
      'dark-theme': isDarkTheme,
      'show-grid': showGrid && !readonly
    }"
  >
    <GridLayout
      v-model:layout="internalLayout"
      :col-num="config.colNum"
      :row-height="config.rowHeight"
      :is-draggable="!readonly && config.isDraggable && !config.staticGrid"
      :is-resizable="!readonly && config.isResizable && !config.staticGrid"
      :is-mirrored="config.isMirrored"
      :auto-size="config.autoSize"
      :vertical-compact="config.verticalCompact"
      :margin="config.margin"
      :use-css-transforms="config.useCssTransforms"
      :responsive="config.responsive"
      :breakpoints="config.breakpoints"
      :cols="config.cols"
      :prevent-collision="config.preventCollision"
      :use-style-cursor="config.useStyleCursor"
      :restore-on-drag="config.restoreOnDrag"
      @layout-created="handleLayoutCreated"
      @layout-before-mount="handleLayoutBeforeMount"
      @layout-mounted="handleLayoutMounted"
      @layout-updated="handleLayoutUpdated"
      @layout-ready="handleLayoutReady"
      @update:layout="handleLayoutChange"
      @breakpoint-changed="handleBreakpointChanged"
      @container-resized="handleContainerResized"
      @item-resize="handleItemResize"
      @item-resized="handleItemResized"
      @item-move="handleItemMove"
      @item-moved="handleItemMoved"
    >
      <GridItem
        v-for="item in internalLayout"
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
        :is-draggable="!readonly && item.isDraggable !== false && !item.static"
        :is-resizable="!readonly && item.isResizable !== false && !item.static"
        :static="item.static"
        :drag-ignore-from="item.dragIgnoreFrom"
        :drag-allow-from="item.dragAllowFrom"
        :resize-ignore-from="item.resizeIgnoreFrom"
        :preserve-aspect-ratio="item.preserveAspectRatio"
        :drag-option="item.dragOption"
        :resize-option="item.resizeOption"
        @resize="(i, newH, newW, newHPx, newWPx) => handleItemResize(i, newH, newW, newHPx, newWPx)"
        @resized="(i, newH, newW, newHPx, newWPx) => handleItemResized(i, newH, newW, newHPx, newWPx)"
        @move="(i, newX, newY) => handleItemMove(i, newX, newY)"
        @moved="(i, newX, newY) => handleItemMoved(i, newX, newY)"
        @container-resized="
          (i, newH, newW, newHPx, newWPx) => handleItemContainerResized(i, newH, newW, newHPx, newWPx)
        "
      >
        <!-- 渲染自定义组件 -->
        <div class="grid-item-content" :class="item.className" :style="item.style">
          <div v-if="!readonly && showTitle" class="grid-item-header">
            <span class="grid-item-title">{{ getItemTitle(item) }}</span>
          </div>

          <div class="grid-item-body">
            <slot :item="item">
              <!-- Default content if no slot is provided -->
              <div class="default-item-content">
                <div class="item-type">{{ item.type || '组件' }}</div>
                <div class="item-id">{{ item.i }}</div>
              </div>
            </slot>
          </div>
        </div>
      </GridItem>
    </GridLayout>

    <!-- 添加新项目的拖拽区域 -->
    <div
      v-if="!readonly && showDropZone"
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="drop-hint">
        <n-icon :size="24">
          <AddOutline />
        </n-icon>
        <span>拖拽组件到此处添加</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, shallowRef } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { NIcon } from 'naive-ui'
import { CreateOutline, TrashOutline, AddOutline } from '@vicons/ionicons5'
import { useThemeStore } from '@/store/modules/theme'
import type {
  GridLayoutPlusConfig,
  GridLayoutPlusItem,
  GridLayoutPlusEmits,
  GridLayoutPlusProps
} from './gridLayoutPlusTypes'

// Props
interface Props extends GridLayoutPlusProps {}

const props = withDefaults(defineProps<Props>(), {
  layout: () => [],
  readonly: false,
  showGrid: true,
  showDropZone: false,
  showTitle: false, // 默认不显示标题
  config: () => ({})
})

// Emits
interface Emits extends GridLayoutPlusEmits {}

const emit = defineEmits<Emits>()

// Store
const themeStore = useThemeStore()

// State
const internalLayout = shallowRef<GridLayoutPlusItem[]>([...props.layout])
const isDragging = ref(false)
const dragCounter = ref(0)

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

const config = computed<GridLayoutPlusConfig>(() => {
  const baseConfig = {
    colNum: 12,
    rowHeight: 100,
    isDraggable: true,
    isResizable: true,
    isMirrored: false,
    autoSize: true,
    verticalCompact: true,
    margin: [10, 10],
    useCssTransforms: true,
    responsive: false,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    preventCollision: false,
    useStyleCursor: true,
    restoreOnDrag: false,
    staticGrid: false,
    ...props.config
  }

  // 调试日志
  console.log('🔧 GridLayoutPlus - 配置计算:', {
    propsConfig: props.config,
    finalConfig: baseConfig,
    readonly: props.readonly
  })

  return baseConfig
})

// Methods
const getItemTitle = (item: GridLayoutPlusItem): string => {
  return item.title || item.type || `项目 ${item.i}`
}

const handleItemEdit = (item: GridLayoutPlusItem) => {
  emit('item-edit', item)
}

const handleItemDelete = (item: GridLayoutPlusItem) => {
  const index = internalLayout.value.findIndex(i => i.i === item.i)
  if (index > -1) {
    internalLayout.value.splice(index, 1)
    emit('item-delete', item.i)
  }
}

const handleItemDataUpdate = (itemId: string, data: any) => {
  const item = internalLayout.value.find(i => i.i === itemId)
  if (item) {
    item.data = { ...item.data, ...data }
    emit('item-data-update', itemId, data)
  }
}

// Grid Layout Plus 事件处理
const handleLayoutCreated = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-created', newLayout)
}

const handleLayoutBeforeMount = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-before-mount', newLayout)
}

const handleLayoutMounted = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-mounted', newLayout)
}

const handleLayoutUpdated = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-updated', newLayout)
}

const handleLayoutReady = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-ready', newLayout)
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  // 避免循环更新：仅当布局实际发生变化时才更新
  // 使用JSON.stringify进行深比较，确保内容变更也能被检测到
  const hasChanged = JSON.stringify(internalLayout.value) !== JSON.stringify(newLayout)
  if (hasChanged) {
    internalLayout.value = [...newLayout] // 创建新数组以触发shallowRef更新
    emit('layout-change', newLayout)
    emit('update:layout', newLayout)
  }
}

const handleBreakpointChanged = (newBreakpoint: string, newLayout: GridLayoutPlusItem[]) => {
  emit('breakpoint-changed', newBreakpoint, newLayout)
}

const handleContainerResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('container-resized', i, newH, newW, newHPx, newWPx)
}

const handleItemResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resize', i, newH, newW, newHPx, newWPx)
}

const handleItemResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resized', i, newH, newW, newHPx, newWPx)
}

const handleItemMove = (i: string, newX: number, newY: number) => {
  emit('item-move', i, newX, newY)
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  emit('item-moved', i, newX, newY)
}

const handleItemContainerResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-container-resized', i, newH, newW, newHPx, newWPx)
}

// 拖拽事件处理
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  dragCounter.value++
  isDragging.value = true
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  dragCounter.value = 0

  const componentType = e.dataTransfer?.getData('text/plain')
  if (componentType) {
    addItem(componentType)
  }
}

// API Methods
const addItem = (type: string, options?: Partial<GridLayoutPlusItem>) => {
  const newItem: GridLayoutPlusItem = {
    i: generateId(),
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    type,
    ...options
  }

  // 寻找合适的位置
  const position = findAvailablePosition(newItem.w, newItem.h)
  newItem.x = position.x
  newItem.y = position.y

  internalLayout.value.push(newItem)
  emit('item-add', newItem)

  return newItem
}

const removeItem = (itemId: string) => {
  const index = internalLayout.value.findIndex(item => item.i === itemId)
  if (index > -1) {
    const removedItem = internalLayout.value.splice(index, 1)[0]
    emit('item-delete', itemId)
    return removedItem
  }
  return null
}

const updateItem = (itemId: string, updates: Partial<GridLayoutPlusItem>) => {
  const item = internalLayout.value.find(i => i.i === itemId)
  if (item) {
    Object.assign(item, updates)
    emit('item-update', itemId, updates)
    return item
  }
  return null
}

const clearLayout = () => {
  internalLayout.value = []
  emit('layout-change', [])
  emit('update:layout', [])
}

const getItem = (itemId: string) => {
  return internalLayout.value.find(item => item.i === itemId)
}

const getAllItems = () => {
  return [...internalLayout.value]
}

// 工具函数
const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const findAvailablePosition = (w: number, h: number): { x: number; y: number } => {
  const colNum = config.value.colNum
  const layout = internalLayout.value

  // 简单的位置查找算法
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - w; x++) {
      const proposed = { x, y, w, h }

      // 检查是否与现有项目冲突
      const hasCollision = layout.some(item => {
        return !(
          proposed.x + proposed.w <= item.x ||
          proposed.x >= item.x + item.w ||
          proposed.y + proposed.h <= item.y ||
          proposed.y >= item.y + item.h
        )
      })

      if (!hasCollision) {
        return { x, y }
      }
    }
  }

  return { x: 0, y: 0 }
}

// Watchers
watch(
  () => props.layout,
  newLayout => {
    // 避免重复更新：只有当外部layout与内部layout不同时才更新
    const hasChanged = JSON.stringify(internalLayout.value) !== JSON.stringify(newLayout)
    if (hasChanged) {
      internalLayout.value = [...newLayout]
    }
  },
  { deep: true }
)

// 暴露方法
defineExpose({
  addItem,
  removeItem,
  updateItem,
  clearLayout,
  getItem,
  getAllItems,
  getLayout: () => internalLayout.value
})
</script>

<style scoped>
.grid-layout-plus-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 网格项内容 */
.grid-item-content {
  height: 100%;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.dark-theme .grid-item-content {
  background: #2d2d2d;
  border-color: #404040;
  color: white;
}

.grid-item-content:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 项目头部 */
.grid-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  font-size: 14px;
  font-weight: 500;
}

.dark-theme .grid-item-header {
  background: #3a3a3a;
  border-bottom-color: #404040;
}

.grid-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.dark-theme .action-btn:hover {
  background: #4a4a4a;
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

/* 项目内容 */
.grid-item-body {
  flex: 1;
  padding: 12px;
  overflow: auto;
}

.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
}

.item-type {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
}

/* 拖拽区域 */
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
}

.drop-zone.dragging {
  opacity: 1;
  pointer-events: auto;
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #007bff;
  font-size: 16px;
  font-weight: 500;
}

.dark-theme .drop-zone {
  background: rgba(26, 26, 26, 0.9);
  border-color: #404040;
}

.dark-theme .drop-zone.dragging {
  border-color: #4dabf7;
  background: rgba(77, 171, 247, 0.1);
}

.dark-theme .drop-hint {
  color: #4dabf7;
}

/* 只读模式 */
.readonly .grid-item-header {
  display: none;
}

.readonly .grid-item-body {
  padding: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .grid-item-header {
    padding: 6px 8px;
    font-size: 12px;
  }

  .grid-item-body {
    padding: 8px;
  }

  .action-btn {
    width: 20px;
    height: 20px;
  }
}
</style>
