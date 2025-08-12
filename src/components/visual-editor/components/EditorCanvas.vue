<template>
  <div class="editor-canvas" @click="handleCanvasClick">
    <!-- 画布网格背景 -->
    <div v-if="canvasStore.config.showGrid" class="canvas-grid" :style="gridStyle" />

    <!-- 渲染所有编辑器组件 -->
    <div
      v-for="item in editorItems"
      :key="item.id"
      class="canvas-item"
      :class="{
        selected: selectedIds.includes(item.id),
        locked: item.locked
      }"
      :style="getItemStyle(item)"
      @click.stop="handleItemClick(item.id, $event)"
      @mousedown="handleItemMouseDown(item.id, $event)"
    >
      <!-- 组件渲染 -->
      <component :is="getWidgetComponent(item)" v-bind="item.cardData.config" class="widget-content" />

      <!-- 选中状态指示器 -->
      <div v-if="selectedIds.includes(item.id)" class="selection-indicator">
        <!-- 选中边框 -->
        <div class="selection-border" />

        <!-- 尺寸调整手柄 -->
        <div
          v-for="handle in resizeHandles"
          :key="handle"
          :class="`resize-handle resize-handle-${handle}`"
          @mousedown.stop="handleResizeStart(item.id, handle, $event)"
        />
      </div>
    </div>

    <!-- 多选框 -->
    <div v-if="selectionBox" class="selection-box" :style="selectionBoxStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '@/components/panelv2/store/canvasStore'
import { TextWidget, ImageWidget } from '../widgets'
import { isEditorItem, getWidgetType } from '../utils/adapter'
import type { BaseCanvasItem } from '@/components/panelv2/types/core'

// 使用canvas store
const canvasStore = useCanvasStore()
const { selectedIds } = storeToRefs(canvasStore)

// 组件映射
const widgetComponents = {
  text: TextWidget,
  image: ImageWidget
}

// 调整手柄
const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

// 多选框状态
const selectionBox = ref<{
  startX: number
  startY: number
  currentX: number
  currentY: number
} | null>(null)

// 拖拽状态
const dragState = ref<{
  isDragging: boolean
  startX: number
  startY: number
  startItemPosition: { x: number; y: number }
} | null>(null)

// 计算属性
const editorItems = computed(() => canvasStore.items.filter(isEditorItem))

const gridStyle = computed(() => {
  const gridSize = canvasStore.config.gridSize || 10
  return {
    backgroundImage: `
      linear-gradient(to right, rgba(156, 163, 175, 0.2) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(156, 163, 175, 0.2) 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`
  }
})

const selectionBoxStyle = computed(() => {
  if (!selectionBox.value) return {}

  const { startX, startY, currentX, currentY } = selectionBox.value
  const left = Math.min(startX, currentX)
  const top = Math.min(startY, currentY)
  const width = Math.abs(currentX - startX)
  const height = Math.abs(currentY - startY)

  return {
    left: left + 'px',
    top: top + 'px',
    width: width + 'px',
    height: height + 'px'
  }
})

// 获取组件样式
const getItemStyle = (item: BaseCanvasItem) => ({
  position: 'absolute' as const,
  left: item.position.x + 'px',
  top: item.position.y + 'px',
  width: item.size.width + 'px',
  height: item.size.height + 'px',
  zIndex: item.zIndex,
  opacity: item.visible ? 1 : 0.5,
  cursor: item.locked ? 'not-allowed' : 'move'
})

// 获取组件实例
const getWidgetComponent = (item: BaseCanvasItem) => {
  const widgetType = getWidgetType(item)
  return widgetType ? widgetComponents[widgetType] : null
}

// 事件处理
const handleCanvasClick = () => {
  canvasStore.clearSelection()
}

const handleItemClick = (id: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd + 点击：切换选择
    canvasStore.toggleSelection(id)
  } else {
    // 普通点击：单选
    canvasStore.selectItems([id])
  }
}

const handleItemMouseDown = (id: string, event: MouseEvent) => {
  if (event.button !== 0) return // 只处理左键

  const item = canvasStore.getItem(id)
  if (!item || item.locked) return

  // 如果点击的项目未被选中，先选中它
  if (!selectedIds.value.includes(id)) {
    canvasStore.selectItems([id])
  }

  // 开始拖拽
  dragState.value = {
    isDragging: false,
    startX: event.clientX,
    startY: event.clientY,
    startItemPosition: { ...item.position }
  }

  // 监听鼠标移动和释放
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!dragState.value) return

  const deltaX = event.clientX - dragState.value.startX
  const deltaY = event.clientY - dragState.value.startY

  // 如果移动距离足够大，开始拖拽
  if (!dragState.value.isDragging && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
    dragState.value.isDragging = true
  }

  if (dragState.value.isDragging) {
    // 更新所有选中项目的位置
    const updates = selectedIds.value
      .map(id => {
        const item = canvasStore.getItem(id)
        if (!item) return null

        const newX = dragState.value!.startItemPosition.x + deltaX
        const newY = dragState.value!.startItemPosition.y + deltaY

        return {
          id,
          updates: {
            position: { x: Math.max(0, newX), y: Math.max(0, newY) }
          }
        }
      })
      .filter(Boolean)

    if (updates.length > 0) {
      canvasStore.updateItems(updates as any)
    }
  }
}

const handleMouseUp = () => {
  dragState.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const handleResizeStart = (id: string, handle: string, event: MouseEvent) => {
  event.stopPropagation()
  console.log('开始调整大小:', id, handle)
  // TODO: 实现尺寸调整逻辑
}
</script>

<style scoped>
.editor-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: var(--n-body-color);
  overflow: hidden;
  user-select: none;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.canvas-item {
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.canvas-item:hover {
  border-color: rgba(24, 160, 88, 0.3);
}

.canvas-item.selected {
  border-color: var(--n-primary-color);
}

.canvas-item.locked {
  opacity: 0.7;
  cursor: not-allowed;
}

.widget-content {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.selection-indicator {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  pointer-events: none;
}

.selection-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid var(--n-primary-color);
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--n-primary-color);
  border: 1px solid #fff;
  pointer-events: auto;
  cursor: pointer;
}

.resize-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
.resize-handle-n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}
.resize-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}
.resize-handle-e {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: e-resize;
}
.resize-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
.resize-handle-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
.resize-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
.resize-handle-w {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  cursor: w-resize;
}

.selection-box {
  position: absolute;
  border: 1px dashed var(--n-primary-color);
  background: rgba(24, 160, 88, 0.1);
  pointer-events: none;
}
</style>
