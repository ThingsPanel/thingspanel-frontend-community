<template>
  <BaseRendererComponent
    @ready="onRendererReady"
    @error="onRendererError"
  >
    <div class="fabric-canvas-renderer" ref="rendererContainer">
      <div class="canvas-wrapper">
        <!-- 信息栏 -->
        <div class="canvas-info-bar">
          <n-space align="center" justify="space-between">
            <n-space align="center">
              <n-tag type="primary" size="small">Fabric.js 画布渲染器</n-tag>
              <n-text depth="3" style="font-size: 12px;">
                节点数: {{ nodes.length }} | 选中: {{ selectedNodes.length }}
              </n-text>
            </n-space>
            <n-space align="center">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-tag
                    :type="canvasConfig.showGrid ? 'success' : 'default'"
                    size="tiny"
                    style="cursor: pointer;"
                    @click="toggleGrid"
                  >
                    网格: {{ canvasConfig.showGrid ? '开' : '关' }}
                  </n-tag>
                </template>
                点击切换网格显示
              </n-tooltip>
            </n-space>
          </n-space>
        </div>

        <!-- Fabric.js + Vue 混合渲染容器 -->
        <div class="canvas-container" ref="canvasContainer">
          <!-- Fabric.js Canvas 层（交互层） -->
          <canvas
            ref="fabricCanvas"
            class="fabric-layer"
          ></canvas>

          <!-- Vue 组件叠加层（渲染层） -->
          <div class="vue-overlay" ref="vueOverlay">
            <div
              v-for="node in nodes"
              :key="node.id"
              :ref="(el) => setNodeRef(node.id, el)"
              class="vue-component-wrapper"
              :style="getVueNodeStyle(node)"
              :data-node-id="node.id"
            >
              <!-- 使用 NodeWrapper 渲染实际 Vue 组件 -->
              <NodeWrapper
                :node="node"
                :node-id="node.id"
                :readonly="readonly"
                :is-selected="selectedNodes.includes(node.id)"
                :show-resize-handles="false"
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
            </div>
          </div>

          <!-- 空状态显示 -->
          <div v-if="nodes.length === 0" class="empty-state">
            <n-empty description="暂无节点数据，拖拽组件到画布开始设计">
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
 * Fabric.js + Vue 混合渲染的 Canvas 渲染器
 *
 * 架构说明：
 * 1. Fabric.js Canvas 层：负责交互逻辑（拖拽、缩放、选择框、划线等）
 * 2. Vue 组件叠加层：负责实际的 Vue 组件渲染
 * 3. 同步机制：Fabric 对象的变换同步到 Vue 组件的位置和样式
 */

import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { Canvas, Rect, FabricObject } from 'fabric'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
import { NSpace, NTag, NText, NTooltip, NEmpty, NIcon } from 'naive-ui'
// 数据架构相关
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

interface CanvasConfig {
  showGrid?: boolean
  backgroundColor?: string
  width?: number
  height?: number
  snapToGrid?: boolean
  gridSize?: number
  enableSelection?: boolean
}

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  canvasConfig?: CanvasConfig
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

// Store 管理
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 引用
const rendererContainer = ref<HTMLElement>()
const fabricCanvas = ref<HTMLCanvasElement>()
const vueOverlay = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()

// Fabric.js 实例
let canvas: Canvas | null = null

// 计算属性
const nodes = computed(() => editorStore.nodes || [])
const selectedNodes = computed(() => widgetStore.selectedNodeIds || [])

// 只读模式计算属性
const { isPreviewMode } = globalPreviewMode
const readonly = computed(() => props.readonly || isPreviewMode.value)

// Canvas 配置
const canvasConfig = computed(() => ({
  showGrid: true,
  backgroundColor: '#ffffff',
  width: 1200,
  height: 800,
  snapToGrid: true,
  gridSize: 20,
  enableSelection: !readonly.value,
  ...props.canvasConfig
}))

