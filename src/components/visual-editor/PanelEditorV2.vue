<script setup lang="ts">
/**
 * PanelEditor V2 - 基于 PanelLayout 的新一代可视化编辑器
 *
 * 实现真实的工具栏和渲染器切换功能
 */

import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { $t } from '@/locales'
import PanelLayout from './components/PanelLayout.vue'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor } from './hooks'
import { usePreviewMode } from './hooks/usePreviewMode'
import type { RendererType } from './types'
import { useMessage, useDialog } from 'naive-ui'
import { getBoard, PutBoard } from '@/service/api'
import { smartDeepClone } from '@/utils/deep-clone'

// 🔥 接收测试页面的配置props
interface Props {
  panelId: string
  showToolbar?: boolean
  showPageHeader?: boolean
  enableHeaderArea?: boolean
  enableToolbarArea?: boolean
  enableFooterArea?: boolean
  customLayoutClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: false,
  customLayoutClass: ''
})

const message = useMessage()
const dialog = useDialog()

const panelData = ref<any>({})
const preEditorConfig = ref<any>(null)

// 基础状态
const isEditing = ref(true)
const leftCollapsed = ref(false)
const rightCollapsed = ref(true) // 🔥 右侧默认关闭

// 🔥 编辑器核心功能
const currentRenderer = ref<RendererType>('gridstack')
const showWidgetTitles = ref(true)
const isSaving = ref(false)
const hasChanges = ref(false)
const dataFetched = ref(false) // 简化版，直接设为true
const isUnmounted = ref(false)

// 🔥 拖拽状态管理
const isDragging = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')

// 创建编辑器上下文
const editorContext = createEditor()
const { stateManager, addWidget, updateNode, selectNode } = editorContext
const { setPreviewMode, isPreviewMode } = usePreviewMode()

// 编辑器配置
const editorConfig = ref({
  gridConfig: {},
  canvasConfig: {}
})

// This is from PanelEditor.vue's usePanelDataManager
const getState = () => {
  const widgets = toRaw(stateManager.nodes)
  const config = toRaw(editorConfig.value)
  return {
    widgets,
    config
  }
}

// This is also from PanelEditor.vue's usePanelDataManager, simplified
const setState = (state: any) => {
  if (!state) return

  const clonedState = smartDeepClone(state)
  const { widgets, config } = clonedState

  if (widgets) {
    stateManager.setNodes(widgets)
  }

  if (config) {
    editorConfig.value = config
  }
}

const fetchBoard = async () => {
  try {
    dataFetched.value = false
    const { data } = await getBoard(props.panelId)
    panelData.value = data

    if (data.configuration) {
      const configuration = JSON.parse(data.configuration)
      setState(configuration)
      preEditorConfig.value = smartDeepClone(configuration)
    } else {
      // set with default/empty state
      const emptyState = { widgets: [], config: { gridConfig: {}, canvasConfig: {} } }
      setState(emptyState)
      preEditorConfig.value = emptyState
    }
  } catch (error) {
    message.error('Failed to fetch board data')
    console.error(error)
  } finally {
    dataFetched.value = true
  }
}

onMounted(() => {
  fetchBoard()
})

// Watch for changes to set hasChanges flag
watch(
  () => stateManager.nodes,
  (newValue, oldValue) => {
    if (dataFetched.value && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      hasChanges.value = true
    }
  },
  { deep: true }
)

watch(
  () => editorConfig.value,
  (newValue, oldValue) => {
    if (dataFetched.value && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      hasChanges.value = true
    }
  },
  { deep: true }
)

// 渲染器选项
const rendererOptions = computed(() => [
  { label: $t('visualEditor.canvas'), value: 'canvas' as RendererType },
  { label: $t('visualEditor.gridstack'), value: 'gridstack' as RendererType }
])

// 🔥 工具栏事件处理
const handleModeChange = (mode: 'edit' | 'preview') => {
  const editMode = mode === 'edit'
  isEditing.value = editMode
  setPreviewMode(!editMode)

  if (!editMode) {
    leftCollapsed.value = true
    rightCollapsed.value = true
  }
}

const handleRendererChange = (renderer: RendererType) => {
  currentRenderer.value = renderer
}

const handleSave = async () => {
  isSaving.value = true
  try {
    const currentState = getState()
    await PutBoard(props.panelId, {
      id: props.panelId,
      name: panelData.value.name,
      description: panelData.value.description,
      configuration: JSON.stringify(currentState),
      image: panelData.value.image || '',
      is_publish: panelData.value.is_publish,
      project_id: panelData.value.project_id
    })
    message.success($t('common.saveSuccess'))
    hasChanges.value = false
    preEditorConfig.value = smartDeepClone(currentState)
  } catch (error) {
    message.error($t('common.saveFailed'))
    console.error('Save failed:', error)
  } finally {
    isSaving.value = false
  }
}

