<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref, toRaw, watch } from 'vue'
import { smartDeepClone } from '@/utils/deep-clone'
import { useDialog, useMessage, NDrawer, NDrawerContent } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import FullScreen from '@/components/common/full-screen.vue'
import { $t } from '@/locales'
import { getBoard, PutBoard } from '@/service/api'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { initializeSettings } from '@/core/interaction-system'
import ConfigurationPanel from './configuration/ConfigurationPanel.vue'
import { configurationIntegrationBridge as configurationManager } from './configuration/ConfigurationIntegrationBridge'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor } from './hooks'
import { usePreviewMode } from './hooks/usePreviewMode'
import { usePanelConfigManager } from './hooks/usePanelConfigManager'
import { usePanelDataManager } from './hooks/usePanelDataManager'
import { usePanelPollingManager } from './hooks/usePanelPollingManager'
import { usePanelEventHandler } from './hooks/usePanelEventHandler'
import { usePanelLifecycleManager } from './hooks/usePanelLifecycleManager'
import PollingController from './components/PollingController.vue'
import type { RendererType, VisualEditorWidget, GraphData } from './types'

// 导入数据源注册
// import './data-sources' // 临时注释，文件不存在

import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'
// 🔥 轮询系统导入
import { useGlobalPollingManager } from './core/GlobalPollingManager'
import { editorDataSourceManager } from './core/EditorDataSourceManager'
import { interactionManager } from '@/card2.1/core/interaction-manager'

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

// 初始化设置面板
initializeSettings()

const dialog = useDialog()
const message = useMessage()
const appStore = useAppStore()

const props = defineProps<{
  panelId: string
  /**
   * 是否显示工具栏
   * 默认为 true，保持向后兼容
   */
  showToolbar?: boolean
  /**
   * 是否显示页面标题栏
   * 默认为 true，保持向后兼容
   */
  showPageHeader?: boolean
}>()

const emit = defineEmits<{
  'state-manager-ready': [stateManager: any]
}>()

// 状态管理
const fullui = ref()
const isEditing = ref(false) // 默认预览模式
const isSaving = ref(false)

// 🔥 性能优化：状态缓存
const stateCache = ref<{
  lastGetState?: any
  lastSetState?: any
  lastStateHash?: string
  cacheTime?: number
}>({})
const STATE_CACHE_DURATION = 5000 // 5秒缓存
const hasChanges = ref(false)
const isUnmounted = ref(false)

// 交互测试相关代码已迁移到 visual-editor-details/index.vue

// 编辑器状态
const currentRenderer = ref<RendererType>('gridstack')

// 抽屉状态 - 初始状态：预览模式，抽屉关闭
const showLeftDrawer = ref(false) // 左侧组件库抽屉
const showRightDrawer = ref(false) // 右侧属性面板抽屉

// 拖拽状态管理
const isDragging = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')
const showWidgetTitles = ref(true) // 总开关，默认显示标题

// 多数据源数据存储 - 以组件ID为键
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})

// 多数据源配置存储 - 以组件ID为键，存储完整配置信息
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 轮询管理器实例
const pollingManager = useGlobalPollingManager()

// 全局轮询开关状态和处理函数已迁移到 usePanelPollingManager

// 全屏功能
const { isFullscreen, toggle } = useFullscreen(fullui)

// 创建编辑器上下文
const editorContext = createEditor()
const { stateManager, addWidget, selectNode, updateNode } = editorContext
const { setPreviewMode, isPreviewMode } = usePreviewMode()

// 🔥 配置管理组合式函数
const { parseConfig, validateConfig, migrateConfig, getDefaultConfig, analyzeCloneability } = usePanelConfigManager()

// 🔥 数据管理组合式函数
const dataManagerDependencies = {
  stateManager,
  configurationManager,
  multiDataSourceConfigStore,
  isUnmounted
}
const {
  panelData: panelDataFromManager,
  dataFetched: dataFetchedFromManager,
  editorConfig: editorConfigFromManager,
  preEditorConfig: preEditorConfigFromManager,
  setState: setStateFromManager,
  getState: getStateFromManager,
  fetchBoard: fetchBoardFromManager,
  initializePanelData: initializePanelDataFromManager
} = usePanelDataManager(props, dataManagerDependencies)

// 🔥 轮询管理组合式函数
const pollingManagerDependencies = {
  pollingManager,
  stateManager,
  configurationManager,
  editorDataSourceManager
}
const {
  globalPollingEnabled: globalPollingEnabledFromManager,
  pollingStats: pollingStatsFromManager,
  initializePollingTasksAndEnable: initializePollingTasksAndEnableFromManager,
  handlePollingToggle: handlePollingToggleFromManager,
  handlePollingEnabled: handlePollingEnabledFromManager,
  handlePollingDisabled: handlePollingDisabledFromManager
} = usePanelPollingManager(pollingManagerDependencies)