// 数据源管理
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// Fabric 对象与 Vue 组件的映射
const fabricObjects = ref<Map<string, FabricObject>>(new Map())
const vueNodeRefs = ref<Map<string, HTMLElement>>(new Map())

/**
 * 设置 Vue 节点引用
 */
const setNodeRef = (nodeId: string, el: HTMLElement | null) => {
  if (el) {
    vueNodeRefs.value.set(nodeId, el)
  } else {
    vueNodeRefs.value.delete(nodeId)
  }
}

/**
 * 获取节点在 Canvas 中的位置
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
 * 获取 Vue 组件的样式（与 Fabric 对象同步）
 */
const getVueNodeStyle = (node: any) => {
  const position = getNodePosition(node)
  const size = getNodeSize(node)

  return {
    position: 'absolute',
    left: position.x + 'px',
    top: position.y + 'px',
    width: size.width + 'px',
    height: size.height + 'px',
    zIndex: 10,
    pointerEvents: readonly.value ? 'none' : 'auto'
  }
}

/**
 * 创建 Fabric 透明占位对象（用于交互）
 */
const createFabricPlaceholder = (node: any) => {
  const position = getNodePosition(node)
  const size = getNodeSize(node)

  // 创建透明矩形作为交互占位符
  const placeholder = new Rect({
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    fill: 'rgba(0,0,0,0.01)', // 极其透明但仍可点击
    stroke: readonly.value ? 'transparent' : 'rgba(64, 158, 255, 0.8)', // 选中时显示边框
    strokeWidth: 0,
    strokeDashArray: [5, 5],
    selectable: !readonly.value,
    moveCursor: readonly.value ? 'default' : 'move',
    hoverCursor: readonly.value ? 'default' : 'move',
    hasControls: !readonly.value, // 显示变换控件
    hasBorders: !readonly.value, // 显示边框
    cornerStyle: 'circle',
    cornerSize: 8,
    borderColor: 'rgba(64, 158, 255, 0.8)',
    cornerColor: 'rgba(64, 158, 255, 0.8)',
    transparentCorners: false
  })

  // 添加自定义属性
  placeholder.set('nodeId', node.id)
  placeholder.set('nodeType', node.type)

  console.log('🎯 [创建占位对象]', {
    nodeId: node.id,
    position: { x: position.x, y: position.y },
    size: { width: size.width, height: size.height },
    selectable: !readonly.value,
    hasControls: !readonly.value
  })

  return placeholder
}

/**
 * 同步 Fabric 对象变换到 Vue 组件
 */
const syncFabricToVue = (fabricObj: FabricObject) => {
  const nodeId = fabricObj.get('nodeId')
  if (!nodeId) return

  const vueElement = vueNodeRefs.value.get(nodeId)
  if (!vueElement) return

  // 同步位置和尺寸
  vueElement.style.left = (fabricObj.left || 0) + 'px'
  vueElement.style.top = (fabricObj.top || 0) + 'px'
  vueElement.style.width = ((fabricObj.width || 0) * (fabricObj.scaleX || 1)) + 'px'
  vueElement.style.height = ((fabricObj.height || 0) * (fabricObj.scaleY || 1)) + 'px'

  // 同步旋转
  if (fabricObj.angle) {
    vueElement.style.transform = `rotate(${fabricObj.angle}deg)`
  }
}

/**
 * 更新节点布局到 store
 */
const updateNodeLayout = (nodeId: string, layout: any) => {
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
  Object.assign(node.layout.canvas, layout)

  // 通知 store 更新
  editorStore.updateNode(nodeId, { layout: node.layout })
}

/**
 * 初始化 Fabric.js Canvas
 */