// 🔥 拖拽事件处理
const handleDragStart = (componentType: string) => {
  isDragging.value = true
  draggedComponent.value = componentType
  console.log('开始拖拽:', componentType)
}

const handleDragEnd = () => {
  isDragging.value = false
  draggedComponent.value = null
  console.log('结束拖拽')
}

// 🔥 组件操作处理
const handleAddWidget = async (widget: { type: string }) => {
  try {
    console.log('添加组件:', widget.type)
    await addWidget(widget.type)
    hasChanges.value = true
    console.log('✅ 组件添加成功:', widget.type)
  } catch (error: any) {
    console.error('❌ 添加组件失败:', widget.type, error)
  }
}

// 其他占位事件处理
const handleImportConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async e => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      try {
        const configStr = event.target?.result as string
        const newConfig = JSON.parse(configStr)
        setState(newConfig)
        hasChanges.value = true
        message.success($t('visualEditor.importSuccess', '配置导入成功'))
      } catch (error) {
        message.error($t('visualEditor.importFailed', '配置文件解析失败'))
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
const handleExportConfig = () => {
  const state = getState()
  const dataStr = JSON.stringify(state, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${panelData.value.name || 'dashboard'}-config.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
const handleUndo = () => {
  stateManager.undo()
  hasChanges.value = true
}
const handleRedo = () => {
  stateManager.redo()
  hasChanges.value = true
}
const handleClearAll = () => {
  dialog.warning({
    title: $t('visualEditor.confirmClearAll', '确认清空'),
    content: $t('visualEditor.confirmClearAllContent', '此操作将清空所有组件且无法恢复，确定要继续吗？'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      stateManager.clear()
      editorConfig.value = { gridConfig: {}, canvasConfig: {} }
      hasChanges.value = true
      message.success($t('visualEditor.clearedSuccess', '已清空'))
    }
  })
}
const handleZoomIn = () => {
  const currentZoom = editorConfig.value.canvasConfig?.transform?.s || 1
  const newZoom = currentZoom + 0.1
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { ...editorConfig.value.canvasConfig.transform, s: newZoom }
  }
}
const handleZoomOut = () => {
  const currentZoom = editorConfig.value.canvasConfig?.transform?.s || 1
  const newZoom = Math.max(0.1, currentZoom - 0.1)
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { ...editorConfig.value.canvasConfig.transform, s: newZoom }
  }
}
const handleResetZoom = () => {
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { x: 0, y: 0, s: 1 }
  }
}
const handleToggleLeftDrawer = () => {
  leftCollapsed.value = !leftCollapsed.value
}
const handleToggleRightDrawer = () => {
  rightCollapsed.value = !rightCollapsed.value
}
const handleGridstackConfigChange = () => console.log('GridStack配置变更')
const handleCanvasConfigChange = () => console.log('Canvas配置变更')

// 🔥 渲染器事件处理
const handleRendererReady = () => console.log('渲染器就绪')
const handleRendererError = () => console.log('渲染器错误')
const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId) // 🔥 调用真实的selectNode方法
  rightCollapsed.value = false // 选中节点时打开右侧面板
  console.log('节点选择:', nodeId)
}
const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectNode('') // 🔥 清除选择
  console.log('画布点击')
}
const handleRequestSettings = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId) // 🔥 调用真实的selectNode方法
  rightCollapsed.value = false // 请求设置时打开右侧面板
  console.log('请求设置:', nodeId)
}
</script>