// 使用来自数据管理器的状态变量（替换原有的）
const panelData = panelDataFromManager
const dataFetched = dataFetchedFromManager
const editorConfig = editorConfigFromManager
const preEditorConfig = preEditorConfigFromManager

// 使用来自数据管理器的函数
const setState = setStateFromManager
const getState = getStateFromManager
const fetchBoard = fetchBoardFromManager
const initializePanelData = initializePanelDataFromManager

// 使用来自轮询管理器的状态和函数
const globalPollingEnabled = globalPollingEnabledFromManager
const pollingStats = pollingStatsFromManager
const initializePollingTasksAndEnable = initializePollingTasksAndEnableFromManager
const handlePollingToggle = handlePollingToggleFromManager
const handlePollingEnabled = handlePollingEnabledFromManager
const handlePollingDisabled = handlePollingDisabledFromManager

// 🔥 事件处理组合式函数
const eventHandlerDependencies = {
  // 状态管理
  showLeftDrawer,
  showRightDrawer,
  isDragging,
  draggedComponent,
  currentRenderer,
  showWidgetTitles,
  hasChanges,
  multiDataSourceStore,
  multiDataSourceConfigStore,
  selectedNodeId,

  // 配置管理
  editorConfig,
  panelData,

  // 编辑器功能
  stateManager,
  addWidget,
  setState,
  getState,
  getDefaultConfig,
  selectNode,
  editorDataSourceManager
}
const {
  // 抽屉控制
  handleToggleLeftDrawer: handleToggleLeftDrawerFromHandler,
  handleToggleRightDrawer: handleToggleRightDrawerFromHandler,

  // 拖拽处理
  handleDragStart: handleDragStartFromHandler,
  handleDragEnd: handleDragEndFromHandler,

  // 渲染器和视图控制
  handleRendererChange: handleRendererChangeFromHandler,
  handleToggleWidgetTitles: handleToggleWidgetTitlesFromHandler,

  // 组件操作
  handleAddWidget: handleAddWidgetFromHandler,
  handleClearAll: handleClearAllFromHandler,

  // 导入导出
  handleImportConfig: handleImportConfigFromHandler,
  handleExportConfig: handleExportConfigFromHandler,

  // 配置变更
  handleGridConfigChange: handleGridConfigChangeFromHandler,
  handleGridstackConfigChange: handleGridstackConfigChangeFromHandler,
  handleCanvasConfigChange: handleCanvasConfigChangeFromHandler,

  // 数据源处理
  handleMultiDataSourceUpdate: handleMultiDataSourceUpdateFromHandler,
  handleMultiDataSourceConfigUpdate: handleMultiDataSourceConfigUpdateFromHandler,

  // 画布操作控制
  handleZoomIn: handleZoomInFromHandler,
  handleZoomOut: handleZoomOutFromHandler,
  handleResetZoom: handleResetZoomFromHandler,
  handleUndo: handleUndoFromHandler,
  handleRedo: handleRedoFromHandler,

  // 渲染器事件处理
  handleRendererReady: handleRendererReadyFromHandler,
  handleRendererError: handleRendererErrorFromHandler,

  // 节点选择和交互
  handleNodeSelect: handleNodeSelectFromHandler,
  handleRequestSettings: handleRequestSettingsFromHandler,
  handleCanvasClick: handleCanvasClickFromHandler,

  // 组件生命周期事件
  handleComponentAdded: handleComponentAddedFromHandler,
  handleComponentRemoved: handleComponentRemovedFromHandler,
  handleComponentConfigChanged: handleComponentConfigChangedFromHandler
} = usePanelEventHandler(props, eventHandlerDependencies)

// 使用来自事件处理器的函数
const handleToggleLeftDrawer = handleToggleLeftDrawerFromHandler
const handleToggleRightDrawer = handleToggleRightDrawerFromHandler
const handleDragStart = handleDragStartFromHandler
const handleDragEnd = handleDragEndFromHandler
const handleRendererChange = handleRendererChangeFromHandler
const handleToggleWidgetTitles = handleToggleWidgetTitlesFromHandler
const handleAddWidget = handleAddWidgetFromHandler
const handleClearAll = handleClearAllFromHandler
const handleImportConfig = handleImportConfigFromHandler
const handleExportConfig = handleExportConfigFromHandler
const handleGridConfigChange = handleGridConfigChangeFromHandler
const handleGridstackConfigChange = handleGridstackConfigChangeFromHandler
const handleCanvasConfigChange = handleCanvasConfigChangeFromHandler
const handleMultiDataSourceUpdate = handleMultiDataSourceUpdateFromHandler
const handleMultiDataSourceConfigUpdate = handleMultiDataSourceConfigUpdateFromHandler
const handleZoomIn = handleZoomInFromHandler
const handleZoomOut = handleZoomOutFromHandler
const handleResetZoom = handleResetZoomFromHandler
const handleUndo = handleUndoFromHandler
const handleRedo = handleRedoFromHandler
const handleRendererReady = handleRendererReadyFromHandler
const handleRendererError = handleRendererErrorFromHandler
const handleNodeSelect = handleNodeSelectFromHandler
const handleRequestSettings = handleRequestSettingsFromHandler
const handleCanvasClick = handleCanvasClickFromHandler
const handleComponentAdded = handleComponentAddedFromHandler
const handleComponentRemoved = handleComponentRemovedFromHandler
const handleComponentConfigChanged = handleComponentConfigChangedFromHandler

