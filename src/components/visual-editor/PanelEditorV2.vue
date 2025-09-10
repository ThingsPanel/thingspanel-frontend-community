<script setup lang="ts">
/**
 * PanelEditor V2 - 基于 PanelLayout 的新一代可视化编辑器
 *
 * 实现真实的工具栏和渲染器切换功能
 */

import { ref, computed, onMounted, onUnmounted, watch, toRaw, provide } from 'vue'
import { $t } from '@/locales'
import PanelLayout from './components/PanelLayout.vue'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor } from './hooks'
import { ConfigurationPanel } from './configuration'
import { usePreviewMode } from './hooks/usePreviewMode'
import type { RendererType } from './types'
import { useMessage, useDialog } from 'naive-ui'
import { getBoard, PutBoard } from '@/service/api'
import { smartDeepClone } from '@/utils/deep-clone'

// 🔥 轮询系统导入
import { useGlobalPollingManager } from './core/GlobalPollingManager'
import { usePanelPollingManager } from './hooks/usePanelPollingManager'
import { editorDataSourceManager } from './core/EditorDataSourceManager'
import { configurationIntegrationBridge as configurationManager } from './configuration/ConfigurationIntegrationBridge'
import PollingController from './components/PollingController.vue'

// 🔥 接收测试页面的配置props
interface Props {
  panelId: string
  showToolbar?: boolean
  showPageHeader?: boolean
  enableHeaderArea?: boolean
  enableToolbarArea?: boolean
  enableFooterArea?: boolean
  customLayoutClass?: string
  defaultRenderer?: RendererType // 🔥 新增：默认渲染器类型
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: false,
  customLayoutClass: '',
  defaultRenderer: 'gridstack' // 🔥 默认使用GridStack渲染器
})

const message = useMessage()
const dialog = useDialog()

// 🔥 定义emit事件 - 测试页面需要监听这些事件
const emit = defineEmits<{
  'state-manager-ready': [stateManager: any]
  'widget-added': [widget: any]
  'node-select': [nodeId: string]
  'editor-ready': [editor: any]
}>()

const panelData = ref<any>({})
const preEditorConfig = ref<any>(null)

// 基础状态
const isEditing = ref(true)
const leftCollapsed = ref(true) // 🔥 左侧默认关闭，只有点击添加组件按钮才打开
const rightCollapsed = ref(true) // 🔥 右侧默认关闭

// 🔥 编辑器核心功能
const currentRenderer = ref<RendererType>(props.defaultRenderer)

// 🔥 监听props.defaultRenderer的变化，实现响应式渲染器切换
watch(
  () => props.defaultRenderer,
  newRenderer => {
    if (newRenderer && newRenderer !== currentRenderer.value) {
      currentRenderer.value = newRenderer
      console.log('🔄 渲染器已切换为:', newRenderer)
    }
  },
  { immediate: true }
)
const showWidgetTitles = ref(true)
const isSaving = ref(false)
const hasChanges = ref(false)
const dataFetched = ref(false) // 简化版，直接设为true
const isUnmounted = ref(false)

// 🔥 拖拽状态管理
const isDragging = ref(false)
const isDragOver = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')

// 🔥 底部显示状态管理
const showFooter = ref(false) // 预览模式的触发状态

// 🔥 计算实际的footer显示状态
const actualFooterShow = computed(() => {
  if (isEditing.value) {
    // 编辑模式：按外部传入的enableFooterArea决定
    return props.enableFooterArea
  } else {
    // 预览模式：通过触发器控制，且必须enableFooterArea为true
    return props.enableFooterArea && showFooter.value
  }
})

// 创建编辑器上下文
const editorContext = createEditor()
const { stateManager, addWidget, updateNode, selectNode } = editorContext
const { setPreviewMode, isPreviewMode } = usePreviewMode()

// 🔥 轮询管理器实例
const pollingManager = useGlobalPollingManager()

// 🔥 组件执行器注册表
const componentExecutorRegistry = ref(new Map<string, () => Promise<void>>())

// 🔥 提供管理器给子组件使用
provide('editorDataSourceManager', editorDataSourceManager)
// 🔥 关键修复：提供 editorContext 给所有子组件，确保配置能真正同步
provide('editorContext', editorContext)
provide('componentExecutorRegistry', componentExecutorRegistry.value)

