<script setup lang="ts">
/**
 * PanelEditor V2 - 基于 PanelLayout 的新一代可视化编辑器
 *
 * 实现真实的工具栏和渲染器切换功能
 */

import { ref, computed, onMounted, watch, toRaw, provide } from 'vue'
import { $t } from '@/locales'
import PanelLayout from './components/PanelLayout.vue'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor } from './hooks'
import { ConfigurationPanel, configurationManager } from './configuration'
import { usePreviewMode } from './hooks/usePreviewMode'
import type { RendererType, VisualEditorWidget } from './types'
import { useMessage, useDialog } from 'naive-ui'
import { getBoard, PutBoard } from '@/service/api'
import { smartDeepClone } from '@/utils/deep-clone'

// 🔥 添加数据源管理器和相关依赖
import { editorDataSourceManager } from './core/EditorDataSourceManager'
import { useGlobalPollingManager } from './core/GlobalPollingManager'
import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'

// 🔥 提供EditorDataSourceManager给子组件
provide('editorDataSourceManager', editorDataSourceManager)

// 🔥 组件执行器注册表
const componentExecutorRegistry = ref(new Map<string, () => Promise<void>>())
provide('componentExecutorRegistry', componentExecutorRegistry.value)

// 🔥 将组件执行器注册表传递给EditorDataSourceManager
editorDataSourceManager.setComponentExecutorRegistry(componentExecutorRegistry.value)

// 初始化 Card 2.1 集成
useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true
})

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
const leftCollapsed = ref(true) // 🔥 左侧默认关闭，只有点击添加组件按钮才打开

// 🔥 多数据源数据存储 - 以组件ID为键
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})

// 🔥 多数据源配置存储 - 以组件ID为键，存储完整配置信息
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 🔥 轮询管理器实例
const pollingManager = useGlobalPollingManager()
const globalPollingEnabled = ref(false)
const pollingStats = ref({})
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
const isDragOver = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')

// 🔥 添加selectedWidget计算属性，匹配老版本的接口
const selectedWidget = computed<VisualEditorWidget | null>(() => {
  if (!selectedNodeId.value) return null
  const node = stateManager.nodes.find(node => node.id === selectedNodeId.value)
  if (node) {
    return node as VisualEditorWidget
  }
  return null
})

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
  const widgets = clonedState.widgets || []
  const config = clonedState.config || {}

  console.log('🔧 setState - 设置组件数量:', widgets.length)
  console.log('🔧 setState - 配置:', config)

  if (Array.isArray(widgets)) {
    stateManager.setNodes(widgets)
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

onMounted(() => {
  fetchBoard()
  
  // 🔥 初始化数据源事件监听器
  setupDataSourceEventListeners()
  
  // 🔥 初始化轮询管理器
  if (pollingManager) {
    globalPollingEnabled.value = pollingManager.isGlobalPollingEnabled()
  }
})

// 🔥 设置数据源事件监听器
const setupDataSourceEventListeners = () => {
  try {
    // 监听数据更新事件
    const dataUpdateListener = (eventData: { componentId: string; result: any }) => {
      const { componentId, result } = eventData
      
      if (result.success && result.data) {
        try {
          // 检查数据是否实际发生变化，避免不必要的响应式更新
          const existingData = multiDataSourceStore.value[componentId]
          const hasDataChanged = !existingData || JSON.stringify(existingData) !== JSON.stringify(result.data)
          
          if (hasDataChanged) {
            // 将数据分发到 multiDataSourceStore，供组件使用
            multiDataSourceStore.value[componentId] = result.data
          }
        } catch (error) {
          console.error('处理数据更新失败:', error)
        }
      }
    }
    
    // 监听状态变化事件
    const statusChangeListener = (eventData: { componentId: string; status: string; error?: string }) => {
      const { componentId, status, error } = eventData
      if (error) {
        console.warn(`组件 ${componentId} 数据获取失败: ${error}`)
      }
    }
    
    // 监听轮询状态变化事件
    const pollingStatusListener = (eventData: { componentId: string; isPolling: boolean }) => {
      const { componentId, isPolling } = eventData
      console.log(`组件 ${componentId} 轮询状态: ${isPolling ? '开启' : '关闭'}`)
    }
    
    // 注册监听器
    if (editorDataSourceManager.isInitialized()) {
      editorDataSourceManager.on('data-updated', dataUpdateListener)
      editorDataSourceManager.on('component-status-changed', statusChangeListener)
      editorDataSourceManager.on('polling-status-changed', pollingStatusListener)
    }
  } catch (error) {
    console.error('设置数据源事件监听器失败:', error)
  }
}

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
  console.log('🎯 从WidgetLibrary开始拖拽:', widget.type, 'isDragging:', isDragging.value)
}