// 🔥 生命周期管理组合式函数
// 事件监听器引用，用于清理
const dataUpdateListener = ref<Function | null>(null)
const statusChangeListener = ref<Function | null>(null)
const pollingStatusListener = ref<Function | null>(null)
const selectedWidgetTimerRef = ref<NodeJS.Timeout | null>(null)

const lifecycleManagerDependencies = {
  // 状态管理
  isEditing,
  isUnmounted,
  dataFetched,
  multiDataSourceConfigStore,
  selectedWidgetTimer: selectedWidgetTimerRef,

  // 编辑器功能
  stateManager,
  setPreviewMode,
  initializePanelData,
  editorDataSourceManager,
  handleComponentAdded,
  handleComponentRemoved,
  handleComponentConfigChanged,

  // 事件监听器引用
  dataUpdateListener,
  statusChangeListener,
  pollingStatusListener,

  // 组件通信
  emit
}
const { initializeLifecycleManagement: initializeLifecycleManagementFromManager } =
  usePanelLifecycleManager(lifecycleManagerDependencies)

// 使用来自生命周期管理器的函数
const initializeLifecycleManagement = initializeLifecycleManagementFromManager

// 初始化生命周期管理
initializeLifecycleManagement()

const selectedWidget = computed<VisualEditorWidget | null>(() => {
  if (!selectedNodeId.value) return null
  const node = stateManager.nodes.find(node => node.id === selectedNodeId.value)
  if (node) {
    return node as VisualEditorWidget
  }
  return null
})

// 监听选中组件变化，添加防抖
watch(
  () => selectedWidget.value,
  (newWidget, oldWidget) => {
    // 清除之前的定时器
    if (selectedWidgetTimerRef.value) {
      clearTimeout(selectedWidgetTimerRef.value)
    }

    // 设置新的定时器，防抖100ms
    selectedWidgetTimerRef.value = setTimeout(() => {
      // 只有当组件真正不同时才更新selectedNodeId
      if (newWidget?.id !== oldWidget?.id) {
        selectedNodeId.value = newWidget?.id || ''
      }
    }, 100)
  },
  { deep: true }
)

// setState 函数已迁移到 usePanelDataManager

// getState 函数已迁移到 usePanelDataManager

// fetchBoard 函数已迁移到 usePanelDataManager

// parseConfig 函数已迁移到 usePanelConfigManager

// validateConfig 函数已迁移到 usePanelConfigManager

// migrateConfig 函数已迁移到 usePanelConfigManager

// 已迁移到 /utils/deep-clone.ts

// analyzeCloneability 函数已迁移到 usePanelConfigManager

// getDefaultConfig 函数已迁移到 usePanelConfigManager

// 渲染器选项
const rendererOptions = computed(() => [
  { label: $t('visualEditor.canvas'), value: 'canvas' as RendererType },
  { label: $t('visualEditor.gridstack'), value: 'gridstack' as RendererType }
])

