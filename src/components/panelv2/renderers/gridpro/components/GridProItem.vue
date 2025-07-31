<!--
  GridPro 项目组件
  负责单个网格项目的渲染、拖拽手柄、调整大小手柄等
-->

<template>
  <div
    ref="itemRef"
    class="gridpro-item"
    :class="itemClasses"
    :style="itemStyles"
    :data-item-id="item.id"
    @pointerdown="handlePointerDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 项目内容 -->
    <div class="gridpro-item__content">
      <!-- 使用现有的 CardRenderer 组件渲染卡片 -->
      <CardRenderer
        v-if="item.data"
        :item="item.data"
        :readonly="false"
        class="gridpro-item__card"
      />
      <div v-else class="gridpro-item__placeholder">
        <div class="gridpro-item__placeholder-title">Empty Item</div>
        <div class="gridpro-item__placeholder-id">{{ item.id }}</div>
      </div>
    </div>

    <!-- 选中指示器 -->
    <div
      v-if="isSelected"
      class="gridpro-item__selection-indicator"
    />

    <!-- 拖拽手柄 -->
    <div
      v-if="showDragHandle"
      class="gridpro-item__drag-handle"
      @pointerdown.stop="handleDragStart"
    >
      <DragIcon />
    </div>

    <!-- 调整大小手柄 -->
    <template v-if="showResizeHandles">
      <div
        v-for="handle in resizeHandles"
        :key="handle"
        :class="`gridpro-item__resize-handle gridpro-item__resize-handle--${handle}`"
        :style="{ cursor: getResizeCursor(handle) }"
        @pointerdown.stop="handleResizeStart($event, handle)"
      />
    </template>

    <!-- 项目信息覆盖层（调试模式） -->
    <div
      v-if="config.debug"
      class="gridpro-item__debug-overlay"
    >
      <div class="gridpro-item__debug-info">
        <div>ID: {{ item.id }}</div>
        <div>Grid: {{ item.x }},{{ item.y }} ({{ item.w }}×{{ item.h }})</div>
        <div v-if="item.minW || item.minH">Min: {{ item.minW || '-' }}×{{ item.minH || '-' }}</div>
        <div v-if="item.maxW || item.maxH">Max: {{ item.maxW || '-' }}×{{ item.maxH || '-' }}</div>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div
      v-if="isLoading"
      class="gridpro-item__loading"
    >
      <n-spin size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NSpin } from 'naive-ui'
import { MoveOutline as DragIcon } from '@vicons/ionicons5'

import CardRenderer from '../../CardRenderer.vue'
import type { GridProItem, GridProConfig, ResizeHandle, Rectangle } from '../types/gridpro'
import type { BaseCanvasItem } from '../../../types/core'
import { GridCalculator } from '../utils/gridAlgorithms'

interface Props {
  item: GridProItem
  config: GridProConfig
  calculator: GridCalculator
  isSelected?: boolean
  isDragging?: boolean
  isResizing?: boolean
}

interface Emits {
  (e: 'drag-start', itemId: string, startEvent: PointerEvent, element: HTMLElement): void
  (e: 'drag-move', itemId: string, position: { x: number; y: number }): void
  (e: 'drag-end', itemId: string, finalPosition: { x: number; y: number }): void
  (e: 'resize-start', itemId: string, handle: ResizeHandle, startEvent: PointerEvent, element: HTMLElement): void
  (e: 'resize-move', itemId: string, bounds: Rectangle): void
  (e: 'resize-end', itemId: string, finalBounds: Rectangle): void
  (e: 'select', itemId: string, event: Event): void
  (e: 'contextmenu', itemId: string, event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isDragging: false,
  isResizing: false
})

const emit = defineEmits<Emits>()

// 模板引用
const itemRef = ref<HTMLElement>()

// 组件状态  
const isLoading = ref(false)

// 计算属性
const itemClasses = computed(() => ({
  'gridpro-item--selected': props.isSelected,
  'gridpro-item--dragging': props.isDragging,
  'gridpro-item--resizing': props.isResizing,
  'gridpro-item--static': props.item.static,
  'gridpro-item--loading': isLoading.value
}))

const itemStyles = computed(() => {
  const bounds = props.calculator.getItemBounds(props.item)
  return {
    position: 'absolute',
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    zIndex: props.isDragging ? 1000 : props.item.data?.zIndex || 1,
    transform: props.isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: props.isDragging ? 'none' : 'all 0.2s ease'
  }
})

const showDragHandle = computed(() => {
  return props.config.enableDrag && 
         props.item.isDraggable !== false && 
         !props.item.static &&
         (props.isSelected || props.config.alwaysShowDragHandle)
})