const initFabricCanvas = () => {
  if (!fabricCanvas.value || !canvasContainer.value) return

  // 获取容器尺寸
  const containerRect = canvasContainer.value.getBoundingClientRect()

  // 初始化 Fabric Canvas
  canvas = new Canvas(fabricCanvas.value, {
    width: containerRect.width,
    height: Math.max(containerRect.height, canvasConfig.value.height),
    backgroundColor: canvasConfig.value.backgroundColor,
    selection: canvasConfig.value.enableSelection,
    preserveObjectStacking: true
  })

  // 设置网格背景
  if (canvasConfig.value.showGrid) {
    setGridBackground()
  }

  // 绑定事件
  bindFabricEvents()

  console.log('🎯 [FabricCanvasRenderer] Fabric.js Canvas 初始化完成')
}

/**
 * 设置网格背景
 */
const setGridBackground = () => {
  if (!canvas) return

  const gridSize = canvasConfig.value.gridSize || 20
  const width = canvas.getWidth()
  const height = canvas.getHeight()

  // 创建网格图案
  const gridPattern = `
    <svg width="${gridSize}" height="${gridSize}" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#e5e5e5" stroke-width="1"/>
    </svg>
  `

  const gridUrl = 'data:image/svg+xml;base64,' + btoa(gridPattern)

  canvas.setBackgroundColor(
    {
      source: gridUrl,
      repeat: 'repeat'
    },
    canvas.renderAll.bind(canvas)
  )
}

/**
 * 绑定 Fabric 事件
 */
const bindFabricEvents = () => {
  if (!canvas) return

  // 对象移动事件
  canvas.on('object:moving', (e) => {
    if (e.target) {
      console.log('🔄 [Fabric事件] 对象拖拽中:', e.target.get('nodeId'))
      syncFabricToVue(e.target)
    }
  })

  // 对象缩放事件
  canvas.on('object:scaling', (e) => {
    if (e.target) {
      console.log('🔄 [Fabric事件] 对象缩放中:', e.target.get('nodeId'))
      syncFabricToVue(e.target)
    }
  })

  // 对象旋转事件
  canvas.on('object:rotating', (e) => {
    if (e.target) {
      console.log('🔄 [Fabric事件] 对象旋转中:', e.target.get('nodeId'))
      syncFabricToVue(e.target)
    }
  })

  // 对象修改完成事件
  canvas.on('object:modified', (e) => {
    if (e.target) {
      const nodeId = e.target.get('nodeId')
      if (nodeId) {
        // 更新节点布局
        updateNodeLayout(nodeId, {
          x: e.target.left,
          y: e.target.top,
          width: (e.target.width || 0) * (e.target.scaleX || 1),
          height: (e.target.height || 0) * (e.target.scaleY || 1),
          angle: e.target.angle || 0
        })
      }
    }
  })

  // 选择事件
  canvas.on('selection:created', (e) => {
    if (e.selected && e.selected.length > 0) {
      const selected = e.selected[0]
      const nodeId = selected.get('nodeId')
      if (nodeId) {
        // 显示选中状态的边框
        selected.set({
          strokeWidth: 2,
          stroke: 'rgba(64, 158, 255, 0.8)'
        })
        selectNode(nodeId)
      }
    }
    canvas.renderAll()
  })

  canvas.on('selection:updated', (e) => {
    if (e.selected && e.selected.length > 0) {
      const selected = e.selected[0]
      const nodeId = selected.get('nodeId')
      if (nodeId) {
        // 显示选中状态的边框
        selected.set({
          strokeWidth: 2,
          stroke: 'rgba(64, 158, 255, 0.8)'
        })
        selectNode(nodeId)
      }
    }
    canvas.renderAll()
  })

  // 清空选择事件
  canvas.on('selection:cleared', (e) => {
    // 隐藏所有对象的边框
    if (e.deselected) {
      e.deselected.forEach((obj: any) => {
        obj.set({
          strokeWidth: 0,
          stroke: 'transparent'
        })
      })
    }
    selectNode('')
    canvas.renderAll()
  })

  // 画布点击事件
  canvas.on('mouse:down', (e) => {
    if (!e.target) {
      emit('canvas-click', e.e)
    }
  })
}

/**
 * 同步节点到 Fabric Canvas
 */