// 工具栏事件处理
const handleModeChange = (mode: 'edit' | 'preview') => {
  console.log('🔄 模式切换请求:', { from: isPreviewMode ? 'preview' : 'edit', to: mode })

  if (mode === 'edit') {
    console.log('📝 切换到编辑模式')

    // 🔴 关闭全局轮询（编辑模式）
    pollingManager.disableGlobalPolling()

    isEditing.value = true
    setPreviewMode(false) // 同步全局预览模式

    // 🎯 改进用户体验：进入编辑模式时自动打开左侧组件库抽屉
    if (!showLeftDrawer.value) {
      console.log('🔧 自动打开左侧组件库抽屉')
      showLeftDrawer.value = true
    }
  } else {
    console.log('👁️ 切换到预览模式')
    const currentState = getState()
    if (JSON.stringify(currentState) !== JSON.stringify(preEditorConfig.value)) {
      console.log('⚠️ 有未保存的更改，显示确认对话框')
      dialog.warning({
        title: $t('card.quitWithoutSave'),
        positiveText: $t('device_template.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: () => {
          // 用户确认退出，重置配置
          console.log('✅ 用户确认退出，重置配置')
          isEditing.value = false
          setPreviewMode(true) // 同步全局预览模式

          // 🔛 自动启动全局轮询（预览模式默认开启）
          console.log('🚀 [PanelEditor] 预览模式：自动启动全局轮询')
          initializePollingTasksAndEnable()

          // 退出编辑模式时关闭所有抽屉
          showLeftDrawer.value = false
          showRightDrawer.value = false
          // 清空选中状态
          selectedNodeId.value = ''
          // 重要：确保editorConfig中的isEditing为false，避免状态冲突
          editorConfig.value = { ...preEditorConfig.value, isEditing: false }
          // 重要：在调用setState之前，确保preEditorConfig中的isEditing为false
          const resetConfig = { ...preEditorConfig.value, isEditing: false }
          setState(resetConfig)
        },
        onNegativeClick: () => {
          // 用户取消退出，保持当前状态，不做任何操作
          console.log('❌ 用户取消退出编辑模式，保持当前配置')
        }
      })
    } else {
      // 没有未保存的更改，直接退出编辑模式
      console.log('✅ 没有未保存的更改，直接退出编辑模式')
      isEditing.value = false
      setPreviewMode(true) // 同步全局预览模式

      // 🔛 自动启动全局轮询（预览模式默认开启）
      console.log('🚀 [PanelEditor] 预览模式：自动启动全局轮询')
      initializePollingTasksAndEnable()

      // 退出编辑模式时关闭所有抽屉
      showLeftDrawer.value = false
      showRightDrawer.value = false
      // 清空选中状态
      selectedNodeId.value = ''
    }
  }

  console.log('🎯 模式切换完成:', { isEditing: isEditing.value, isPreviewMode: isPreviewMode, mode })
}

// 🔥 轮询管理功能

// initializePollingTasksAndEnable 函数已迁移到 usePanelPollingManager

// 事件处理函数已迁移到 usePanelEventHandler

// handleAddWidget 和 handleClearAll 已迁移到 usePanelEventHandler

// 导入导出、视图控制等事件处理函数已迁移到 usePanelEventHandler

// 画布配置、多数据源处理函数已迁移到 usePanelEventHandler

/**
 * 🔥 新增：处理配置面板请求当前数据
 * 提供组件当前运行时数据给配置面板，实现内存数据优先原则
 */
const handleRequestCurrentData = (widgetId: string) => {
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
  } else {
  }
}

