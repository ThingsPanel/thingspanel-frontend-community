<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div ref="rendererContainer" class="canvas-renderer" @click="onCanvasClick">
      <!-- Canvas 自由布局渲染区域 -->
      <div class="canvas-wrapper">
        <!-- 工具栏信息 -->
        <div class="canvas-info-bar">
          <n-space align="center">
            <n-tag type="info">Canvas 渲染器</n-tag>
            <n-text depth="3">节点数量: {{ nodes.length }}</n-text>
            <n-text depth="3">数据源: {{ Object.keys(multiDataSourceStore || {}).length }}</n-text>
            <n-text v-if="readonly" type="warning">只读模式</n-text>
          </n-space>
        </div>

        <!-- Canvas 画布区域 -->
        <div class="canvas-container" :class="{ 'show-grid': canvasConfig.showGrid }">
          <!-- 使用绝对定位渲染节点 -->
          <div
            v-for="node in nodes"
            :key="node.id"
            class="canvas-node-item"
            :class="{
              'selected': selectedNodes.includes(node.id),
              'readonly': readonly,
              'dragging': draggingNodeId === node.id,
              'resizing': resizingNodeId === node.id
            }"
            :style="{
              position: 'absolute',
              left: getNodePosition(node).x + 'px',
              top: getNodePosition(node).y + 'px',
              width: getNodeSize(node).width + 'px',
              height: getNodeSize(node).height + 'px'
            }"
            @click.stop="handleNodeClick(node.id)"
            @mousedown="handleNodeMouseDown(node.id, $event)"
          >
            <!-- 使用 NodeWrapper 渲染实际组件 -->
            <NodeWrapper
              :node="node"
              :node-id="node.id"
              :readonly="readonly"
              :is-selected="selectedNodes.includes(node.id)"
              :show-resize-handles="!readonly"
              :get-widget-component="() => null"
              :multi-data-source-data="multiDataSourceStore?.[node.id]"
              :multi-data-source-config="multiDataSourceConfigStore?.[node.id]"
              @node-click="() => handleNodeClick(node.id)"
              @title-update="handleTitleUpdate"
            />

            <!-- 节点信息叠加层 -->
            <div v-if="showWidgetTitles" class="node-info-overlay">
              <n-tag size="small" type="primary">{{ node.type }}</n-tag>
              <n-text depth="3" style="font-size: 12px;">{{ node.id }}</n-text>
            </div>

            <!-- 数据源指示器 -->
            <div v-if="multiDataSourceStore?.[node.id]" class="data-source-indicator">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-tag size="tiny" type="success">数据</n-tag>
                </template>
                已绑定数据源
              </n-tooltip>
            </div>

            <!-- 缩放手柄 -->
            <div
              v-if="selectedNodes.includes(node.id) && !readonly"
              class="resize-handles"
            >
              <div
                v-for="handle in resizeHandles"
                :key="handle.name"
                :class="['resize-handle', `resize-handle-${handle.name}`]"
                @mousedown.stop="handleResizeStart(node.id, handle.name, $event)"
              ></div>
            </div>
          </div>

          <!-- 空状态显示 -->
          <div v-if="nodes.length === 0" class="empty-state">
            <n-empty description="暂无节点数据">
              <template #icon>
                <n-icon size="48">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                    <path d="M2 17L12 22L22 17"/>
                    <path d="M2 12L12 17L22 12"/>
                  </svg>
                </n-icon>
              </template>
            </n-empty>
          </div>
        </div>
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
/**
 * Canvas 渲染器组件
 * 使用绝对定位实现自由画布布局，渲染真实的 Vue 组件
 */

import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
import { NSpace, NTag, NText, NTooltip, NEmpty, NIcon } from 'naive-ui'
// 添加配置事件监听
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// 添加数据源直接获取
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 添加配置管理器，用于数据源配置更新
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

interface CanvasConfig {
  showGrid?: boolean
  backgroundColor?: string
  width?: number
  height?: number
  snapToGrid?: boolean
  gridSize?: number
  enableSelection?: boolean
  enableGroupSelection?: boolean
  preserveObjectStacking?: boolean
}

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  canvasConfig?: CanvasConfig
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

// 使用原始的 store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 引用
const rendererContainer = ref<HTMLElement>()

// 计算属性
const nodes = computed(() => editorStore.nodes || [])
const selectedNodes = computed(() => widgetStore.selectedNodeIds || [])

// 选择节点方法
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

// 全局预览模式
const { isPreviewMode } = globalPreviewMode

// 只读模式计算属性
const readonly = computed(() => props.readonly || isPreviewMode.value)

// Canvas 配置
const canvasConfig = computed(() => ({
  showGrid: true,
  backgroundColor: '#f5f5f5',
  width: 1200,
  height: 800,
  snapToGrid: true,
  gridSize: 20,
  enableSelection: !readonly.value,
  enableGroupSelection: !readonly.value,
  preserveObjectStacking: true,
  ...props.canvasConfig
}))

