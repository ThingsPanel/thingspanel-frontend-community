<template>
  <div
    class="canvas"
    @click="handleCanvasClick"
    @drop="handleDrop"
    @dragover.prevent
    @contextmenu.prevent="handleCanvasContextMenu"
  >
    <div
      v-for="node in nodes"
      :key="node.id"
      class="canvas-node"
      :class="{ selected: selectedIds.includes(node.id) }"
      :style="getNodeStyle(node)"
      @click.stop="handleNodeClick(node.id, $event)"
      @mousedown="handleNodeMouseDown(node.id, $event)"
      @contextmenu.stop.prevent="handleNodeContextMenu(node.id, $event)"
    >
      <component :is="getWidgetComponent(node.type)" v-bind="node.properties" />

      <!-- 选中时显示调整大小的控制点 -->
      <div v-if="selectedIds.includes(node.id)" class="resize-handles">
        <div
          v-for="handle in resizeHandles"
          :key="handle.position"
          :class="`resize-handle resize-handle-${handle.position}`"
          @mousedown.stop="handleResizeStart(node.id, handle.position, $event)"
        />
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :selected-ids="selectedIds"
      @select="handleContextMenuAction"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useEditor } from '../../hooks/useEditor'
import TextWidget from '../../widgets/custom/TextWidget/TextWidget.vue'
import ImageWidget from '../../widgets/custom/ImageWidget/ImageWidget.vue'
import BarChartWidget from '../../widgets/custom/BarChartWidget/BarChartWidget.vue'
import DigitIndicatorWidget from '../../widgets/custom/DigitIndicatorWidget/DigitIndicatorWidget.vue'
import DigitIndicatorChartWidget from '../../widgets/chart/DigitIndicatorChartWidget/DigitIndicatorChartWidget.vue'
import BarChartChartWidget from '../../widgets/chart/BarChartChartWidget/BarChartChartWidget.vue'
import ContextMenu from './ContextMenu.vue'
import type { GraphData } from '../../types'

const { stateManager, selectNode, updateNode, addWidget } = useEditor()

const nodes = computed(() => stateManager.canvasState.value.nodes)
const selectedIds = computed(() => stateManager.canvasState.value.selectedIds)

const widgetComponents = {
  text: TextWidget,
  image: ImageWidget,
  'bar-chart': BarChartWidget,
  'line-chart': BarChartWidget, // 暂时复用柱状图
  'pie-chart': BarChartWidget, // 暂时复用柱状图
  'digit-indicator': DigitIndicatorWidget,
  // 真实的chart-card组件
  'chart-digit-indicator': DigitIndicatorChartWidget,
  'chart-bar': BarChartChartWidget
}

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragNodeId = ref<string | null>(null)
const resizeNodeId = ref<string | null>(null)
const resizeDirection = ref<string>('')

// 网格设置
const GRID_SIZE = 10

// 网格吸附函数
const snapToGrid = (value: number) => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

// 右键菜单状态
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

// 调整大小的控制点
const resizeHandles = [
  { position: 'nw' },
  { position: 'n' },
  { position: 'ne' },
  { position: 'w' },
  { position: 'e' },
  { position: 'sw' },
  { position: 's' },
  { position: 'se' }
]

const getWidgetComponent = (type: string) => {
  return widgetComponents[type as keyof typeof widgetComponents]
}

const getNodeStyle = (node: GraphData) => ({
  position: 'absolute' as const,
  left: node.x + 'px',
  top: node.y + 'px',
  width: node.width + 'px',
  height: node.height + 'px'
})

const handleCanvasClick = () => {
  stateManager.clearSelection()
}

const handleNodeClick = (id: string, event?: MouseEvent) => {
  if (event?.ctrlKey || event?.metaKey) {
    // Ctrl/Cmd + 点击：多选
    const currentSelected = selectedIds.value
    if (currentSelected.includes(id)) {
      // 取消选择
      const newSelected = currentSelected.filter(nodeId => nodeId !== id)
      stateManager.selectNodes(newSelected)
    } else {
      // 添加到选择
      stateManager.selectNodes([...currentSelected, id])
    }
  } else {
    // 普通点击：单选
    selectNode(id)
  }
}

// 拖拽移动功能
const handleNodeMouseDown = (nodeId: string, event: MouseEvent) => {
  event.preventDefault()
  isDragging.value = true
  dragNodeId.value = nodeId
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }

  // 选中节点
  selectNode(nodeId)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 调整大小功能