/**
 * 🔥 新增：处理数据源管理器更新事件
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

    // 🔥 防护：确保编辑器数据源管理器已初始化且组件存在
    if (!editorDataSourceManager.isInitialized()) {
      console.warn('⚠️ [PanelEditor] 编辑器数据源管理器未初始化，跳过更新')
      return
    }

    // 🔥 防护：确保组件节点存在
    const componentNode = stateManager.nodes.find(n => n.id === componentId)
    if (!componentNode) {
      console.warn(`⚠️ [PanelEditor] 组件节点不存在: ${componentId}，跳过数据源配置`)
      return
    }

    // 🔥 防护：检查配置是否有效
    if (action === 'update' && !config) {
      console.warn(`⚠️ [PanelEditor] 配置为空，跳过更新: ${componentId}`)
      return
    }

    // 🔥 修复：支持新的配置格式检查
    if (action === 'update' || action === 'config-updated') {
      // 检查多种配置格式
      const hasDataSourceBindings = config.dataSourceBindings && Object.keys(config.dataSourceBindings).length > 0
      const hasDataSources =
        config.type === 'data-source-bindings' && (config.dataSource1 || config.dataSource2 || config.dataSource3)

      // 🔥 新增：支持新三文件架构的配置格式检查
      const hasNewArchitectureConfig =
        config.config &&
        ((config.config.dataSource1 && config.config.dataSource1.type) ||
          (config.config.dataSource2 && config.config.dataSource2.type) ||
          (config.config.dataSource3 && config.config.dataSource3.type) ||
          (config.config.data && config.config.data.type))

      // 🔥 新增：检查任何配置字段中是否包含数据源配置
      const hasAnyDataSourceConfig = config.dataSource1 || config.dataSource2 || config.dataSource3 || config.data

      // 🔥 新增：检查配置是否包含有效的数据源类型
      const hasValidDataSourceType =
        config.type && ['static', 'api', 'websocket', 'data-source-bindings'].includes(config.type)

      if (
        !hasDataSourceBindings &&
        !hasDataSources &&
        !hasNewArchitectureConfig &&
        !hasAnyDataSourceConfig &&
        !hasValidDataSourceType
      ) {
        console.log(`ℹ️ [PanelEditor] 配置无有效数据源，跳过更新: ${componentId}`)
        console.log('🔍 [PanelEditor] 检查的配置格式:', {
          hasDataSourceBindings,
          hasDataSources,
          hasNewArchitectureConfig,
          hasAnyDataSourceConfig,
          hasValidDataSourceType,
          configKeys: Object.keys(config),
          configType: config.type,
          fullConfig: config
        })
        return
      }

      console.log(`🔧 [PanelEditor] 配置有效，继续处理: ${componentId}`, {
        hasDataSourceBindings,
        hasDataSources,
        hasNewArchitectureConfig,
        hasAnyDataSourceConfig,
        hasValidDataSourceType,
        configType: config.type,
        configKeys: Object.keys(config)
      })
    }

    if (action === 'update' || action === 'config-updated' || action === 'config-restored') {
      // 更新编辑器数据源管理器

      // 先检查组件是否已注册
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
        console.log(`🚀 [PanelEditor] 启动组件数据源: ${componentId}`)
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
    console.error('❌ [PanelEditor] 数据源管理器更新失败:', error)

    // 🔥 防护：错误时不要影响整体流程，只记录错误
    if (process.env.NODE_ENV === 'development') {
      console.error('详细错误信息:', error)
    }
  }
}

// 画布操作控制、渲染器事件处理、节点选择和交互函数已迁移到 usePanelEventHandler

// 保存面板
const handleSave = async () => {
  // 检查是否为Canvas渲染器，如果是则显示开发中提示
  if (currentRenderer.value === 'canvas') {
    message.warning($t('visualEditor.canvasNotSupported'))
    console.warn('Canvas功能尚未完成，无法保存')
    return
  }

  isSaving.value = true
  try {
    const currentState = getState()

    // 🔍 保存过程调试
    console.log('💾 [SAVE] 开始保存，getState返回:', {
      nodesCount: currentState.nodes?.length || 0,
      hasComponentConfigurations: !!currentState.componentConfigurations,
      componentConfigurationKeys: currentState.componentConfigurations
        ? Object.keys(currentState.componentConfigurations)
        : [],
      multiDataSourceConfigStoreKeys: Object.keys(multiDataSourceConfigStore.value),
      fullState: currentState
    })

    // 解析现有配置
    let existingConfig: any = {}
    if (panelData.value?.config) {
      try {
        existingConfig = parseConfig(panelData.value.config)
      } catch (error: any) {
        console.warn('解析现有配置失败:', error)
      }
    }

    // 先构建基础配置（不包含 configSize）
    const baseConfig = {
      legacyComponents: existingConfig.legacyComponents || [],
      visualEditor: {
        ...currentState,
        metadata: {
          version: '1.0.0',
          updatedAt: Date.now(),
          editorType: 'visual-editor',
          // 面板基本信息
          panelInfo: {
            id: props.panelId,
            name: panelData.value?.name || '',
            homeFlag: panelData.value?.home_flag || false,
            createdAt: panelData.value?.created_at || Date.now(),
            updatedAt: Date.now()
          },
          // 编辑器版本信息
          editorVersion: '1.0.0',
          // 渲染器信息
          rendererInfo: {
            type: currentRenderer.value,
            version: '1.0.0',
            features: ['drag', 'resize', 'grid', 'canvas']
          },
          // 配置统计信息
          stats: {
            totalNodes: currentState.nodes.length,
            card2Nodes: currentState.nodes.filter((node: any) => node.metadata?.isCard2Component).length,
            legacyNodes: currentState.nodes.filter((node: any) => !node.metadata?.isCard2Component).length,
            hasGridConfig: !!currentState.gridConfig,
            hasCanvasConfig: !!currentState.canvasConfig,
            configSize: 0 // 初始值，稍后会被更新
          }
        }
      }
    }

    // 现在可以安全地计算配置大小
    const configSize = JSON.stringify(baseConfig).length
    baseConfig.visualEditor.metadata.stats.configSize = configSize

    console.log('💾 保存配置统计:', baseConfig.visualEditor.metadata.stats)

    const { error } = await PutBoard({
      id: props.panelId,
      config: JSON.stringify(baseConfig),
      name: panelData.value?.name,
      home_flag: panelData.value?.home_flag
    })

    if (!error) {
      // 🔥 智能深拷贝：使用优化的smartDeepClone
      preEditorConfig.value = smartDeepClone(currentState)
      hasChanges.value = false
      message.success($t('page.dataForward.saveSuccess'))
    } else {
      message.error($t('page.dataForward.saveFailed'))
    }
  } catch (err: any) {
    message.error($t('page.dataForward.saveFailed'))
    console.error('保存失败:', err)
  } finally {
    isSaving.value = false
  }
}

// 监听状态变化，自动设置 hasChanges
watch(
  [
    () => currentRenderer.value,
    () => showWidgetTitles.value,
    () => showLeftDrawer.value,
    () => showRightDrawer.value,
    () => editorConfig.value.gridConfig,
    () => editorConfig.value.canvasConfig,
    () => stateManager.nodes
  ],
  () => {
    // 只有在数据加载完成后才监听变化
    if (dataFetched.value && !isUnmounted.value) {
      hasChanges.value = true
    }
  },
  { deep: true }
)

/**
 * 监听组件节点变化，自动同步数据源管理器
 */