// 🔥 轮询管理组合式函数
const pollingManagerDependencies = {
  pollingManager,
  stateManager,
  configurationManager,
  editorDataSourceManager
}
const {
  initializePollingTasksAndEnable: initializePollingTasksAndEnableFromManager,
  handlePollingToggle: handlePollingToggleFromManager,
  handlePollingEnabled: handlePollingEnabledFromManager,
  handlePollingDisabled: handlePollingDisabledFromManager
} = usePanelPollingManager(pollingManagerDependencies)

// 🔥 全局轮询状态
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// 🔥 计算选中的组件对象 - 从老版本移植
const selectedWidget = computed(() => {
  if (!selectedNodeId.value) return null
  const node = stateManager.nodes.find(n => n.id === selectedNodeId.value)
  return node || null
})

// 编辑器配置
const editorConfig = ref({
  gridConfig: {},
  canvasConfig: {}
})

// This is from PanelEditor.vue's usePanelDataManager
const getState = () => {
  console.log('🔧 getState - 开始获取状态...')
  
  const widgets = toRaw(stateManager.nodes).map(widget => {
    // 🔥 关键修复：从 configurationManager 获取数据源配置并添加到组件中
    const savedConfig = configurationManager.getConfiguration(widget.id)
    const dataSourceConfig = savedConfig?.dataSource || null
    
    console.log(`🔧 getState - 组件 ${widget.id}:`)
    console.log('  - savedConfig:', savedConfig)
    console.log('  - dataSourceConfig:', dataSourceConfig)
    
    // 🔥 额外调试：如果没有数据源配置，打印警告
    if (!dataSourceConfig) {
      console.warn(`⚠️ 组件 ${widget.id} 没有数据源配置！可能需要检查配置保存逻辑`)
      console.log('  - configurationManager中的所有配置:', configurationManager.getAllConfigurations())
    }
    
    // 🔥 数据优化：只保存必要的数据，移除冗余的metadata
    const optimizedWidget = {
      id: widget.id,
      type: widget.type,
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      label: widget.label,
      showLabel: widget.showLabel,
      properties: widget.properties,
      renderer: widget.renderer,
      layout: widget.layout,
      dataSource: dataSourceConfig,
      // 🔥 只保留必要的元数据
      metadata: {
        version: widget.metadata?.version || '2.0.0',
        createdAt: widget.metadata?.createdAt,
        updatedAt: Date.now(),
        isCard2Component: widget.metadata?.isCard2Component,
        card2ComponentId: widget.metadata?.card2ComponentId,
        // 🔥 关键修复：保留数据源基本定义信息（组件的数据源结构）
        card2Definition: widget.metadata?.card2Definition ? {
          type: widget.metadata.card2Definition.type,
          name: widget.metadata.card2Definition.name,
          description: widget.metadata.card2Definition.description,
          dataSources: widget.metadata.card2Definition.dataSources, // 🔥 必须保留！
          // 移除: defaultConfig、settingConfig、component、configComponent等大字段
        } : undefined
        // 移除: 完整的Vue组件定义、defaultConfig、settingConfig等
      }
    }
    
    return optimizedWidget
  })
  
  const config = toRaw(editorConfig.value)
  
  console.log('🔧 getState - 最终状态:')
  console.log('  - widgets数量:', widgets.length)
  console.log('  - widgets详情:', widgets.map(w => ({ id: w.id, hasDataSource: !!w.dataSource })))
  console.log('  - config:', config)
  
  return {
    widgets,
    config
  }
}

// This is also from PanelEditor.vue's usePanelDataManager, simplified
const setState = (state: any) => {
  if (!state) return

  const clonedState = smartDeepClone(state)
  const widgets = clonedState.widgets || []
  const config = clonedState.config || {}

  console.log('🔧 setState - 设置组件数量:', widgets.length)
  console.log('🔧 setState - 配置:', config)

  if (Array.isArray(widgets)) {
    // 🔥 处理组件数据，恢复数据源配置和必要的metadata
    const processedWidgets = widgets.map(widget => {
      // 🔥 关键修复：恢复数据源配置到 configurationManager
      if (widget.dataSource) {
        console.log('🔧 恢复数据源配置:', widget.id, widget.dataSource)
        configurationManager.updateConfiguration(widget.id, 'dataSource', widget.dataSource)
      } else {
        console.warn(`⚠️ 组件 ${widget.id} 没有数据源配置`)
      }

      // 🔥 确保组件有基本的运行时metadata
      const processedWidget = {
        ...widget,
        metadata: {
          ...widget.metadata,
          isCard2Component: true,
          card2ComponentId: widget.type
        }
      }
      
      console.log(`✅ 处理组件 ${widget.id}:`, {
        hasDataSource: !!widget.dataSource,
        hasCard2Definition: !!widget.metadata?.card2Definition
      })
      
      return processedWidget
    })
    
    stateManager.setNodes(processedWidgets)
  }

  editorConfig.value = {
    gridConfig: config.gridConfig || {},
    canvasConfig: config.canvasConfig || {}
  }
}


