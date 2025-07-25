<template>
  <div class="pure-editor-shell" :style="computedStyles.root">
    <!-- 工具栏区域 -->
    <div 
      v-if="layoutManager.regions.toolbar.visible" 
      class="toolbar-region"
      :style="computedStyles.toolbar"
    >
      <slot name="toolbar" :context="editorContext">
        <!-- 默认工具栏插槽 -->
      </slot>
    </div>

    <!-- 主容器区域 -->
    <div class="main-container" :style="computedStyles.mainContainer">
      <!-- 左侧边栏 -->
      <div 
        v-if="layoutManager.regions.sidebar.visible && layoutManager.regions.sidebar.position === 'left'"
        class="sidebar-region sidebar-left"
        :style="computedStyles.sidebar"
      >
        <div class="sidebar-content">
          <slot name="sidebar" :context="editorContext">
            <!-- 默认侧边栏插槽 -->
          </slot>
        </div>
        <div 
          v-if="layoutManager.regions.sidebar.resizable"
          class="sidebar-resizer"
          @mousedown="startResize('sidebar')"
        ></div>
      </div>

      <!-- 画布区域 -->
      <div class="canvas-region" :style="computedStyles.canvas">
        <slot name="canvas" :context="editorContext">
          <!-- 默认画布插槽 -->
        </slot>
      </div>

      <!-- 右侧检查器 -->
      <div 
        v-if="layoutManager.regions.inspector.visible && layoutManager.regions.inspector.position === 'right'"
        class="inspector-region inspector-right"
        :style="computedStyles.inspector"
      >
        <div 
          v-if="layoutManager.regions.inspector.resizable"
          class="inspector-resizer"
          @mousedown="startResize('inspector')"
        ></div>
        <div class="inspector-content">
          <slot name="inspector" :context="editorContext">
            <!-- 默认检查器插槽 -->
          </slot>
        </div>
      </div>

      <!-- 右侧边栏（如果配置为右侧） -->
      <div 
        v-if="layoutManager.regions.sidebar.visible && layoutManager.regions.sidebar.position === 'right'"
        class="sidebar-region sidebar-right"
        :style="computedStyles.sidebar"
      >
        <div 
          v-if="layoutManager.regions.sidebar.resizable"
          class="sidebar-resizer"
          @mousedown="startResize('sidebar')"
        ></div>
        <div class="sidebar-content">
          <slot name="sidebar" :context="editorContext">
            <!-- 默认侧边栏插槽 -->
          </slot>
        </div>
      </div>

      <!-- 左侧检查器（如果配置为左侧） -->
      <div 
        v-if="layoutManager.regions.inspector.visible && layoutManager.regions.inspector.position === 'left'"
        class="inspector-region inspector-left"
        :style="computedStyles.inspector"
      >
        <div class="inspector-content">
          <slot name="inspector" :context="editorContext">
            <!-- 默认检查器插槽 -->
          </slot>
        </div>
        <div 
          v-if="layoutManager.regions.inspector.resizable"
          class="inspector-resizer"
          @mousedown="startResize('inspector')"
        ></div>
      </div>
    </div>

    <!-- 底部工具栏（如果配置为底部） -->
    <div 
      v-if="layoutManager.regions.toolbar.visible && layoutManager.regions.toolbar.position === 'bottom'" 
      class="toolbar-region toolbar-bottom"
      :style="computedStyles.toolbar"
    >
      <slot name="toolbar" :context="editorContext">
        <!-- 默认工具栏插槽 -->
      </slot>
    </div>

    <!-- 断点信息显示 (开发模式) -->
    <div v-if="showDebugInfo" class="debug-info">
      <div>断点: {{ layoutManager.currentBreakpoint }}</div>
      <div>视窗: {{ layoutManager.viewport.width }}x{{ layoutManager.viewport.height }}</div>
      <div>选中节点: {{ dataPipeline.state.value.runtime.selectedNodeIds.length }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, onMounted, onUnmounted, ref, reactive } from 'vue'