watch(
  () => stateManager.nodes,
  (newNodes, oldNodes) => {
    if (!editorDataSourceManager.isInitialized()) return

    // 处理新增的组件
    const newNodeIds = newNodes.map(n => n.id)
    const oldNodeIds = oldNodes?.map(n => n.id) || []

    // 注册新增的组件
    const addedNodeIds = newNodeIds.filter(id => !oldNodeIds.includes(id))
    addedNodeIds.forEach(async nodeId => {
      const node = newNodes.find(n => n.id === nodeId)
      if (node) {
        try {
          await editorDataSourceManager.registerComponent(nodeId, {
            type: node.type || 'unknown',
            name: node.title || node.id,
            dataSources: multiDataSourceConfigStore.value[nodeId] || {},
            dataRequirements: node.dataRequirements || {}
          })
        } catch (error) {
          console.error(`❌ [PanelEditor] 注册组件 ${nodeId} 失败:`, error)
        }
      }
    })

    // 注销移除的组件
    const removedNodeIds = oldNodeIds.filter(id => !newNodeIds.includes(id))
    removedNodeIds.forEach(async nodeId => {
      try {
        await editorDataSourceManager.removeComponentDataSource(nodeId)
      } catch (error) {
        console.error(`❌ [PanelEditor] 注销组件 ${nodeId} 失败:`, error)
      }
    })
  },
  { deep: true }
)

/**
 * 同步现有组件的数据源配置到编辑器数据源管理器
 */
/**
 * 设置数据源事件监听器
 * 监听数据源管理器的事件，实现数据分发
 */
const setupDataSourceEventListeners = () => {
  try {
    // 创建监听器函数并保存引用
    dataUpdateListener = (eventData: { componentId: string; result: any }) => {
      const { componentId, result } = eventData

      // 🔥 性能优化：减少非必要的控制台输出

      if (result.success && result.data) {
        try {
          // 🔥 性能优化：检查数据是否实际发生变化，避免不必要的响应式更新
          const existingData = multiDataSourceStore.value[componentId]
          const hasDataChanged = !existingData || JSON.stringify(existingData) !== JSON.stringify(result.data)

          if (hasDataChanged) {
            // 🔥 关键：将数据分发到 multiDataSourceStore，供组件使用
            multiDataSourceStore.value[componentId] = result.data
          } else {
            // 数据未变化，跳过更新
          }

          // 标记有变化（可选，取决于是否希望数据更新触发保存提示）
          // hasChanges.value = true
        } catch (error) {
          console.error(`❌ [PanelEditor] 数据分发失败: ${componentId}`, error)
        }
      } else {
        console.warn(`⚠️ [PanelEditor] 数据更新失败: ${componentId}`, result.error)
      }
    }

    statusChangeListener = (eventData: { componentId: string; status: string; error?: string }) => {
      const { componentId, status, error } = eventData

      // 🔥 性能优化：只在开发环境输出状态变化日志

      if (error) {
        console.error(`❌ [PanelEditor] 组件 ${componentId} 出现错误:`, error)
        // 🔥 TODO: 可以在这里添加用户友好的错误通知UI
        // message.error(`组件 ${componentId} 数据获取失败: ${error}`)
      }
    }

    pollingStatusListener = (eventData: { componentId: string; isPolling: boolean }) => {
      const { componentId, isPolling } = eventData

      // 🔥 性能优化：只在开发环境输出轮询状态日志
    }

    // 注册监听器
    editorDataSourceManager.on('data-updated', dataUpdateListener)
    editorDataSourceManager.on('component-status-changed', statusChangeListener)
    editorDataSourceManager.on('polling-status-changed', pollingStatusListener)
  } catch (error) {
    console.error('❌ [PanelEditor] 数据源事件监听器设置失败:', error)
  }
}

/**
 * 设置组件生命周期监听器
 * 监听组件的添加、删除、配置变更等事件
 */
// setupComponentLifecycleListeners 已迁移到 usePanelLifecycleManager

// 组件生命周期事件处理函数已迁移到 usePanelEventHandler