<template>
  <PanelLayout
    :mode="isEditing ? 'edit' : 'preview'"
    :left-collapsed="leftCollapsed"
    :right-collapsed="rightCollapsed"
    :show-header="props.enableHeaderArea && props.showPageHeader"
    :show-toolbar="props.enableToolbarArea && props.showToolbar"
    :show-footer="props.enableFooterArea"
    :custom-class="props.customLayoutClass"
    @update:left-collapsed="leftCollapsed = $event"
    @update:right-collapsed="rightCollapsed = $event"
  >
    <!-- 标题区域占位 -->
    <template #header>
      <div class="flex items-center justify-between w-full p-2 bg-blue-50">
        <span>
          📋 标题区域占位 (enableHeaderArea: {{ props.enableHeaderArea }}, showPageHeader: {{ props.showPageHeader }})
        </span>
      </div>
    </template>

    <!-- 🔥 真实工具栏 -->
    <template #toolbar>
      <VisualEditorToolbar
        v-if="dataFetched && !isUnmounted"
        :key="`toolbar-v2-${currentRenderer}-${isEditing ? 'edit' : 'preview'}`"
        :mode="isEditing ? 'edit' : 'preview'"
        :current-renderer="currentRenderer"
        :available-renderers="rendererOptions"
        :is-saving="isSaving"
        :has-changes="hasChanges"
        :show-left-drawer="!leftCollapsed"
        :show-right-drawer="!rightCollapsed"
        :gridstack-config="editorConfig.gridConfig"
        :canvas-config="editorConfig.canvasConfig"
        @mode-change="handleModeChange"
        @renderer-change="handleRendererChange"
        @save="handleSave"
        @import="handleImportConfig"
        @export="handleExportConfig"
        @import-config="handleImportConfig"
        @export-config="handleExportConfig"
        @undo="handleUndo"
        @redo="handleRedo"
        @clear-all="handleClearAll"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @reset-zoom="handleResetZoom"
        @toggle-left-drawer="handleToggleLeftDrawer"
        @toggle-right-drawer="handleToggleRightDrawer"
        @gridstack-config-change="handleGridstackConfigChange"
        @canvas-config-change="handleCanvasConfigChange"
      />
    </template>

    <!-- 🔥 真实的左侧组件库 -->
    <template #left>
      <WidgetLibrary @add-widget="handleAddWidget" @drag-start="handleDragStart" @drag-end="handleDragEnd" />
    </template>

    <!-- 🔥 主内容区域 - 真实渲染器实现 -->
    <template #main>
      <!-- 加载状态 -->
      <div v-if="!dataFetched" class="h-full flex items-center justify-center w-full">
        <n-spin size="large">
          <template #description>
            {{ $t('visualEditor.loading') }}
          </template>
        </n-spin>
      </div>

      <!-- 渲染器区域 -->
      <div
        v-else
        class="renderer-main-area w-full relative"
        :class="{ dragging: isDragging }"
        @click="handleCanvasClick"
      >
        <!-- Canvas 渲染器 -->
        <CanvasRenderer
          v-if="currentRenderer === 'canvas' && dataFetched && !isUnmounted"
          key="canvas-renderer-v2"
          :readonly="!isEditing"
          :show-widget-titles="showWidgetTitles"
          class="renderer-container"
          @ready="handleRendererReady"
          @error="handleRendererError"
          @node-select="handleNodeSelect"
          @canvas-click="handleCanvasClick"
          @request-settings="handleRequestSettings"
        />

        <!-- Gridstack 渲染器 -->
        <GridstackRenderer
          v-else-if="currentRenderer === 'gridstack' && dataFetched && !isUnmounted"
          key="gridstack-renderer-v2"
          :readonly="!isEditing"
          :show-widget-titles="showWidgetTitles"
          :grid-config="editorConfig.gridConfig"
          class="renderer-container"
          @ready="handleRendererReady"
          @error="handleRendererError"
          @node-select="handleNodeSelect"
          @canvas-click="handleCanvasClick"
          @request-settings="handleRequestSettings"
        />
      </div>
    </template>

    <!-- 右侧配置面板占位 -->
    <template #right>
      <div class="p-4 bg-gray-50 h-full">
        <h3>右侧配置面板占位</h3>
        <div class="mt-4">
          <div class="p-2 bg-white border rounded mb-2">属性配置1</div>
          <div class="p-2 bg-white border rounded mb-2">属性配置2</div>
          <div class="p-2 bg-white border rounded mb-2">属性配置3</div>
        </div>
      </div>
    </template>

    <!-- 🔥 新增：底部状态栏占位 -->
    <template #footer>
      <div class="flex items-center justify-between w-full p-2 bg-yellow-50 border-t">
        <div class="flex items-center space-x-4">
          <span class="text-sm">📊 底部状态栏 (enableFooterArea: {{ props.enableFooterArea }})</span>
          <span class="text-xs text-gray-600">组件数：0</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-green-600">● 配置开关正常</span>
        </div>
      </div>
    </template>
  </PanelLayout>
</template>

<style scoped>
/* 🔥 渲染器容器样式 - 避免双滚动条但保持功能 */
.renderer-main-area {
  position: relative;
  background-color: var(--body-color, #f8fafc);
  transition: all 0.2s ease;
}

.renderer-container {
  width: 100%;
  position: relative; /* 🔥 改为relative，避免绝对定位限制 */
}

/* 🔥 拖拽状态样式 */
.renderer-main-area.dragging {
  border: 2px dashed var(--primary-color, #1890ff);
  background-color: var(--primary-color-hover, rgba(24, 144, 255, 0.1));
}

.renderer-main-area.dragging::before {
  content: '拖拽组件到此处';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: var(--primary-color, #1890ff);
  font-weight: 500;
  z-index: 10;
  pointer-events: none;
}

/* 🔥 主题适配 */
[data-theme='dark'] .renderer-main-area {
  background-color: var(--body-color, #1f1f1f);
}

[data-theme='dark'] .renderer-main-area.dragging {
  border-color: var(--primary-color, #3b82f6);
  background-color: rgba(59, 130, 246, 0.1);
}

[data-theme='dark'] .renderer-main-area.dragging::before {
  color: var(--primary-color, #3b82f6);
}
</style>