const handleDragEnd = (widget: any, event: DragEvent) => {
  isDragging.value = false
  draggedComponent.value = null
  console.log('🎯 从WidgetLibrary结束拖拽:', widget.type, 'isDragging:', isDragging.value)
}

// 🔥 拖放事件处理 - 支持从左侧面板拖拽添加组件
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  console.log('🎯 dragover 事件', event.type, 'dropEffect:', event.dataTransfer?.dropEffect)
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
    console.log('🎯 拖放组件:', dragData)
    
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
// 🔥 网格配置变更处理 - 按照老版实现
const handleGridstackConfigChange = (config: Record<string, any>) => {
  console.log('GridStack配置变更:', config)
  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...config }
  hasChanges.value = true
}
const handleCanvasConfigChange = (config: Record<string, any>) => {
  console.log('Canvas配置变更:', config)
  editorConfig.value.canvasConfig = { ...editorConfig.value.canvasConfig, ...config }
  hasChanges.value = true
}

// 🔥 渲染器事件处理
const handleRendererReady = () => console.log('渲染器就绪')
const handleRendererError = () => console.log('渲染器错误')
const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId) // 🔥 调用真实的selectNode方法
  // 移除自动打开右侧面板，只有右键菜单配置才能打开
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
  rightCollapsed.value = false // 🔥 只有右键菜单的"配置"才打开右侧面板
  console.log('请求设置:', nodeId)
}

// 🔥 添加缺失的数据源相关事件处理函数（从老版本复制）

/**
 * 处理多数据源更新事件
 */
const handleMultiDataSourceUpdate = (updateData: { componentId: string; data: any }) => {
  const { componentId, data } = updateData
  console.log('多数据源数据更新:', componentId, data)
  
  // 更新多数据源存储
  if (data) {
    multiDataSourceStore.value[componentId] = data
  }
  
  hasChanges.value = true
}

/**
 * 处理多数据源配置更新事件
 */
const handleMultiDataSourceConfigUpdate = (updateData: { componentId: string; config: any }) => {
  const { componentId, config } = updateData
  console.log('多数据源配置更新:', componentId, config)
  
  // 更新多数据源配置存储
  if (config) {
    multiDataSourceConfigStore.value[componentId] = config
  }
  
  hasChanges.value = true
}

/**
 * 🔥 处理配置面板请求当前数据
 * 提供组件当前运行时数据给配置面板，实现内存数据优先原则
 */
const handleRequestCurrentData = (widgetId: string) => {
  console.log('请求当前数据:', widgetId)
  
  // 获取当前运行时配置数据
  const currentConfig = multiDataSourceConfigStore.value[widgetId]
  
  if (currentConfig) {
    // 通过 ConfigurationManager 临时更新配置，让配置面板可以获取到
    const tempDataSourceConfig = {
      type: 'data-mapping',
      enabled: true,
      config: currentConfig,
      metadata: {
        componentType: selectedWidget.value?.type || 'unknown',
        mappingType: 'json-path',
        updatedAt: Date.now(),
        isRuntime: true // 标记为运行时数据
      }
    }
    
    // 临时更新 ConfigurationManager 中的数据源配置
    configurationManager.updateConfiguration(widgetId, 'dataSource', tempDataSourceConfig)
  }
}

/**
 * 🔥 处理数据源管理器更新事件
 * 从配置面板接收数据源配置更新，并同步到编辑器数据源管理器
 */