const syncDataSourceConfigs = async () => {
  try {
    // 遍历所有节点，检查是否有数据源配置
    for (const node of stateManager.nodes) {
      if (node && node.id) {
        // 检查是否存在多数据源配置
        const multiConfig = multiDataSourceConfigStore.value[node.id]
        if (multiConfig && Object.keys(multiConfig).length > 0) {
          // 注册组件到数据源管理器
          await editorDataSourceManager.registerComponent(node.id, {
            type: node.type || 'unknown',
            name: node.title || node.id,
            dataSources: multiConfig,
            dataRequirements: node.dataRequirements || {}
          })
        }
      }
    }
  } catch (error) {
    console.error('❌ [PanelEditor] 数据源配置同步失败:', error)
  }
}

/**
 * 🔥 添加按照新架构开发的双数据源测试组件
 * 添加一个 dual-data-display 组件，配置两个数据源用于测试新架构
 */
const addNewArchitectureTestComponent = async () => {
  try {
    // 创建一个 dual-data-display 组件实例
    const testComponentId = `dual-data-display-${Date.now()}`

    const testComponent: VisualEditorWidget = {
      id: testComponentId,
      type: 'dual-data-display',
      name: '双数据源显示组件',
      layout: {
        canvas: {
          x: 50,
          y: 50,
          width: 500,
          height: 350,
          zIndex: 1
        },
        gridstack: {
          x: 0,
          y: 0,
          w: 4,
          h: 4
        }
      },
      config: {
        // 🔥 配置两个数据源用于测试新架构
        dataSources: {
          dataSource1: {
            type: 'static',
            enabled: true,
            config: {
              data: {
                sensor: 'temperature',
                value: 25.8,
                unit: '°C',
                status: 'normal',
                location: '机房A-01',
                timestamp: new Date().toISOString()
              }
            }
          },
          dataSource2: {
            type: 'static',
            enabled: true,
            config: {
              data: {
                device: 'humidity_sensor',
                reading: 62,
                unit: '%',
                status: 'active',
                location: '机房A-02',
                lastCheck: new Date().toISOString()
              }
            }
          }
        }
      },
      metadata: {
        addedAt: Date.now(),
        version: '2.0.0',
        architecture: 'dual-data-source-flow'
      }
    }

    // 添加组件到画布（只传类型字符串和位置）
    await addWidget('dual-data-display', { x: 50, y: 50 })

    // 获取刚添加的组件ID（从stateManager.nodes中找到最新的）
    const addedComponent = stateManager.nodes[stateManager.nodes.length - 1]
    const actualComponentId = addedComponent?.id || testComponentId

    // 更新组件的数据源配置
    updateNode(actualComponentId, {
      config: testComponent.config,
      metadata: {
        ...addedComponent?.metadata,
        ...testComponent.metadata
      }
    })

    // 选中新添加的组件
    selectNode(actualComponentId)

    return actualComponentId
  } catch (error) {
    console.error('❌ [PanelEditor] 添加新架构测试组件失败:', error)
    throw error
  }
}

// 初始化面板数据和配置的核心逻辑
// initializePanelData 函数已迁移到 usePanelDataManager

// 组件初始化和页签刷新监听已迁移到 usePanelLifecycleManager

// 暴露方法给父组件使用
defineExpose({
  initializePollingTasksAndEnable
})

// 组件生命周期管理（恢复多数据源配置、事件监听器清理、onUnmounted）已迁移到 usePanelLifecycleManager
</script>

