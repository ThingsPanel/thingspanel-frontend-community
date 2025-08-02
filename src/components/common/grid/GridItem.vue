<!--
  GridItem - 单个网格项组件
  集成vue-draggable-resizable实现拖拽和调整大小功能
-->
<template>
  <vue-draggable-resizable
    :x="pixelPosition.x"
    :y="pixelPosition.y"
    :w="pixelSize.width"
    :h="pixelSize.height"
    :min-width="minPixelWidth"
    :min-height="minPixelHeight"
    :max-width="maxPixelWidth"
    :max-height="maxPixelHeight"
    :grid="gridSnap"
    :resizable="!readonly && item.resizable !== false"
    :draggable="!readonly && item.draggable !== false && !item.locked"
    :prevent-deactivation="true"
    :class-name-draggable="dragClass"
    :class-name-resizable="resizeClass"
    :class-name-dragging="draggingClass"
    :class-name-resizing="resizingClass"
    @drag-start="handleDragStart"
    @dragging="handleDragging"
    @drag-stop="handleDragStop"
    @resize-start="handleResizeStart"
    @resizing="handleResizing"
    @resize-stop="handleResizeStop"
    @click="handleClick"
    @dblclick="handleDblclick"
  >
    <div 
      class="grid-item-content"
      :class="contentClass"
      :style="[contentStyle, item.style]"
    >
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
  </vue-draggable-resizable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// 动态导入vue-draggable-resizable以避免SSR问题
import VueDraggableResizable from 'vue-draggable-resizable'
import type { GridItem, GridConfig } from './types'
import { 
  getItemPixelPosition, 
  getItemPixelSize, 
  calculateColWidth,
  pixelToGrid,
  gridToPixel,
  constrainItemToBounds
} from './utils'

// 引入样式
import 'vue-draggable-resizable/style.css'

// Props
interface Props {
  item: GridItem
  config: GridConfig
  style?: Record<string, any>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  style: () => ({}),
  readonly: false
})

// Emits
interface Emits {
  (e: 'drag-start', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'drag-move', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'drag-end', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'resize-start', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'resize-move', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'resize-end', item: GridItem, event: MouseEvent | TouchEvent): void
  (e: 'click', item: GridItem, event: MouseEvent): void
  (e: 'dblclick', item: GridItem, event: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 假设容器宽度 (实际应该从父组件传入或计算)
const containerWidth = ref(1200)

// 计算像素位置
const pixelPosition = computed(() => {
  return getItemPixelPosition(props.item, props.config, containerWidth.value)
})

// 计算像素尺寸
const pixelSize = computed(() => {
  return getItemPixelSize(props.item, props.config, containerWidth.value)
})

// 计算列宽
const colWidth = computed(() => {
  return calculateColWidth(props.config, containerWidth.value)
})

// 最小像素宽度
const minPixelWidth = computed(() => {
  const minCols = props.item.minColSpan || 1
  return minCols * colWidth.value + (minCols - 1) * props.config.gap
})

// 最小像素高度
const minPixelHeight = computed(() => {
  const minRows = props.item.minRowSpan || 1
  return minRows * props.config.rowHeight + (minRows - 1) * props.config.gap
})

// 最大像素宽度
const maxPixelWidth = computed(() => {
  const maxCols = props.item.maxColSpan || props.config.columns
  return maxCols * colWidth.value + (maxCols - 1) * props.config.gap
})

// 最大像素高度
const maxPixelHeight = computed(() => {
  const maxRows = props.item.maxRowSpan || 20
  return maxRows * props.config.rowHeight + (maxRows - 1) * props.config.gap
})

// 网格吸附
const gridSnap = computed(() => [
  colWidth.value + props.config.gap,
  props.config.rowHeight + props.config.gap
])

// 样式类名
const dragClass = computed(() => [
  'grid-item',
  'grid-item-draggable',
  { 'grid-item-locked': props.item.locked }
])

const resizeClass = computed(() => [
  'grid-item-resizable'
])

const draggingClass = computed(() => [
  'grid-item-dragging'
])

const resizingClass = computed(() => [
  'grid-item-resizing'
])

const contentClass = computed(() => [
  'grid-item-inner',
  props.item.className,
  {
    'readonly': props.readonly,
    'locked': props.item.locked,
    'no-resize': !props.item.resizable,
    'no-drag': !props.item.draggable
  }
])

const contentStyle = computed(() => ({
  zIndex: props.item.zIndex || 1,
  ...props.style
}))

// 像素位置转网格坐标
const pixelToGridPosition = (x: number, y: number) => {
  const col = pixelToGrid(x, colWidth.value, props.config.gap)
  const row = pixelToGrid(y, props.config.rowHeight, props.config.gap)
  return { col, row }
}

// 像素尺寸转网格尺寸
const pixelToGridSize = (width: number, height: number) => {
  const colSpan = Math.max(1, Math.round(width / (colWidth.value + props.config.gap)))
  const rowSpan = Math.max(1, Math.round(height / (props.config.rowHeight + props.config.gap)))
  return { colSpan, rowSpan }
}

// 拖拽开始
const handleDragStart = (event: any) => {
  emit('drag-start', props.item, event)
}

// 拖拽中
const handleDragging = (x: number, y: number, event: any) => {
  const position = pixelToGridPosition(x, y)
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: position.col,
    gridRow: position.row
  }
  
  emit('drag-move', updatedItem, event)
}

// 拖拽结束
const handleDragStop = (x: number, y: number, event: any) => {
  const position = pixelToGridPosition(x, y)
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: position.col,
    gridRow: position.row
  }
  