const fetchBoard = async () => {
  try {
    dataFetched.value = false
    const { data } = await getBoard(props.panelId)
    panelData.value = data

    if (data?.config) {
      // 🔥 完全兼容的配置解析逻辑
      const fullConfig = JSON.parse(data.config)

      console.log('🔍 原始配置结构:', fullConfig)

      // 检查是否是新的嵌套结构（包含 visualEditor 字段）
      if (fullConfig.visualEditor) {
        console.log('✅ 发现新版本格式 (visualEditor)')
        setState(fullConfig.visualEditor)
        preEditorConfig.value = smartDeepClone(fullConfig.visualEditor)
      } else if (fullConfig.widgets !== undefined || fullConfig.config !== undefined) {
        // 🔥 兼容老版本的直接格式 - 老版本直接保存 {widgets: [...], config: {...}}
        console.log('✅ 发现老版本格式 (直接 widgets + config)')
        setState(fullConfig)
        preEditorConfig.value = smartDeepClone(fullConfig)
      } else if (Array.isArray(fullConfig)) {
        // 🔥 兼容更老的数组格式
        console.log('✅ 发现数组格式 (超老版本)')
        const legacyState = { widgets: fullConfig, config: { gridConfig: {}, canvasConfig: {} } }
        setState(legacyState)
        preEditorConfig.value = smartDeepClone(legacyState)
      } else {
        // 🔥 未知结构或空对象，设置默认状态
        console.log('⚠️  未识别的配置格式，使用默认状态')
        const emptyState = { widgets: [], config: { gridConfig: {}, canvasConfig: {} } }
        setState(emptyState)
        preEditorConfig.value = emptyState
      }
    } else {
      // 设置默认空状态
      console.log('📝 没有配置数据，使用默认状态')
      const emptyState = { widgets: [], config: { gridConfig: {}, canvasConfig: {} } }
      setState(emptyState)
      preEditorConfig.value = emptyState
    }
  } catch (error) {
    message.error($t('common.loadFailed') || '加载面板数据失败')
    console.error('加载面板数据失败:', error)
  } finally {
    dataFetched.value = true
  }
}

onMounted(async () => {
  await fetchBoard()

  // 🔥 初始化数据源管理器和配置管理器
  try {
    await configurationManager.initialize()
    if (!editorDataSourceManager.isInitialized()) {
      await editorDataSourceManager.initialize()
    }

    // 🔥 设置组件执行器注册表
    editorDataSourceManager.setComponentExecutorRegistry(componentExecutorRegistry.value)
  } catch (error) {
    console.error('初始化管理器失败:', error)
  }

  // 🔥 初始化轮询系统（仅在预览模式下）
  if (!isEditing.value && isPreviewMode.value) {
    initializePollingTasksAndEnable()
  }

  // 初始化完成，无需全局监听

  // 🔥 触发state-manager-ready事件，让测试页面知道编辑器已准备好
  emit('state-manager-ready', stateManager)
  emit('editor-ready', editorContext)
})