// 数据源管理
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 拖拽和缩放状态
const draggingNodeId = ref<string>('')
const resizingNodeId = ref<string>('')
const resizeDirection = ref<string>('')
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartNodePos = ref({ x: 0, y: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

// 缩放手柄定义
const resizeHandles = [
  { name: 'nw', cursor: 'nw-resize' },
  { name: 'n', cursor: 'n-resize' },
  { name: 'ne', cursor: 'ne-resize' },
  { name: 'w', cursor: 'w-resize' },
  { name: 'e', cursor: 'e-resize' },
  { name: 'sw', cursor: 'sw-resize' },
  { name: 's', cursor: 's-resize' },
  { name: 'se', cursor: 'se-resize' }
]

/**
 * 获取节点位置
 */
const getNodePosition = (node: any) => {
  const canvasLayout = node.layout?.canvas || {}
  const gridstackLayout = node.layout?.gridstack || {}

  return {
    x: canvasLayout.x ?? (gridstackLayout.x ? gridstackLayout.x * 100 : Math.random() * 400),
    y: canvasLayout.y ?? (gridstackLayout.y ? gridstackLayout.y * 80 : Math.random() * 300)
  }
}

/**
 * 获取节点尺寸
 */
const getNodeSize = (node: any) => {
  const canvasLayout = node.layout?.canvas || {}
  const gridstackLayout = node.layout?.gridstack || {}

  return {
    width: canvasLayout.width ?? (gridstackLayout.w ? gridstackLayout.w * 100 : 300),
    height: canvasLayout.height ?? (gridstackLayout.h ? gridstackLayout.h * 200 : 200)
  }
}

/**
 * 处理节点点击
 */
const handleNodeClick = (nodeId: string) => {
  console.log('[CanvasRenderer] 节点点击:', nodeId)
  selectNode(nodeId)
  emit('node-select', nodeId)
}

/**
 * 处理标题更新
 */
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  console.log('[CanvasRenderer] 标题更新:', nodeId, newTitle)
}

/**
 * 处理节点鼠标按下（开始拖拽）
 */
const handleNodeMouseDown = (nodeId: string, event: MouseEvent) => {
  if (readonly.value || event.button !== 0) return // 只处理左键

  event.preventDefault()
  event.stopPropagation()

  // 选中节点
  selectNode(nodeId)

  // 开始拖拽
  draggingNodeId.value = nodeId
  dragStartPos.value = { x: event.clientX, y: event.clientY }

  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    const pos = getNodePosition(node)
    dragStartNodePos.value = { x: pos.x, y: pos.y }
  }

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

/**
 * 处理缩放开始
 */
const handleResizeStart = (nodeId: string, direction: string, event: MouseEvent) => {
  if (readonly.value) return

  event.preventDefault()
  event.stopPropagation()

  resizingNodeId.value = nodeId
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }

  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    const size = getNodeSize(node)
    resizeStartSize.value = { width: size.width, height: size.height }
  }

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

/**
 * 处理鼠标移动
 */
const handleMouseMove = (event: MouseEvent) => {
  event.preventDefault()

  if (draggingNodeId.value) {
    // 处理拖拽
    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y

    const newX = dragStartNodePos.value.x + deltaX
    const newY = dragStartNodePos.value.y + deltaY

    updateNodeLayout(draggingNodeId.value, {
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    })
  } else if (resizingNodeId.value) {
    // 处理缩放
    const deltaX = event.clientX - resizeStartPos.value.x
    const deltaY = event.clientY - resizeStartPos.value.y

    const updates = calculateResizeUpdates(resizeDirection.value, deltaX, deltaY)
    updateNodeLayout(resizingNodeId.value, updates)
  }
}

/**
 * 处理鼠标释放
 */
const handleMouseUp = () => {
  draggingNodeId.value = ''
  resizingNodeId.value = ''
  resizeDirection.value = ''

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

/**
 * 计算缩放更新
 */
const calculateResizeUpdates = (direction: string, deltaX: number, deltaY: number) => {
  const updates: any = {}

  switch (direction) {
    case 'nw':
      updates.width = Math.max(50, resizeStartSize.value.width - deltaX)
      updates.height = Math.max(50, resizeStartSize.value.height - deltaY)
      break
    case 'n':
      updates.height = Math.max(50, resizeStartSize.value.height - deltaY)
      break
    case 'ne':
      updates.width = Math.max(50, resizeStartSize.value.width + deltaX)
      updates.height = Math.max(50, resizeStartSize.value.height - deltaY)
      break
    case 'w':
      updates.width = Math.max(50, resizeStartSize.value.width - deltaX)
      break
    case 'e':
      updates.width = Math.max(50, resizeStartSize.value.width + deltaX)
      break
    case 'sw':
      updates.width = Math.max(50, resizeStartSize.value.width - deltaX)
      updates.height = Math.max(50, resizeStartSize.value.height + deltaY)
      break
    case 's':
      updates.height = Math.max(50, resizeStartSize.value.height + deltaY)
      break
    case 'se':
      updates.width = Math.max(50, resizeStartSize.value.width + deltaX)
      updates.height = Math.max(50, resizeStartSize.value.height + deltaY)
      break
  }

  return updates
}

/**
 * 更新节点布局
 */
const updateNodeLayout = (nodeId: string, updates: { x?: number; y?: number; width?: number; height?: number }) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return

  // 确保节点有 layout.canvas 结构
  if (!node.layout) {
    node.layout = {}
  }
  if (!node.layout.canvas) {
    node.layout.canvas = {}
  }

  // 更新布局
  Object.assign(node.layout.canvas, updates)

  // 通知 store 更新
  editorStore.updateNode(nodeId, { layout: node.layout })
}