  emit('drag-end', updatedItem, event)
}

// 调整大小开始
const handleResizeStart = (event: any) => {
  emit('resize-start', props.item, event)
}

// 调整大小中
const handleResizing = (x: number, y: number, width: number, height: number, event: any) => {
  const position = pixelToGridPosition(x, y)
  const size = pixelToGridSize(width, height)
  
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: position.col,
    gridRow: position.row,
    gridColSpan: size.colSpan,
    gridRowSpan: size.rowSpan
  }
  
  emit('resize-move', updatedItem, event)
}

// 调整大小结束
const handleResizeStop = (x: number, y: number, width: number, height: number, event: any) => {
  const position = pixelToGridPosition(x, y)
  const size = pixelToGridSize(width, height)
  
  const updatedItem: GridItem = {
    ...props.item,
    gridCol: position.col,
    gridRow: position.row,
    gridColSpan: size.colSpan,
    gridRowSpan: size.rowSpan
  }
  
  emit('resize-end', updatedItem, event)
}

// 点击事件
const handleClick = (event: MouseEvent) => {
  emit('click', props.item, event)
}

// 双击事件
const handleDblclick = (event: MouseEvent) => {
  emit('dblclick', props.item, event)
}
</script>

<style scoped>
.grid-item-content {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: var(--n-card-color, #ffffff);
  border: 1px solid var(--n-border-color, #e0e0e6);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.grid-item-content:hover {
  border-color: var(--n-primary-color, #18a058);
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.15);
}

.grid-item-content.readonly {
  pointer-events: none;
  opacity: 0.8;
}

.grid-item-content.locked {
  border-color: #f56565;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(245, 101, 101, 0.1) 10px,
    rgba(245, 101, 101, 0.1) 20px
  );
}

.grid-item-inner {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.default-content {
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

/* vue-draggable-resizable样式覆盖 */
:deep(.vdr) {
  border: none !important;
}

:deep(.vdr:hover) {
  border: none !important;
}

:deep(.vdr.active) {
  border: 2px solid var(--n-primary-color, #18a058) !important;
}

:deep(.vdr.dragging) {
  opacity: 0.8;
  z-index: 999 !important;
}

:deep(.vdr.resizing) {
  opacity: 0.8;
}

/* 调整大小控制点样式 */
:deep(.handle) {
  background: var(--n-primary-color, #18a058);
  border: 1px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

:deep(.handle-tl), :deep(.handle-tr), 
:deep(.handle-bl), :deep(.handle-br) {
  width: 8px;
  height: 8px;
}

:deep(.handle-tm), :deep(.handle-bm) {
  width: 20px;
  height: 6px;
}

:deep(.handle-ml), :deep(.handle-mr) {
  width: 6px;
  height: 20px;
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