// 🔥 组件卸载时清理
onUnmounted(() => {
  // 无需清理
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

// 🔥 轮询事件处理函数（使用真正的处理逻辑）
const handlePollingToggle = handlePollingToggleFromManager
const handlePollingEnabled = handlePollingEnabledFromManager
const handlePollingDisabled = handlePollingDisabledFromManager

// 🔥 初始化轮询任务并启用（使用真正的轮询逻辑）
const initializePollingTasksAndEnable = () => {
  console.log('🔛 初始化轮询任务并启用')
  initializePollingTasksAndEnableFromManager()
}

// 🔥 Footer 轮询切换函数
const toggleFooterPolling = () => {
  const wasEnabled = globalPollingEnabled.value

  if (!wasEnabled) {
    pollingManager.enableGlobalPolling()
    message.success($t('visualEditor.pollingEnabled'))
    handlePollingEnabled()
  } else {
    pollingManager.disableGlobalPolling()
    message.info($t('visualEditor.pollingDisabled'))
    handlePollingDisabled()
  }

  handlePollingToggle(!wasEnabled)
}

// 🔥 右下角触发器交互
const handleTriggerHover = () => {
  showFooter.value = true
}

const handleFooterMouseLeave = () => {
  showFooter.value = false
}

// 🔥 工具栏事件处理
const handleModeChange = (mode: 'edit' | 'preview') => {
  const editMode = mode === 'edit'
  isEditing.value = editMode
  setPreviewMode(!editMode)

  if (editMode) {
    // 🔴 关闭全局轮询（编辑模式）
    pollingManager.disableGlobalPolling()
    console.log('🔴 全局轮询已关闭（编辑模式）')

    // 编辑模式不需要控制showFooter，由actualFooterShow自动处理
  } else {
    // 🔛 自动启动全局轮询（预览模式默认开启）
    initializePollingTasksAndEnable()

    // 🔥 预览模式：重置footer状态为隐藏
    showFooter.value = false

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

    // 🔥 统一格式：直接保存简单格式，新老版本都能读取
    const { error } = await PutBoard({
      id: props.panelId,
      config: JSON.stringify(currentState), // 直接保存 {widgets: [], config: {}}
      name: panelData.value?.name,
      home_flag: panelData.value?.home_flag
    })

    if (error) {
      throw new Error(error)
    }

    message.success($t('page.dataForward.saveSuccess') || '保存成功')
    hasChanges.value = false
    preEditorConfig.value = smartDeepClone(currentState)
  } catch (error) {
    message.error($t('page.dataForward.saveFailed') || '保存失败')
    console.error('保存失败:', error)
  } finally {
    isSaving.value = false
  }
}

// 🔥 拖拽事件处理 - 来自WidgetLibrary组件
const handleDragStart = (widget: any, event: DragEvent) => {
  isDragging.value = true
  draggedComponent.value = widget.type
}

const handleDragEnd = (widget: any, event: DragEvent) => {
  isDragging.value = false
  draggedComponent.value = null
}

// 🔥 拖放事件处理 - 支持从左侧面板拖拽添加组件
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragLeave = (event: DragEvent) => {
  // 只有当离开整个拖放区域时才取消高亮
  if (!event.currentTarget || !event.relatedTarget) {
    isDragOver.value = false
    return
  }

  const target = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement

  if (!target.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  try {
    if (!event.dataTransfer) return

    const dragDataStr = event.dataTransfer.getData('application/json')
    if (!dragDataStr) {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataStr)

    if (!dragData.type) {
      console.warn('拖拽数据缺少组件类型')
      return
    }

    // 复用现有的添加组件逻辑
    await handleAddWidget({ type: dragData.type })
    message.success(`组件 "${dragData.type}" 添加成功`)
  } catch (error) {
    console.error('拖放添加组件失败:', error)
    message.error('拖放添加组件失败')
  }
}

// 🔥 组件操作处理
const handleAddWidget = async (widget: { type: string }) => {
  try {
    await addWidget(widget.type)
    hasChanges.value = true
    console.log('✅ 组件添加成功:', widget.type)

    // 🔥 发射widget-added事件，通知测试页面
    emit('widget-added', { type: widget.type })
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
        message.success($t('visualEditor.configImportSuccess', '配置导入成功'))
      } catch (error) {
        message.error($t('visualEditor.configImportFailed', '配置文件解析失败'))
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
// 🔥 网格配置变更处理 - 按照老版实现
const handleGridstackConfigChange = (config: Record<string, any>) => {
  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...config }
  hasChanges.value = true
}

const handleCanvasConfigChange = (config: Record<string, any>) => {
  editorConfig.value.canvasConfig = { ...editorConfig.value.canvasConfig, ...config }
  hasChanges.value = true
}

// 🔥 渲染器事件处理 - 简化版，移除不必要的中转
const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)

  // 🔥 发射node-select事件，通知测试页面
  emit('node-select', nodeId)
}

const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectNode('')
}

const handleRequestSettings = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)
  rightCollapsed.value = false // 只有右键菜单的"配置"才打开右侧面板
}

