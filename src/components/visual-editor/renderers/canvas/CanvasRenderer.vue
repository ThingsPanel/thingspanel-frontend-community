<template>
  <!-- 敬请期待界面 -->
  <div class="coming-soon-container">
    <div class="coming-soon-content">
      <div class="coming-soon-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <h2 class="coming-soon-title">敬请期待</h2>
      <p class="coming-soon-description">Canvas渲染器功能正在开发中，即将上线</p>
      <div class="coming-soon-features">
        <div class="feature-item">
          <span class="feature-icon">🎨</span>
          <span>拖拽式组件编辑</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📐</span>
          <span>网格对齐系统</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔧</span>
          <span>实时属性配置</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📱</span>
          <span>响应式布局</span>
        </div>
      </div>
      <div class="coming-soon-note">
        <n-alert type="info" size="small">
          <template #header>
            <span>开发进度</span>
          </template>
          当前功能已完成基础架构，正在完善交互体验和性能优化
        </n-alert>
      </div>
    </div>
  </div>

  <!-- 原有代码（已注释） -->
  <!--
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
      <NodeWrapper
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :node-id="node.id"
        :readonly="readonly || isPreviewMode.value"
        :is-selected="selectedIds.includes(node.id) && !isPreviewMode.value"
        :show-resize-handles="selectedIds.includes(node.id) && !readonly && !isPreviewMode.value"
        :get-widget-component="getWidgetComponent"
        class="canvas-node"
        :style="getNodeStyle(node)"
        @node-click="handleNodeClick"
        @node-mousedown="handleNodeMouseDown"
        @node-contextmenu="handleNodeContextMenu"
        @resize-start="handleResizeStart"
        @title-update="handleTitleUpdate"
        @component-error="handleCard2Error"
      />

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
  -->
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import { NAlert } from 'naive-ui'
// 注意：useEditor已迁移到新的统一架构，请使用useVisualEditor
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import NodeWrapper from '../base/NodeWrapper.vue'
import TextWidget from '../../widgets/custom/TextWidget/TextWidget.vue'
import ImageWidget from '../../widgets/custom/ImageWidget/ImageWidget.vue'
import ContextMenu from './ContextMenu.vue'
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

// 立即发出ready事件，表示组件已加载
onMounted(() => {
  emit('ready')
})

// 添加保存时的提示
const showSaveWarning = () => {
  // 这里可以触发一个全局的提示，告知用户功能尚未完成
  console.warn('Canvas功能尚未完成，无法保存')
  // 可以在这里添加一个全局的提示组件
}

// 暴露保存警告方法给父组件
defineExpose({
  showSaveWarning
})

// 原有代码（已注释）
/*
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
  console.log(`[CanvasRenderer] 标题更新: ${nodeId} -> "${newTitle}"`)
}
*/
</script>

<style scoped>
/* 敬请期待样式 */
.coming-soon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
}

.coming-soon-content {
  text-align: center;
  max-width: 500px;
}

.coming-soon-icon {
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.coming-soon-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.coming-soon-description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.coming-soon-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-icon {
  font-size: 1.2rem;
}

.coming-soon-note {
  margin-top: 1.5rem;
}

/* 原有样式（已注释） */
/*
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  user-select: none;
}

.canvas-node {
  cursor: move;
}

.canvas-node.readonly {
  cursor: default;
}

.canvas-node.preview-mode {
  cursor: default !important;
}
*/
</style>