<template>
  <div class="w-full" :class="{ 'px-5 py-5': props.showPageHeader !== false || props.showToolbar !== false }">
    <!-- 页面标题栏 - 根据 showPageHeader prop 控制显示 -->
    <div
      v-show="!appStore.fullContent && props.showPageHeader !== false"
      class="flex items-center justify-between border-b border-gray-200 px-10px pb-3 dark:border-gray-200/10"
    >
      <div>
        <NSpace align="center">
          <span class="text-14px font-medium line-height-normal">
            {{ $t('card.dashboard') }}：{{ panelData?.name }}
          </span>
        </NSpace>
      </div>
      <NSpace align="center">
        <FullScreen :full="isFullscreen" @click="toggle" />
      </NSpace>
    </div>

    <!-- 编辑器区域 -->
    <div ref="fullui" class="h-edit-area flex bg-white">
      <div v-if="!dataFetched" class="h-full flex items-center justify-center w-full">
        <n-spin size="large">
          <template #description>
            {{ $t('visualEditor.loading') }}
          </template>
        </n-spin>
      </div>

      <div v-else class="panel-editor w-full h-full flex flex-col">
        <!-- 工具栏 - 根据 showToolbar prop 控制显示 -->
        <div v-if="props.showToolbar !== false" class="toolbar-container flex-shrink-0">
          <VisualEditorToolbar
            v-if="dataFetched && !isUnmounted"
            :key="`toolbar-${currentRenderer}-${isPreviewMode ? 'preview' : 'edit'}`"
            :mode="isPreviewMode ? 'preview' : 'edit'"
            :current-renderer="currentRenderer"
            :available-renderers="rendererOptions"
            :is-saving="isSaving"
            :has-changes="hasChanges"
            :show-left-drawer="showLeftDrawer"
            :show-right-drawer="showRightDrawer"
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
        </div>

        <!-- 主内容区域 -->
        <div class="main-container flex-1 relative overflow-hidden" :class="{ dragging: isDragging }">
          <!-- 中央画布 -->
          <div class="canvas-container h-full w-full" @click="handleCanvasClick">
            <!-- 动态渲染器 -->
            <CanvasRenderer
              v-if="currentRenderer === 'canvas' && dataFetched && !isUnmounted"
              key="canvas-renderer"
              :readonly="isPreviewMode"
              :show-widget-titles="showWidgetTitles"
              class="renderer-container"
              @ready="handleRendererReady"
              @error="handleRendererError"
              @node-select="handleNodeSelect"
              @canvas-click="handleCanvasClick"
              @request-settings="handleRequestSettings"
            />
            <GridstackRenderer
              v-else-if="currentRenderer === 'gridstack' && dataFetched && !isUnmounted"
              key="gridstack-renderer"
              :readonly="isPreviewMode"
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

          <!-- 左侧组件库抽屉 -->
          <NDrawer
            v-model:show="showLeftDrawer"
            :width="320"
            placement="left"
            :show-mask="false"
            :mask-closable="true"
            :closable="true"
            :auto-focus="false"
            :z-index="1000"
            :trap-focus="false"
          >
            <NDrawerContent :title="$t('visualEditor.componentLibrary')" :native-scrollbar="false">
              <WidgetLibrary @add-widget="handleAddWidget" @drag-start="handleDragStart" @drag-end="handleDragEnd" />
            </NDrawerContent>
          </NDrawer>

          <!-- 右侧属性面板抽屉 -->
          <NDrawer
            v-model:show="showRightDrawer"
            :width="450"
            placement="right"
            :show-mask="true"
            :mask-closable="true"
            :closable="true"
            :auto-focus="false"
            :z-index="1000"
            :trap-focus="false"
          >
            <NDrawerContent :title="$t('visualEditor.propertySettings')" :native-scrollbar="false">
              <ConfigurationPanel
                :selected-widget="selectedWidget"
                :show-widget-titles="showWidgetTitles"
                :grid-config="editorConfig.gridConfig"
                :preview-mode="isPreviewMode"
                :global-polling-enabled="globalPollingEnabled"
                @toggle-widget-titles="handleToggleWidgetTitles"
                @grid-config-change="handleGridConfigChange"
                @multi-data-source-update="handleMultiDataSourceUpdate"
                @multi-data-source-config-update="handleMultiDataSourceConfigUpdate"
                @request-current-data="handleRequestCurrentData"
                @data-source-manager-update="handleDataSourceManagerUpdate"
              />
            </NDrawerContent>
          </NDrawer>
        </div>

        <!-- 低调的轮询控制器 - 仅在预览模式下显示 -->
        <PollingController
          v-if="isPreviewMode && dataFetched"
          mode="global"
          position="bottom-right"
          :show-stats="true"
          :low-profile="true"
          @polling-toggle="handlePollingToggle"
          @polling-enabled="handlePollingEnabled"
          @polling-disabled="handlePollingDisabled"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-editor {
  min-height: 600px;
}

.h-edit-area {
  height: calc(100% - 30px);
}

/* 画布容器 */
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--n-body-color);
}

.renderer-container {
  width: 100%;
  height: 100%;
}

/* 拖拽状态样式 */
.main-container.dragging .n-drawer {
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.main-container.dragging .n-drawer-mask {
  pointer-events: none;
}

/* 确保拖拽元素在最顶层 */
.dragging-element {
  position: fixed;
  z-index: 9999 !important;
  pointer-events: none;
}

/* 抽屉内容优化 */
:deep(.n-drawer-content) {
  height: 100%;
}

:deep(.n-drawer-content .n-drawer-content__content) {
  padding: 0;
  height: 100%;
}

/* 左侧抽屉特殊样式 - 半透明效果，不影响拖拽 */
:deep(.n-drawer--left) {
  background-color: rgba(250, 250, 250, 0.9) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.n-drawer--left .n-drawer-content) {
  background-color: rgba(250, 250, 250, 0.9) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* 暗色主题下的左侧抽屉 */
:deep(.dark .n-drawer--left) {
  background-color: rgba(37, 37, 37, 0.9) !important;
}

:deep(.dark .n-drawer--left .n-drawer-content) {
  background-color: rgba(37, 37, 37, 0.9) !important;
}

/* 右侧抽屉增强阴影效果 */
:deep(.n-drawer--right) {
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
}

/* 工具栏容器 */
.toolbar-container {
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-editor {
    min-height: 400px;
  }
}
</style>