// 🔥 数据源相关事件处理 - 简化版，主要用于ConfigurationPanel正常工作
const handleDataSourceManagerUpdate = (updateData: any) => {
  // 在新架构中，数据源更新直接通过ConfigEventBus处理
  // 这里主要是为了让ConfigurationPanel正常工作，不做具体处理
  // 数据源管理更新处理
}

const handleMultiDataSourceUpdate = (componentId: string, data: any) => {
  // 新架构中数据源直接通过GridstackRenderer管理
  // 多数据源更新处理
}

const handleMultiDataSourceConfigUpdate = (componentId: string, config: any) => {
  // 新架构中配置更新通过ConfigEventBus处理
  // 数据源配置更新处理
}

const handleRequestCurrentData = (componentId: string) => {
  // 新架构中数据请求直接通过simpleDataBridge处理
  // 请求当前数据处理
}
</script>

<template>
  <div class="panel-editor-wrapper">
    <PanelLayout
      :mode="isEditing ? 'edit' : 'preview'"
      :left-collapsed="leftCollapsed"
      :right-collapsed="rightCollapsed"
      :show-header="props.enableHeaderArea && props.showPageHeader"
      :show-toolbar="props.enableToolbarArea && props.showToolbar"
      :show-footer="actualFooterShow"
      :custom-class="props.customLayoutClass"
      @update:left-collapsed="leftCollapsed = $event"
      @update:right-collapsed="rightCollapsed = $event"
    >
      <!-- 标题区域 -->
      <template #header>
        <div class="panel-header">
          <h1 class="panel-title">可视化面板编辑器 V2</h1>
          <div class="panel-meta">
            <span class="panel-id">{{ props.panelId.slice(0, 8) }}...</span>
            <span class="panel-version">基于多渲染器架构</span>
          </div>
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
        <WidgetLibrary @add-widget="handleAddWidget" />
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
        <div v-else class="renderer-main-area w-full relative" @click="handleCanvasClick">
          <!-- Canvas 渲染器 -->
          <CanvasRenderer
            v-if="currentRenderer === 'canvas' && dataFetched && !isUnmounted"
            key="canvas-renderer-v2"
            :readonly="!isEditing"
            :show-widget-titles="showWidgetTitles"
            class="renderer-container"
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
            @node-select="handleNodeSelect"
            @canvas-click="handleCanvasClick"
            @request-settings="handleRequestSettings"
          />
        </div>
      </template>

      <!-- 🔥 右侧配置面板 -->
      <template #right>
        <ConfigurationPanel
          :selected-widget="selectedWidget"
          :show-widget-titles="showWidgetTitles"
          :grid-config="editorConfig.gridConfig"
          @toggle-widget-titles="showWidgetTitles = $event"
          @grid-config-change="handleGridstackConfigChange"
          @data-source-manager-update="handleDataSourceManagerUpdate"
          @multi-data-source-update="handleMultiDataSourceUpdate"
          @multi-data-source-config-update="handleMultiDataSourceConfigUpdate"
          @request-current-data="handleRequestCurrentData"
        />
      </template>

      <!-- 底部状态栏 -->
      <template #footer>
        <div class="panel-footer auto-hide-footer" @mouseleave="handleFooterMouseLeave">
          <div class="status-section">
            <span class="status-text">渲染器: {{ currentRenderer }}</span>
            <span class="status-text">组件数: {{ stateManager.nodes.length }}</span>
            <span v-if="hasChanges" class="status-text">有未保存更改</span>

            <!-- 🔥 轮询状态显示 -->
            <span v-if="!isEditing" class="status-text polling-status">
              轮询: {{ globalPollingEnabled ? '运行中' : '已暂停' }}
              <span class="polling-stats">({{ pollingStats.activeTasks }}/{{ pollingStats.totalTasks }})</span>
            </span>
          </div>
          <div class="info-section">
            <span class="info-text">{{ $t('visualEditor.ready', 'V2 编辑器已就绪') }}</span>

            <!-- 🔥 内置轮询控制器 - 仅在预览模式下显示 -->
            <div v-if="!isEditing && dataFetched" class="footer-polling-controller">
              <n-button
                :type="globalPollingEnabled ? 'success' : 'default'"
                :ghost="!globalPollingEnabled"
                size="small"
                class="footer-polling-btn"
                @click="toggleFooterPolling"
              >
                <template #icon>
                  <span class="polling-icon">{{ globalPollingEnabled ? '⏸️' : '▶️' }}</span>
                </template>
                {{ globalPollingEnabled ? $t('visualEditor.pollingPause') : $t('visualEditor.pollingStart') }}
              </n-button>
            </div>
          </div>
        </div>
      </template>
    </PanelLayout>

    <!-- 🔥 右下角触发器 - 仅在预览模式显示 -->
    <div v-if="props.enableFooterArea && !isEditing" class="footer-trigger" @mouseenter="handleTriggerHover"></div>
  </div>