const syncNodesToFabric = () => {
  if (!canvas) return

  // 清除现有对象
  canvas.clear()
  fabricObjects.value.clear()

  // 重新设置背景
  if (canvasConfig.value.showGrid) {
    setGridBackground()
  }

  // 为每个节点创建 Fabric 占位对象
  nodes.value.forEach(node => {
    const placeholder = createFabricPlaceholder(node)
    canvas!.add(placeholder)
    fabricObjects.value.set(node.id, placeholder)
  })

  canvas.renderAll()
}

/**
 * 选择节点
 */
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])

    // 同步 Fabric 选择
    const fabricObj = fabricObjects.value.get(nodeId)
    if (fabricObj && canvas) {
      canvas.setActiveObject(fabricObj)
    }
  } else {
    widgetStore.selectNodes([])

    // 清除 Fabric 选择
    if (canvas) {
      canvas.discardActiveObject()
    }
  }

  if (canvas) {
    canvas.renderAll()
  }
}

/**
 * 处理节点点击
 */
const handleNodeClick = (nodeId: string) => {
  console.log('[FabricCanvasRenderer] 节点点击:', nodeId)
  selectNode(nodeId)
  emit('node-select', nodeId)
}

/**
 * 处理标题更新
 */
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  console.log('[FabricCanvasRenderer] 标题更新:', nodeId, newTitle)
}

/**
 * 切换网格显示
 */
const toggleGrid = () => {
  const newConfig = {
    ...canvasConfig.value,
    showGrid: !canvasConfig.value.showGrid
  }

  if (canvas) {
    if (newConfig.showGrid) {
      setGridBackground()
    } else {
      canvas.setBackgroundColor(newConfig.backgroundColor || '#ffffff', canvas.renderAll.bind(canvas))
    }
  }
}

// 监听节点变化
watch(nodes, () => {
  nextTick(() => {
    syncNodesToFabric()
  })
}, { deep: true })

// 配置事件监听
let unsubscribeConfigChange: (() => void) | null = null

onMounted(async () => {
  console.log('🎯 [FabricCanvasRenderer] 组件挂载')

  // 等待 DOM 完全渲染
  await nextTick()

  // 初始化 Fabric Canvas
  initFabricCanvas()

  // 同步初始节点
  syncNodesToFabric()

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

  unsubscribeConfigChange = configEventBus.subscribe(configChangeListener)

  // 初始化现有节点的数据
  nodes.value.forEach(async node => {
    const cachedData = simpleDataBridge.getComponentData(node.id)
    if (cachedData) {
      multiDataSourceStore.value[node.id] = cachedData
    }
  })
})

onUnmounted(() => {
  // 清理配置事件监听
  if (unsubscribeConfigChange) {
    unsubscribeConfigChange()
  }

  // 清理 Fabric Canvas
  if (canvas) {
    canvas.dispose()
    canvas = null
  }

  // 清理引用
  fabricObjects.value.clear()
  vueNodeRefs.value.clear()
})

// 事件处理器
const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}
</script>

<style scoped>
.fabric-canvas-renderer {
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

/* Canvas 容器 */
.canvas-container {
  flex: 1;
  position: relative;
  margin: 16px;
  background: var(--n-card-color);
  border-radius: var(--n-border-radius);
  border: 1px solid var(--n-border-color);
  overflow: hidden;
  min-height: 500px;
}

/* Fabric.js Canvas 层 */
.fabric-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* Vue 组件叠加层 */
.vue-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

/* Vue 组件包装器 */
.vue-component-wrapper {
  border: 2px solid transparent;
  border-radius: var(--n-border-radius);
  transition: all 0.3s ease;
  pointer-events: none; /* 不阻挡Fabric.js的鼠标事件 */
}

.vue-component-wrapper:hover {
  border-color: var(--n-primary-color-hover);
  box-shadow: var(--n-box-shadow-1);
}

/* 节点信息叠加层 */
.node-info-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 20;
  pointer-events: none;
}

/* 数据源指示器 */
.data-source-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  pointer-events: none;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}
</style>