import { LayoutManager, createLayoutManager } from './PureLayoutManager'
import { DataPipeline, createDataPipeline, type PanelV2Data } from './PureDataPipeline'
import { PureLifecycleManager, createLifecycleManager, LIFECYCLE_PHASES } from './LifecycleManager'

/**
 * 组件属性定义
 */
interface Props {
  // 初始面板数据
  initialData?: Partial<PanelV2Data>
  
  // 布局配置
  layoutConfig?: {
    toolbarHeight?: number
    sidebarWidth?: number
    inspectorWidth?: number
    canvasPadding?: number
  }
  
  // 响应式配置
  responsiveConfig?: {
    autoCollapse?: boolean
    stackOnMobile?: boolean
    minCanvasWidth?: number
  }
  
  // 持久化配置
  persistenceHandlers?: {
    save?: (data: PanelV2Data) => Promise<void>
    load?: (id: string) => Promise<PanelV2Data>
    autosave?: boolean
  }
  
  // 调试模式
  debugMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  debugMode: false
})

/**
 * 创建核心管理器实例
 */
const layoutManager = createLayoutManager()
const dataPipeline = createDataPipeline(props.initialData)
const lifecycleManager = createLifecycleManager()

/**
 * 初始化配置
 */
if (props.layoutConfig) {
  const { toolbarHeight, sidebarWidth, inspectorWidth, canvasPadding } = props.layoutConfig
  if (toolbarHeight) layoutManager.regions.toolbar.height = toolbarHeight
  if (sidebarWidth) layoutManager.regions.sidebar.width = sidebarWidth
  if (inspectorWidth) layoutManager.regions.inspector.width = inspectorWidth
  if (canvasPadding) layoutManager.regions.canvas.padding = canvasPadding
}

if (props.responsiveConfig) {
  Object.assign(layoutManager.responsive, props.responsiveConfig)
}

if (props.persistenceHandlers) {
  dataPipeline.setPersistenceHandlers(props.persistenceHandlers)
}

/**
 * 编辑器上下文 - 提供给子组件的完整上下文
 */
const editorContext = reactive({
  // 核心管理器
  layoutManager,
  dataPipeline,
  lifecycleManager,
  
  // 快捷方法
  data: computed(() => dataPipeline.state.value),
  selectedNodes: computed(() => dataPipeline.getSelectedNodes()),
  
  // 布局控制
  toggleSidebar: () => layoutManager.toggleSidebar(),
  toggleInspector: () => layoutManager.toggleInspector(),
  
  // 数据操作
  addNode: dataPipeline.operations.addNode,
  updateNode: dataPipeline.operations.updateNode,
  removeNode: dataPipeline.operations.removeNode,
  selectNodes: dataPipeline.operations.selectNodes,
  clearSelection: dataPipeline.operations.clearSelection,
  
  // 事件系统
  emit: dataPipeline.events.emit,
  on: dataPipeline.events.on,
  off: dataPipeline.events.off,
  
  // 生命周期
  onPhase: lifecycleManager.registerHook.bind(lifecycleManager),
  triggerPhase: lifecycleManager.trigger.bind(lifecycleManager)
})

// 将编辑器上下文提供给子组件
provide('editorContext', editorContext)
provide('layoutManager', layoutManager)
provide('dataPipeline', dataPipeline)
provide('lifecycleManager', lifecycleManager)

/**
 * 计算样式
 */
const computedStyles = computed(() => layoutManager.getComputedStyles())

/**
 * 调试信息显示
 */
const showDebugInfo = computed(() => props.debugMode)

/**
 * 拖拽调整尺寸功能
 */
const resizeState = ref<{
  type: 'sidebar' | 'inspector' | null
  startX: number
  startWidth: number
}>({
  type: null,
  startX: 0,
  startWidth: 0
})