const handleDataSourceManagerUpdate = (updateData: {
  componentId: string
  componentType: string
  config: any
  action: 'update' | 'delete' | 'config-updated' | 'config-restored'
}) => {
  try {
    const { componentId, componentType, config, action } = updateData
    console.log('数据源管理器更新:', updateData)
    
    // 🔥 防护：确保编辑器数据源管理器已初始化且组件存在
    if (!editorDataSourceManager.isInitialized()) {
      console.warn('数据源管理器未初始化')
      return
    }
    
    // 🔥 防护：确保组件节点存在
    const componentNode = stateManager.nodes.find(n => n.id === componentId)
    if (!componentNode) {
      console.warn('组件节点不存在:', componentId)
      return
    }
    
    // 🔥 防护：检查配置是否有效
    if (action === 'update' && !config) {
      console.warn('更新操作缺少配置数据')
      return
    }
    
    if (action === 'update' || action === 'config-updated' || action === 'config-restored') {
      // 检查多种配置格式
      const hasDataSourceBindings = config.dataSourceBindings && Object.keys(config.dataSourceBindings).length > 0
      const hasDataSources =
        config.type === 'data-source-bindings' && (config.dataSource1 || config.dataSource2 || config.dataSource3)
      const hasNewArchitectureConfig =
        config.config &&
        ((config.config.dataSource1 && config.config.dataSource1.type) ||
          (config.config.dataSource2 && config.config.dataSource2.type) ||
          (config.config.dataSource3 && config.config.dataSource3.type) ||
          (config.config.data && config.config.data.type))
      const hasAnyDataSourceConfig = config.dataSource1 || config.dataSource2 || config.dataSource3 || config.data
      const hasValidDataSourceType =
        config.type && ['static', 'api', 'websocket', 'data-source-bindings'].includes(config.type)
      
      if (
        !hasDataSourceBindings &&
        !hasDataSources &&
        !hasNewArchitectureConfig &&
        !hasAnyDataSourceConfig &&
        !hasValidDataSourceType
      ) {
        console.warn('无效的数据源配置格式')
        return
      }
      
      // 更新编辑器数据源管理器
      const existingConfig = editorDataSourceManager.getComponentConfig(componentId)
      
      if (existingConfig) {
        // 组件已存在，先删除再重新注册来实现更新
        editorDataSourceManager.removeComponentDataSource(componentId)
        editorDataSourceManager.registerComponentDataSource(
          componentId,
          componentType,
          config,
          { type: 'timer', interval: 30000 } // 默认30秒轮询
        )
      } else {
        // 组件不存在，新注册
        editorDataSourceManager.registerComponentDataSource(
          componentId,
          componentType,
          config,
          { type: 'timer', interval: 30000 } // 默认30秒轮询
        )
      }
      
      // 🔧 修复：注册后立即启动数据源，确保实时配置能立即生效
      setTimeout(() => {
        editorDataSourceManager.startComponentDataSource(componentId)
      }, 100) // 短暂延迟确保注册完成
      
      // 同步到本地配置存储
      if (config.dataSourceBindings && Object.keys(config.dataSourceBindings).length > 0) {
        multiDataSourceConfigStore.value[componentId] = config
      }
    } else if (action === 'delete') {
      // 删除数据源配置
      editorDataSourceManager.removeComponentDataSource(componentId)
      
      // 清理本地存储
      delete multiDataSourceConfigStore.value[componentId]
      delete multiDataSourceStore.value[componentId]
    }
    
    // 标记有变化
    hasChanges.value = true
  } catch (error) {
    console.error('数据源管理器更新失败:', error)
  }
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
      <div
        v-else
        class="renderer-main-area w-full relative"
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
          :multi-data-source-store="multiDataSourceStore"
          :multi-data-source-config-store="multiDataSourceConfigStore"
          class="renderer-container"
          @ready="handleRendererReady"
          @error="handleRendererError"
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
        :preview-mode="!isEditing"
        :global-polling-enabled="globalPollingEnabled"
        @toggle-widget-titles="showWidgetTitles = $event"
        @grid-config-change="handleGridstackConfigChange"
        @multi-data-source-update="handleMultiDataSourceUpdate"
        @multi-data-source-config-update="handleMultiDataSourceConfigUpdate"
        @request-current-data="handleRequestCurrentData"
        @data-source-manager-update="handleDataSourceManagerUpdate"
      />
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
