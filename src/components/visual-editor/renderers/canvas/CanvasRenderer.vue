<template>
  <BaseRendererComponent
    :readonly="readonly"
    :config="canvasConfig"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div
      class="canvas grid-background-base"
      :class="{
        'show-grid': canvasConfig.showGrid,
        'preview-mode': isPreviewMode.value
      }"
      @click="handleCanvasClick"
      @contextmenu.prevent="handleCanvasContextMenu"
    >
      <div
        v-for="node in nodes"
        :key="node.id"
        class="canvas-node"
        :class="{
          selected: selectedIds.includes(node.id) && !isPreviewMode.value,
          readonly: readonly || isPreviewMode.value,
          'preview-mode': isPreviewMode.value
        }"
        :style="getNodeStyle(node)"
        @click.stop="handleNodeClick(node.id, $event)"
        @mousedown="handleNodeMouseDown(node.id, $event)"
        @contextmenu.stop.prevent="handleNodeContextMenu(node.id, $event)"
      >
        <WidgetHeader
          v-if="showWidgetTitles"
          :title="node.label || node.type"
          :readonly="readonly"
          @update:title="newTitle => handleTitleUpdate(node.id, newTitle)"
        />
        <div class="widget-body">
          <Card2Wrapper
            v-if="node.metadata?.isCard2Component"
            :component-type="node.type"
            :config="node.properties"
            :data="node.metadata?.card2Data"
            :node-id="node.id"
            @error="handleCard2Error"
          />
          <component :is="getWidgetComponent(node.type)" v-else v-bind="node.properties" />

          <div v-if="selectedIds.includes(node.id) && !readonly && !isPreviewMode.value" class="resize-handles">
            <div
              v-for="handle in resizeHandles"
              :key="handle.position"
              :class="`resize-handle resize-handle-${handle.position}`"
              @mousedown.stop="handleResizeStart(node.id, handle.position, $event)"
            />
          </div>
        </div>
      </div>

      <ContextMenu
        v-if="!readonly"
        :show="contextMenu.show"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :selected-widgets="selectedNodes"
        @select="handleContextMenuAction"
        @close="closeContextMenu"
      />
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import { useEditor } from '../../hooks/useEditor'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import TextWidget from '../../widgets/custom/TextWidget/TextWidget.vue'
import ImageWidget from '../../widgets/custom/ImageWidget/ImageWidget.vue'
import ContextMenu from './ContextMenu.vue'
import Card2Wrapper from './Card2Wrapper.vue'
import WidgetHeader from '../../components/common/WidgetHeader.vue'
import type { GraphData } from '../../types'

// Props, Emits, Configs
interface CanvasConfig {
  showGrid?: boolean
  backgroundColor?: string
  width?: number
  height?: number
  snapToGrid?: boolean
  gridSize?: number
}
interface Props {
  readonly?: boolean
  config?: CanvasConfig
  showWidgetTitles?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    showGrid: true,
    backgroundColor: '#f5f5f5',
    width: 1200,
    height: 800,
    snapToGrid: true,
    gridSize: 10
  }),
  showWidgetTitles: false
})
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', id: string): void
  (e: 'canvas-click', event?: MouseEvent): void
  (e: 'request-settings', id: string): void
}
const emit = defineEmits<Emits>()
// 根据预览模式动态调整画布配置
const canvasConfig = computed(() => ({
  ...props.config,
  showGrid: isPreviewMode.value ? false : (props.config?.showGrid ?? true),
  snapToGrid: isPreviewMode.value ? false : (props.config?.snapToGrid ?? true)
}))

const { stateManager, widgetStore, selectNode, updateNode, addNode, removeNode } = useEditor()

// 全局预览模式
const { isPreviewMode, rendererConfig } = globalPreviewMode

const nodes = computed(() => stateManager.nodes)
const selectedIds = computed(() => widgetStore.selectedIds)
const selectedNodes = computed(() => nodes.value.filter(n => selectedIds.value.includes(n.id)))

const onRendererReady = () => emit('ready')
const onRendererError = (error: Error) => emit('error', error)
const onNodeSelect = (nodeId: string) => emit('node-select', nodeId)
const onCanvasClick = (event?: MouseEvent) => emit('canvas-click', event)

const widgetComponents = { text: TextWidget, image: ImageWidget }

const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragNodeId = ref<string | null>(null)
const resizeNodeId = ref<string | null>(null)
const resizeDirection = ref<string>('')

const snapToGrid = (value: number) => {
  const gridSize = canvasConfig.value.gridSize || 10
  return canvasConfig.value.snapToGrid ? Math.round(value / gridSize) * gridSize : value
}