// 配置事件监听
let unsubscribeConfigChange: (() => void) | null = null

onMounted(async () => {
  console.log('🎯 [CanvasRenderer] 组件挂载')

  // 监听配置变更事件
  const configChangeListener = async (event: ConfigChangeEvent) => {
    if (event.section === 'dataSource') {
      try {
        const requirement = {
          componentId: event.componentId,
          dataSources: event.newConfig ? [event.newConfig] : []
        }

        const result = await simpleDataBridge.executeComponent(requirement)

        if (result.success && result.data) {
          multiDataSourceStore.value[event.componentId] = result.data
          multiDataSourceConfigStore.value[event.componentId] = event.newConfig
        }
      } catch (error) {
        console.error(`❌ 组件 ${event.componentId} 数据处理异常:`, error)
      }
    }
  }

  if (configEventBus && typeof configEventBus.onConfigChange === 'function') {
    unsubscribeConfigChange = configEventBus.onConfigChange('config-changed', configChangeListener)
  }

  // 初始化数据源数据
  initializeDataSources()
})

/**
 * 初始化数据源数据
 */
const initializeDataSources = () => {
  const currentNodes = nodes.value
  if (!currentNodes || !Array.isArray(currentNodes)) return

  currentNodes.forEach(node => {
    const cachedData = simpleDataBridge.getComponentData(node.id)
    if (cachedData) {
      multiDataSourceStore.value[node.id] = cachedData
    }
  })
}

onUnmounted(() => {
  // 清理配置事件监听
  if (unsubscribeConfigChange) {
    unsubscribeConfigChange()
  }

  // 清理全局事件监听器（防止内存泄漏）
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// 事件处理器
const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  selectNode(nodeId)
  emit('node-select', nodeId)
}

const onCanvasClick = (event?: MouseEvent) => {
  selectNode('') // 清空选择
  emit('canvas-click', event)
}

const onRequestSettings = (nodeId: string) => {
  emit('request-settings', nodeId)
}
</script>

<style scoped>
.canvas-renderer {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: var(--n-color);
  border-radius: var(--n-border-radius);
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 信息栏样式 */
.canvas-info-bar {
  padding: 12px 16px;
  background: var(--n-card-color);
  border-radius: var(--n-border-radius);
  margin: 16px 16px 0 16px;
  border: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

/* Canvas 画布区域 */
.canvas-container {
  flex: 1;
  position: relative;
  margin: 16px;
  background: var(--n-card-color);
  border-radius: var(--n-border-radius);
  border: 1px solid var(--n-border-color);
  overflow: auto;
  min-height: 500px;
}

/* 网格背景 */
.canvas-container.show-grid {
  background-image:
    linear-gradient(var(--n-border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--n-border-color) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 0 0;
}

/* 节点项样式 */
.canvas-node-item {
  border: 2px solid transparent;
  border-radius: var(--n-border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
}

.canvas-node-item:hover {
  border-color: var(--n-primary-color);
  box-shadow: var(--n-box-shadow-2);
}

.canvas-node-item.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 0 0 2px var(--n-primary-color-pressed);
}

.canvas-node-item.dragging {
  cursor: move;
  opacity: 0.8;
  z-index: 1000;
}

.canvas-node-item.resizing {
  opacity: 0.8;
  z-index: 1000;
}

.canvas-node-item.readonly {
  cursor: default;
  opacity: 0.8;
}

.canvas-node-item.readonly:hover {
  transform: none;
  border-color: transparent;
  box-shadow: none;
}

/* 缩放手柄容器 */
.resize-handles {
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  pointer-events: none;
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--n-primary-color);
  border: 2px solid white;
  border-radius: 50%;
  pointer-events: auto;
  z-index: 1001;
}

.resize-handle:hover {
  background: var(--n-primary-color-hover);
  transform: scale(1.2);
}

/* 具体手柄位置 */
.resize-handle-nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle-n {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle-ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-handle-w {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle-e {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle-sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle-s {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle-se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* 节点信息叠加层 */
.node-info-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
  pointer-events: none;
}

/* 数据源指示器 */
.data-source-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  pointer-events: none;
}

/* 空状态样式 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .canvas-info-bar {
    margin: 12px;
    padding: 8px 12px;
  }

  .canvas-container {
    margin: 12px;
  }
}

/* 节点内容区域 */
.canvas-node-item :deep(.node-wrapper-content) {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>