const handleResizeStart = (nodeId: string, direction: string, event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  resizeNodeId.value = nodeId
  resizeDirection.value = direction
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value && !isResizing.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  if (isDragging.value && dragNodeId.value) {
    // 拖拽移动
    const node = nodes.value.find(n => n.id === dragNodeId.value)
    if (node) {
      const newX = Math.max(0, node.x + deltaX)
      const newY = Math.max(0, node.y + deltaY)

      updateNode(dragNodeId.value, {
        x: snapToGrid(newX),
        y: snapToGrid(newY)
      })
      dragStartPos.value = { x: event.clientX, y: event.clientY }
    }
  } else if (isResizing.value && resizeNodeId.value) {
    // 调整大小
    const node = nodes.value.find(n => n.id === resizeNodeId.value)
    if (node) {
      const updates: Partial<GraphData> = {}

      // 根据调整方向计算新的位置和大小
      if (resizeDirection.value.includes('n')) {
        const newY = Math.max(0, node.y + deltaY)
        const newHeight = Math.max(20, node.height - deltaY)
        updates.y = snapToGrid(newY)
        updates.height = snapToGrid(newHeight)
      }
      if (resizeDirection.value.includes('s')) {
        const newHeight = Math.max(20, node.height + deltaY)
        updates.height = snapToGrid(newHeight)
      }
      if (resizeDirection.value.includes('w')) {
        const newX = Math.max(0, node.x + deltaX)
        const newWidth = Math.max(20, node.width - deltaX)
        updates.x = snapToGrid(newX)
        updates.width = snapToGrid(newWidth)
      }
      if (resizeDirection.value.includes('e')) {
        const newWidth = Math.max(20, node.width + deltaX)
        updates.width = snapToGrid(newWidth)
      }

      updateNode(resizeNodeId.value, updates)
      dragStartPos.value = { x: event.clientX, y: event.clientY }
    }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  dragNodeId.value = null
  resizeNodeId.value = null
  resizeDirection.value = ''

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 拖放创建组件
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const widgetType = event.dataTransfer?.getData('text/plain')
  if (widgetType) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 创建新组件
    addWidget(widgetType, { x, y })
  }
}

// 清理事件监听
onMounted(() => {
  // 防止页面滚动时的事件冲突
  document.addEventListener('selectstart', e => {
    if (isDragging.value || isResizing.value) {
      e.preventDefault()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// 右键菜单处理
const handleCanvasContextMenu = (event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
}

const handleNodeContextMenu = (nodeId: string, event: MouseEvent) => {
  // 如果节点未选中，先选中它
  if (!selectedIds.value.includes(nodeId)) {
    selectNode(nodeId)
  }

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextMenuAction = (action: string) => {
  switch (action) {
    case 'copy':
      // TODO: 实现复制功能
      console.log('复制选中的组件')
      break
    case 'delete':
      // 删除选中的组件
      selectedIds.value.forEach(id => {
        stateManager.removeNode(id)
      })
      break
    case 'layer':
      // TODO: 实现图层管理
      console.log('图层管理')
      break
    case 'lock':
      // TODO: 实现锁定功能
      console.log('锁定组件')
      break
  }
}
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  user-select: none;
}

.canvas-node {
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  cursor: move;
  position: relative;
}

.canvas-node:hover {
  border-color: rgba(24, 160, 88, 0.3);
}

.canvas-node.selected {
  border-color: var(--n-primary-color);
}

/* 调整大小控制点容器 */
.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

/* 调整大小控制点 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--n-primary-color);
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: all;
  z-index: 10;
}

/* 控制点位置 */
.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-n {
  top: 0;
  left: 50%;
  cursor: n-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: translate(50%, -50%);
}

.resize-handle-w {
  top: 50%;
  left: 0;
  cursor: w-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-e {
  top: 50%;
  right: 0;
  cursor: e-resize;
  transform: translate(50%, -50%);
}

.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: translate(-50%, 50%);
}

.resize-handle-s {
  bottom: 0;
  left: 50%;
  cursor: s-resize;
  transform: translate(-50%, 50%);
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
  transform: translate(50%, 50%);
}

/* 拖拽时的样式 */
.canvas-node.dragging {
  transition: none;
  z-index: 1000;
}
</style>