</template>

<style scoped>
/* 🔥 编辑器包装器 */
.panel-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 🔥 头部和底部样式 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.panel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-id {
  font-size: 12px;
  color: var(--text-color-2);
  font-family: monospace;
}

.panel-version {
  font-size: 12px;
  color: var(--info-color);
  font-weight: 500;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  background: var(--card-color);
  border-top: 1px solid var(--border-color);
}

/* 🔥 自动隐藏 Footer 动画样式 */
.auto-hide-footer {
  transform: translateY(0);
  opacity: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* 🔥 Footer 隐藏状态 - 通过 PanelLayout 的 v-show 控制 */
.panel-layout[data-footer-hidden='true'] .auto-hide-footer {
  transform: translateY(100%);
  opacity: 0;
}

/* 🔥 Footer 悬浮时的增强样式 */
.auto-hide-footer:hover {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  background: var(--card-color);
}

/* 🔥 暗色主题适配 */
[data-theme='dark'] .auto-hide-footer {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .auto-hide-footer:hover {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
}

/* 🔥 右下角触发器样式 */
.footer-trigger {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  z-index: 1000;
  background: transparent;
  cursor: pointer;
}

/* 🔥 触发器悬浮提示（可选） */
.footer-trigger::before {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: rgba(24, 160, 88, 0.6);
  border-radius: 50%;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.footer-trigger:hover::before {
  opacity: 1;
  background: rgba(24, 160, 88, 0.8);
  transform: scale(1.2);
}

/* 暗色主题适配 */
[data-theme='dark'] .footer-trigger::before {
  background: rgba(16, 185, 129, 0.6);
}

[data-theme='dark'] .footer-trigger:hover::before {
  background: rgba(16, 185, 129, 0.8);
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-text {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 🔥 轮询状态特殊样式 */
.status-text.polling-status {
  color: var(--success-color);
  font-weight: 500;
}

.polling-stats {
  font-size: 11px;
  opacity: 0.8;
  color: inherit;
  margin-left: 4px;
}

.info-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  font-size: 12px;
  color: var(--success-color);
  font-weight: 500;
}

/* 🔥 Footer 轮询控制器样式 */
.footer-polling-controller {
  display: flex;
  align-items: center;
}

.footer-polling-btn {
  padding: 4px 8px !important;
  font-size: 11px !important;
  height: 28px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.footer-polling-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.footer-polling-btn .polling-icon {
  font-size: 12px;
  line-height: 1;
}

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

/* 🔥 拖放悬停状态样式 */
.renderer-main-area.drag-over {
  border: 2px solid var(--success-color, #52c41a);
  background-color: rgba(82, 196, 26, 0.1);
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.2);
}

.renderer-main-area.drag-over::before {
  content: '松开鼠标添加组件';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: var(--success-color, #52c41a);
  font-weight: 600;
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

[data-theme='dark'] .renderer-main-area.drag-over {
  border-color: var(--success-color, #10b981);
  background-color: rgba(16, 185, 129, 0.1);
}

[data-theme='dark'] .renderer-main-area.drag-over::before {
  color: var(--success-color, #10b981);
}

/* 🔥 全屏拖放接收覆盖层 - 整洁清晰 */
.drag-drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
  pointer-events: auto;
}

.drag-drop-overlay::before {
  content: '松开添加';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
  user-select: none;
  z-index: 10000;
  pointer-events: none;
}

[data-theme='dark'] .drag-drop-overlay::before {
  color: rgba(255, 255, 255, 0.5);
}
</style>