const startResize = (type: 'sidebar' | 'inspector') => {
  const currentWidth = type === 'sidebar' 
    ? layoutManager.regions.sidebar.width 
    : layoutManager.regions.inspector.width
    
  resizeState.value = {
    type,
    startX: 0,
    startWidth: currentWidth
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.userSelect = 'none'
}

const handleResize = (event: MouseEvent) => {
  const { type, startX, startWidth } = resizeState.value
  if (!type) return
  
  if (startX === 0) {
    resizeState.value.startX = event.clientX
    return
  }
  
  const deltaX = event.clientX - startX
  const newWidth = type === 'sidebar' 
    ? (layoutManager.regions.sidebar.position === 'left' ? startWidth + deltaX : startWidth - deltaX)
    : (layoutManager.regions.inspector.position === 'left' ? startWidth - deltaX : startWidth + deltaX)
  
  if (type === 'sidebar') {
    layoutManager.setSidebarWidth(newWidth)
  } else {
    layoutManager.setInspectorWidth(newWidth)
  }
}

const stopResize = () => {
  resizeState.value.type = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.userSelect = ''
}

/**
 * 生命周期处理
 */
onMounted(async () => {
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.BEFORE_MOUNT, {
    editor: editorContext
  })
  
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.MOUNTED, {
    editor: editorContext
  })
  
  // 如果有初始数据，触发面板加载事件
  if (props.initialData) {
    await lifecycleManager.trigger(LIFECYCLE_PHASES.PANEL.LOADED, {
      editor: editorContext,
      panel: dataPipeline.state.value
    })
  }
})

onUnmounted(async () => {
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.BEFORE_UNMOUNT, {
    editor: editorContext
  })
  
  // 清理资源
  dataPipeline.destroy()
  lifecycleManager.clearAll()
  
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.UNMOUNTED, {
    editor: editorContext
  })
})

/**
 * 暴露给父组件的接口
 */
defineExpose({
  // 核心管理器
  layoutManager,
  dataPipeline,
  lifecycleManager,
  
  // 编辑器上下文
  editorContext,
  
  // 调试方法
  getDebugInfo: () => ({
    layout: layoutManager.getLayoutState(),
    data: dataPipeline.state.value,
    lifecycle: lifecycleManager.getDebugInfo()
  })
})
</script>

<style scoped>
/* 纯净编辑器外壳样式 - 只负责布局，不涉及主题 */
.pure-editor-shell {
  --editor-border-color: #e8e8e8;
  --editor-bg-color: transparent;
  --editor-resizer-color: #d9d9d9;
  --editor-resizer-hover-color: #40a9ff;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: inherit;
  background: var(--editor-bg-color);
  
  /* 防止内容溢出 */
  overflow: hidden;
  
  /* 确保填满容器 */
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* 工具栏区域 */
.toolbar-region {
  border-bottom: 1px solid var(--editor-border-color);
  background: inherit;
  flex-shrink: 0;
  overflow: hidden;
}

.toolbar-bottom {
  border-bottom: none;
  border-top: 1px solid var(--editor-border-color);
}

/* 主容器 */
.main-container {
  overflow: hidden;
}

/* 侧边栏区域 */
.sidebar-region {
  background: inherit;
  border-right: 1px solid var(--editor-border-color);
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid var(--editor-border-color);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

/* 画布区域 */
.canvas-region {
  background: inherit;
  overflow: hidden;
  position: relative;
}

/* 检查器区域 */
.inspector-region {
  background: inherit;
  border-left: 1px solid var(--editor-border-color);
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.inspector-left {
  border-left: none;
  border-right: 1px solid var(--editor-border-color);
}

.inspector-content {
  flex: 1;
  overflow: hidden;
}

/* 拖拽调整尺寸器 */
.sidebar-resizer,
.inspector-resizer {
  width: 4px;
  cursor: ew-resize;
  background: transparent;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  position: relative;
}

.sidebar-resizer:hover,
.inspector-resizer:hover {
  background: var(--editor-resizer-hover-color);
}

.sidebar-resizer::before,
.inspector-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: var(--editor-resizer-color);
}

/* 调试信息 */
.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  line-height: 1.4;
}

.debug-info > div {
  margin: 2px 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .sidebar-region,
  .inspector-region {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar-region {
    left: 0;
  }
  
  .inspector-region {
    right: 0;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .pure-editor-shell {
    --editor-border-color: #000;
    --editor-resizer-color: #000;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .sidebar-region,
  .inspector-region,
  .sidebar-resizer,
  .inspector-resizer {
    transition: none;
  }
}
</style>