const contextMenu = ref({ show: false, x: 0, y: 0 })
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
const getWidgetComponent = (type: string) => widgetComponents[type as keyof typeof widgetComponents]
const getNodeStyle = (node: GraphData) => ({
  position: 'absolute' as const,
  left: `${node.x}px`,
  top: `${node.y}px`,
  width: `${node.width}px`,
  height: `${node.height}px`
})
const handleCanvasClick = () => {
  if (!isPreviewMode.value) {
    stateManager.clearSelection()
  }
}

const handleNodeClick = (id: string, event?: MouseEvent) => {
  // 预览模式下禁用节点选择
  if (isPreviewMode.value) return

  if (event?.ctrlKey || event?.metaKey) {
    const newSelected = selectedIds.value.includes(id)
      ? selectedIds.value.filter(nodeId => nodeId !== id)
      : [...selectedIds.value, id]
    stateManager.selectNodes(newSelected)
  } else {
    selectNode(id)
  }
  emit('node-select', id)
}

const handleNodeMouseDown = (nodeId: string, event: MouseEvent) => {
  // 预览模式下禁用拖拽
  if (isPreviewMode.value) return

  event.preventDefault()
  isDragging.value = true
  dragNodeId.value = nodeId
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  if (!selectedIds.value.includes(nodeId)) selectNode(nodeId)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleResizeStart = (nodeId: string, direction: string, event: MouseEvent) => {
  // 预览模式下禁用调整大小
  if (isPreviewMode.value) return

  event.preventDefault()
  isResizing.value = true
  resizeNodeId.value = nodeId
  resizeDirection.value = direction
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value && !isResizing.value) return
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  if (isDragging.value && dragNodeId.value) {
    const node = nodes.value.find(n => n.id === dragNodeId.value)
    if (node) {
      updateNode(dragNodeId.value, { x: snapToGrid(node.x + deltaX), y: snapToGrid(node.y + deltaY) })
      dragStartPos.value = { x: event.clientX, y: event.clientY }
    }
  } else if (isResizing.value && resizeNodeId.value) {
    const node = nodes.value.find(n => n.id === resizeNodeId.value)
    if (node) {
      const updates: Partial<GraphData> = {}
      if (resizeDirection.value.includes('n')) {
        updates.y = snapToGrid(node.y + deltaY)
        updates.height = snapToGrid(node.height - deltaY)
      }
      if (resizeDirection.value.includes('s')) updates.height = snapToGrid(node.height + deltaY)
      if (resizeDirection.value.includes('w')) {
        updates.x = snapToGrid(node.x + deltaX)
        updates.width = snapToGrid(node.width - deltaX)
      }
      if (resizeDirection.value.includes('e')) updates.width = snapToGrid(node.width + deltaX)
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

onMounted(() => {
  document.addEventListener('selectstart', e => {
    if (isDragging.value || isResizing.value) e.preventDefault()
  })
  emit('ready')
})
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

const handleCanvasContextMenu = (event: MouseEvent) => {
  // 预览模式下禁用右键菜单
  if (isPreviewMode.value) return
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY }
}
const handleNodeContextMenu = (nodeId: string, event: MouseEvent) => {
  // 预览模式下禁用右键菜单
  if (isPreviewMode.value) return

  if (!selectedIds.value.includes(nodeId)) selectNode(nodeId)
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY }
}
const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextMenuAction = (action: string) => {
  const newNodes: GraphData[] = []
  selectedNodes.value.forEach(node => {
    switch (action) {
      case 'copy': {
        const newNode = JSON.parse(JSON.stringify(node))
        newNode.id = `${newNode.type}_${nanoid()}`
        newNode.x += 20
        newNode.y += 20
        newNodes.push(newNode)
        break
      }
      case 'delete':
        removeNode(node.id)
        break
      case 'settings':
        if (selectedNodes.value.length === 1) {
          emit('request-settings', selectedNodes.value[0].id)
        }
        break
    }
  })
  if (newNodes.length > 0) {
    addNode(...newNodes)
  }
}

const handleCard2Error = (error: Error) => {
  console.error('Card 2.1 Component Error:', error)
  emit('error', error)
}

const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  updateNode(nodeId, { label: newTitle })
}
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  user-select: none;
}
.canvas-node {
  display: flex;
  flex-direction: column;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  cursor: move;
  position: relative;
}
.widget-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.canvas-node:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
}
.canvas-node.selected {
  border-color: var(--n-primary-color);
  z-index: 1;
}
.canvas-node.readonly {
  cursor: default;
}
.canvas-node.readonly:hover {
  border-color: transparent;
}
.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}
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

/* 预览模式样式 */
.canvas-node.preview-mode {
  cursor: default !important;
}

.canvas-node.preview-mode:hover {
  border-color: transparent !important;
}
</style>