const showResizeHandles = computed(() => {
  return props.config.enableResize && 
         props.item.isResizable !== false && 
         !props.item.static &&
         props.isSelected
})

const resizeHandles = computed((): ResizeHandle[] => {
  if (!showResizeHandles.value) return []
  return props.item.resizeHandles || ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']
})


// 生命周期
onMounted(() => {
  // 向虚拟化系统注册元素
  if (itemRef.value && props.config.virtualization) {
    // 这里应该调用虚拟化系统的注册方法
    // registerItemElement(props.item.id, itemRef.value)
  }
})

onUnmounted(() => {
  // 从虚拟化系统注销元素
  if (props.config.virtualization) {
    // unregisterItemElement(props.item.id)
  }
})

// 方法

const getResizeCursor = (handle: ResizeHandle): string => {
  const cursors: Record<ResizeHandle, string> = {
    'se': 'se-resize',
    'sw': 'sw-resize', 
    'ne': 'ne-resize',
    'nw': 'nw-resize',
    'n': 'n-resize',
    's': 's-resize',
    'e': 'e-resize',
    'w': 'w-resize'
  }
  return cursors[handle] || 'default'
}

// 事件处理器
const handlePointerDown = (event: PointerEvent) => {
  // 只有在点击项目本身时才触发选择
  if (event.target === itemRef.value || 
      (event.target as HTMLElement)?.closest('.gridpro-item__content')) {
    emit('select', props.item.id, event)
  }
}

const handleDragStart = (event: PointerEvent) => {
  if (!props.item.isDraggable || props.item.static) return
  
  event.preventDefault()
  event.stopPropagation()
  
  if (itemRef.value) {
    emit('drag-start', props.item.id, event, itemRef.value)
  }
}

const handleResizeStart = (event: PointerEvent, handle: ResizeHandle) => {
  if (!props.item.isResizable || props.item.static) return
  
  event.preventDefault()
  event.stopPropagation()
  
  if (itemRef.value) {
    emit('resize-start', props.item.id, handle, event, itemRef.value)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', props.item.id, event)
}

// 暴露方法给父组件
defineExpose({
  element: itemRef
})
</script>

<style scoped>
.gridpro-item {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gridpro-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.gridpro-item--selected {
  box-shadow: 0 0 0 2px #1890ff, 0 4px 16px rgba(24, 144, 255, 0.3);
}

.gridpro-item--dragging {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.gridpro-item--resizing {
  box-shadow: 0 0 0 2px #52c41a, 0 4px 16px rgba(82, 196, 26, 0.3);
}

.gridpro-item--static {
  opacity: 0.8;
  cursor: default;
}

.gridpro-item--loading {
  pointer-events: none;
}

.gridpro-item__content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.gridpro-item__card {
  width: 100%;
  height: 100%;
}

.gridpro-item__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  color: #999;
}

.gridpro-item__placeholder-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.gridpro-item__placeholder-id {
  font-size: 12px;
  opacity: 0.7;
}

.gridpro-item__selection-indicator {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #1890ff;
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
}

.gridpro-item__drag-handle {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  z-index: 11;
}

.gridpro-item__drag-handle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.2);
}

.gridpro-item__drag-handle:active {
  cursor: grabbing;
}

.gridpro-item__resize-handle {
  position: absolute;
  background: #1890ff;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 12;
}

.gridpro-item--selected .gridpro-item__resize-handle {
  opacity: 1;
}

.gridpro-item__resize-handle--se {
  bottom: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gridpro-item__resize-handle--sw {
  bottom: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gridpro-item__resize-handle--ne {
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gridpro-item__resize-handle--nw {
  top: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gridpro-item__resize-handle--n {
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

.gridpro-item__resize-handle--s {
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

.gridpro-item__resize-handle--e {
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  border-radius: 2px;
}

.gridpro-item__resize-handle--w {
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  border-radius: 2px;
}

.gridpro-item__debug-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.1);
  pointer-events: none;
  z-index: 13;
}

.gridpro-item__debug-info {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 10px;
  font-family: monospace;
  color: red;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 2px;
  line-height: 1.2;
}

.gridpro-item__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 14;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridpro-item__drag-handle {
    width: 24px;
    height: 24px;
  }
  
  .gridpro-item__resize-handle--se,
  .gridpro-item__resize-handle--sw,
  .gridpro-item__resize-handle--ne,
  .gridpro-item__resize-handle--nw {
    width: 12px;
    height: 12px;
  }
  
  .gridpro-item__resize-handle--n,
  .gridpro-item__resize-handle--s {
    width: 30px;
    height: 6px;
  }
  
  .gridpro-item__resize-handle--e,
  .gridpro-item__resize-handle--w {
    width: 6px;
    height: 30px;
  }
}
</style>