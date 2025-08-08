<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDialog, useMessage, NDrawer, NDrawerContent } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import FullScreen from '@/components/common/full-screen.vue'
import { $t } from '@/locales'
import { getBoard, PutBoard } from '@/service/api'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { initializeSettings } from './settings'
import ConfigurationPanel from './configuration/ConfigurationPanel.vue'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor, usePreviewMode } from './hooks'
import type { RendererType, VisualEditorWidget, GraphData } from './types'

// 导入数据源注册
import './data-sources'

import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'

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

const props = defineProps<{ panelId: string }>()

// 状态管理
const panelData = ref<Panel.Board>()
const fullui = ref()
const isEditing = ref(false) // 默认预览模式
const isSaving = ref(false)
const dataFetched = ref(false)
const hasChanges = ref(false)
const isUnmounted = ref(false)

// 编辑器状态
const editorConfig = ref<any>({})
const preEditorConfig = ref<any>({})
const currentRenderer = ref<RendererType>('gridstack')

// 抽屉状态 - 初始状态：预览模式，抽屉关闭
const showLeftDrawer = ref(false) // 左侧组件库抽屉
const showRightDrawer = ref(false) // 右侧属性面板抽屉

// 拖拽状态管理
const isDragging = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')
const showWidgetTitles = ref(true) // 总开关，默认显示标题

// 全屏功能
const { isFullscreen, toggle } = useFullscreen(fullui)

// 创建编辑器上下文
const editorContext = createEditor()
const { stateManager, addWidget, selectNode } = editorContext
const { setPreviewMode, isPreviewMode } = usePreviewMode()

const selectedWidget = computed<VisualEditorWidget | null>(() => {
  if (!selectedNodeId.value) return null
  const node = stateManager.nodes.find(node => node.id === selectedNodeId.value)
  if (node) {
    return node as VisualEditorWidget
  }
  return null
})

// 监听选中组件变化，添加防抖
let selectedWidgetTimer: NodeJS.Timeout | null = null
watch(
  () => selectedWidget.value,
  (newWidget, oldWidget) => {
    // 清除之前的定时器
    if (selectedWidgetTimer) {
      clearTimeout(selectedWidgetTimer)
    }

    // 设置新的定时器，防抖100ms
    selectedWidgetTimer = setTimeout(() => {
      // 只有当组件真正不同时才更新selectedNodeId
      if (newWidget?.id !== oldWidget?.id) {
        selectedNodeId.value = newWidget?.id || ''
        console.log('🔧 PanelEditor - 选中组件变化:', {
          oldId: oldWidget?.id,
          newId: newWidget?.id
        })
      }
    }, 100)
  },
  { deep: true }
)

// 状态管理辅助方法
const setState = (config: any) => {
  console.log('🔄 设置编辑器状态:', config)

  // 重置状态
  stateManager.reset()

  // 加载节点
  if (config.nodes && Array.isArray(config.nodes)) {
    config.nodes.forEach((node: any) => {
      stateManager.addNode(node as GraphData)
    })
  }

  // 加载视口设置
  if (config.viewport) {
    stateManager.updateViewport(config.viewport)
  }

  // 恢复渲染器类型和编辑器状态
  if (config.currentRenderer) {
    currentRenderer.value = config.currentRenderer
  }
  if (config.showWidgetTitles !== undefined) {
    showWidgetTitles.value = config.showWidgetTitles
  }
  if (config.showLeftDrawer !== undefined) {
    showLeftDrawer.value = config.showLeftDrawer
  }
  if (config.showRightDrawer !== undefined) {
    showRightDrawer.value = config.showRightDrawer
  }

  // 恢复编辑状态（可选，通常不保存编辑状态）
  if (config.isEditing !== undefined) {
    console.log('🔄 setState - 设置编辑状态:', {
      oldIsEditing: isEditing.value,
      newIsEditing: config.isEditing,
      willSetPreviewMode: !config.isEditing
    })
    isEditing.value = config.isEditing
    // 同步全局预览模式状态
    setPreviewMode(!config.isEditing)
  }
  if (config.selectedNodeId !== undefined) {
    selectedNodeId.value = config.selectedNodeId
  }
  if (config.isDragging !== undefined) {
    isDragging.value = config.isDragging
  }
  if (config.draggedComponent !== undefined) {
    draggedComponent.value = config.draggedComponent
  }
}

const getState = () => {
  return {
    nodes: stateManager.nodes,
    canvasConfig: editorConfig.value.canvasConfig || {},
    gridConfig: editorConfig.value.gridConfig || {},
    viewport: stateManager.viewport,
    mode: stateManager.mode,
    // 渲染器类型和编辑器状态
    currentRenderer: currentRenderer.value,
    showWidgetTitles: showWidgetTitles.value,
    // 抽屉状态（用于恢复编辑状态）
    showLeftDrawer: showLeftDrawer.value,
    showRightDrawer: showRightDrawer.value,
    // 新增：编辑模式状态
    isEditing: isEditing.value,
    // 新增：选中的节点ID
    selectedNodeId: selectedNodeId.value,
    // 新增：拖拽状态（可选）
    isDragging: isDragging.value,
    draggedComponent: draggedComponent.value
  }
}

// 获取面板数据 - 学习 fetchBroad 的写法
const fetchBoard = async () => {
  try {
    const { data } = await getBoard(props.panelId)
    // 检查组件是否已经卸载
    if (isUnmounted.value) {
      console.log('组件已卸载，取消数据处理')
      return
    }
    if (data) {
      panelData.value = data
      console.log('📊 获取面板数据成功:', data)

      if (data.config) {
        console.log('📝 解析现有配置:', data.config)
        const config = parseConfig(data.config)
        editorConfig.value = config.visualEditor || getDefaultConfig()
        preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))

        // 恢复渲染器类型和编辑器状态
        if (editorConfig.value.currentRenderer) {
          currentRenderer.value = editorConfig.value.currentRenderer
        }
        if (editorConfig.value.showWidgetTitles !== undefined) {
          showWidgetTitles.value = editorConfig.value.showWidgetTitles
        }
        if (editorConfig.value.showLeftDrawer !== undefined) {
          showLeftDrawer.value = editorConfig.value.showLeftDrawer
        }
        if (editorConfig.value.showRightDrawer !== undefined) {
          showRightDrawer.value = editorConfig.value.showRightDrawer
        }

        // 加载到编辑器
        setState(editorConfig.value)
        console.log('🎯 加载编辑器配置:', editorConfig.value)
      } else {
        console.log('📝 配置为空，使用默认配置')
        editorConfig.value = getDefaultConfig()
        preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
        setState(editorConfig.value)
      }
      if (!isUnmounted.value) {
        dataFetched.value = true
        message.success($t('visualEditor.success'))
      }
    } else {
      console.warn('⚠️ 未获取到面板数据')
      if (!isUnmounted.value) {
        message.warning($t('visualEditor.warning'))
      }

      // 即使没有数据也要初始化默认配置
      editorConfig.value = getDefaultConfig()
      preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
      setState(editorConfig.value)
      if (!isUnmounted.value) {
        dataFetched.value = true
      }
    }
  } catch (error: any) {
    console.error('获取面板数据失败:', error)
    if (!isUnmounted.value) {
      message.warning($t('visualEditor.warning'))
    }

    // 出错时也要初始化默认配置，让编辑器能正常工作
    editorConfig.value = getDefaultConfig()
    preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
    setState(editorConfig.value)
    if (!isUnmounted.value) {
      dataFetched.value = true
    }
  }
}

// 解析配置
const parseConfig = (configString: string) => {
  try {
    const config = JSON.parse(configString)

    // 检查是否为新格式
    if (typeof config === 'object' && config.visualEditor) {
      // 验证配置格式
      const validatedConfig = validateConfig(config)
      return validatedConfig
    }

    // 兼容旧格式
    return {
      legacyComponents: Array.isArray(config) ? config : [],
      visualEditor: getDefaultConfig()
    }
  } catch (error: any) {
    console.warn('配置解析失败:', error)
    return {
      legacyComponents: [],
      visualEditor: getDefaultConfig()
    }
  }
}

// 验证配置格式
const validateConfig = (config: any) => {
  const defaultConfig = getDefaultConfig()

  // 确保 visualEditor 存在
  if (!config.visualEditor) {
    config.visualEditor = defaultConfig
    return config
  }

  // 验证并补充缺失的配置项
  const visualEditor = config.visualEditor

  // 确保基本配置项存在
  if (!visualEditor.nodes) visualEditor.nodes = defaultConfig.nodes
  if (!visualEditor.canvasConfig) visualEditor.canvasConfig = defaultConfig.canvasConfig
  if (!visualEditor.gridConfig) visualEditor.gridConfig = defaultConfig.gridConfig
  if (!visualEditor.viewport) visualEditor.viewport = defaultConfig.viewport
  if (!visualEditor.currentRenderer) visualEditor.currentRenderer = defaultConfig.currentRenderer
  if (!visualEditor.showWidgetTitles) visualEditor.showWidgetTitles = defaultConfig.showWidgetTitles
  if (!visualEditor.showLeftDrawer) visualEditor.showLeftDrawer = defaultConfig.showLeftDrawer
  if (!visualEditor.showRightDrawer) visualEditor.showRightDrawer = defaultConfig.showRightDrawer

  // 确保 legacyComponents 存在
  if (!config.legacyComponents) {
    config.legacyComponents = []
  }

  // 执行配置迁移
  const migratedConfig = migrateConfig(config)

  return migratedConfig
}

// 配置迁移函数
const migrateConfig = (config: any) => {
  const visualEditor = config.visualEditor

  // 检查版本并执行迁移
  const version = visualEditor.metadata?.version || '0.0.0'

  // 从 v0.x 迁移到 v1.0
  if (version.startsWith('0.')) {
    console.log('🔄 执行配置迁移: v0.x -> v1.0')

    // 添加缺失的配置项
    if (!visualEditor.currentRenderer) {
      visualEditor.currentRenderer = 'gridstack'
    }
    if (!visualEditor.showWidgetTitles) {
      visualEditor.showWidgetTitles = true
    }
    if (!visualEditor.showLeftDrawer) {
      visualEditor.showLeftDrawer = false
    }
    if (!visualEditor.showRightDrawer) {
      visualEditor.showRightDrawer = false
    }

    // 更新版本信息
    if (!visualEditor.metadata) {
      visualEditor.metadata = {}
    }
    visualEditor.metadata.version = '1.0.0'
    visualEditor.metadata.migratedAt = Date.now()
  }

  return config
}

// 默认配置
const getDefaultConfig = () => ({
  nodes: [],
  canvasConfig: {
    width: 1200,
    height: 800,
    showGrid: true,
    backgroundColor: '#f5f5f5'
  },
  gridConfig: {
    colNum: 24,
    rowHeight: 80,
    margin: [10, 10],
    isDraggable: true,
    isResizable: true,
    staticGrid: false
  },
  viewport: {},
  // 默认渲染器类型和编辑器状态
  currentRenderer: 'gridstack' as RendererType,
  showWidgetTitles: true,
  showLeftDrawer: false,
  showRightDrawer: false,
  // 新增：默认编辑状态
  isEditing: false,
  selectedNodeId: '',
  isDragging: false,
  draggedComponent: null
})

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
      // 退出编辑模式时关闭所有抽屉
      showLeftDrawer.value = false
      showRightDrawer.value = false
      // 清空选中状态
      selectedNodeId.value = ''
    }
  }

  console.log('🎯 模式切换完成:', { isEditing: isEditing.value, isPreviewMode: isPreviewMode, mode })
}

// 抽屉控制事件处理
const handleToggleLeftDrawer = () => {
  showLeftDrawer.value = !showLeftDrawer.value
  hasChanges.value = true
}

const handleToggleRightDrawer = () => {
  showRightDrawer.value = !showRightDrawer.value
  hasChanges.value = true
}

// 拖拽事件处理
const handleDragStart = (componentType: string) => {
  console.log('🎯 开始拖拽组件:', componentType)
  isDragging.value = true
  draggedComponent.value = componentType
}

const handleDragEnd = () => {
  console.log('🎯 结束拖拽')
  isDragging.value = false
  draggedComponent.value = null
}

const handleRendererChange = (renderer: RendererType) => {
  console.log('🔄 渲染器变更:', { old: currentRenderer.value, new: renderer })
  currentRenderer.value = renderer
  hasChanges.value = true
}

const handleAddWidget = async (widget: { type: string }) => {
  try {
    const widgetType = widget.type

    await addWidget(widgetType)
    hasChanges.value = true
    message.success($t('visualEditor.addWidgetSuccess', { type: widgetType }))
  } catch (error: any) {
    const widgetType = widget.type
    console.error(`❌ 添加组件失败 [${widgetType}]:`, error)
    message.error($t('visualEditor.addWidgetFailed', { type: widgetType, error: error.message || '未知错误' }))
  }
}

const handleClearAll = () => {
  stateManager.reset()
  hasChanges.value = true
  message.success($t('visualEditor.clearAllSuccess'))
}

// 导入导出处理
const handleImportConfig = (config: Record<string, any>) => {
  try {
    console.log('导入配置:', config)

    // 验证配置格式
    if (config && typeof config === 'object') {
      // 如果是新格式配置
      if (config.visualEditor) {
        editorConfig.value = config.visualEditor
        setState(config.visualEditor)
      }
      // 如果是直接的编辑器配置
      else if (config.nodes || config.canvasConfig) {
        editorConfig.value = config
        setState(config)
      }
      // 否则当作旧格式处理
      else {
        const newConfig = getDefaultConfig()
        editorConfig.value = newConfig
        setState(newConfig)
      }

      hasChanges.value = true
      message.success($t('visualEditor.configImportSuccess'))
    } else {
      throw new Error('无效的配置格式')
    }
  } catch (error: any) {
    console.error('导入配置失败:', error)
    message.error($t('visualEditor.configImportFailed', { error: error.message || '未知错误' }))
  }
}

const handleExportConfig = () => {
  try {
    const currentState = getState()
    const exportConfig = {
      visualEditor: {
        ...currentState,
        metadata: {
          version: '1.0.0',
          exportedAt: Date.now(),
          editorType: 'visual-editor',
          // 导出时的面板信息
          panelInfo: {
            id: props.panelId,
            name: panelData.value?.name || '',
            homeFlag: panelData.value?.home_flag || false,
            exportedAt: Date.now()
          },
          // 导出时的编辑器状态
          exportInfo: {
            totalNodes: currentState.nodes.length,
            rendererType: currentState.currentRenderer,
            hasGridConfig: !!currentState.gridConfig,
            hasCanvasConfig: !!currentState.canvasConfig,
            showWidgetTitles: currentState.showWidgetTitles
          }
        }
      }
    }

    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportConfig, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panel-config-${panelData.value?.name || 'unnamed'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    message.success($t('visualEditor.configExportSuccess'))
  } catch (error: any) {
    console.error('导出配置失败:', error)
    message.error($t('visualEditor.configExportFailed', { error: error.message || '未知错误' }))
  }
}

// 视图控制事件
const handleToggleWidgetTitles = (value: boolean) => {
  showWidgetTitles.value = value
  hasChanges.value = true
}

const handleGridConfigChange = (newGridConfig: any) => {
  console.log('🔧 PanelEditor - 网格配置变更:', {
    oldConfig: editorConfig.value.gridConfig,
    newConfig: newGridConfig
  })

  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...newGridConfig }
  hasChanges.value = true

  console.log('🔧 PanelEditor - 更新后配置:', editorConfig.value.gridConfig)
  console.log('🔧 PanelEditor - 当前完整配置:', editorConfig.value)
}

const handleGridstackConfigChange = (newGridConfig: any) => {
  console.log('🔧 PanelEditor - 工具栏网格配置变更:', {
    oldConfig: editorConfig.value.gridConfig,
    newConfig: newGridConfig
  })

  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...newGridConfig }
  hasChanges.value = true

  console.log('🔧 PanelEditor - 更新后配置:', editorConfig.value.gridConfig)
  console.log('🔧 PanelEditor - 当前完整配置:', editorConfig.value)
}

const handleCanvasConfigChange = (newCanvasConfig: any) => {
  console.log('🔧 PanelEditor - 画布配置变更:', {
    oldConfig: editorConfig.value.canvasConfig,
    newConfig: newCanvasConfig
  })

  editorConfig.value.canvasConfig = { ...editorConfig.value.canvasConfig, ...newCanvasConfig }
  hasChanges.value = true

  console.log('🔧 PanelEditor - 更新后配置:', editorConfig.value.canvasConfig)
}

const handleZoomIn = () => {
  // TODO: 实现缩放功能
  console.log('放大视图')
}

const handleZoomOut = () => {
  // TODO: 实现缩放功能
  console.log('缩小视图')
}

const handleResetZoom = () => {
  // TODO: 实现重置缩放功能
  console.log('重置缩放')
}

const handleUndo = () => {
  // TODO: 实现撤销功能
  console.log('撤销操作')
}

const handleRedo = () => {
  // TODO: 实现重做功能
  console.log('重做操作')
}

// 渲染器事件处理
const handleRendererReady = () => {
  console.log('✅ 渲染器已准备就绪')
}

const handleRendererError = (error: Error) => {
  console.error('❌ 渲染器错误:', error)
  message.error($t('visualEditor.rendererLoadFailed', { error: error.message }))
}

const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)
  // 节点选择通常不触发保存，但可以标记为有变化
  // hasChanges.value = true
}

const handleRequestSettings = (nodeId: string) => {
  if (nodeId) {
    selectedNodeId.value = nodeId
    selectNode(nodeId)
    showRightDrawer.value = true
  }
}

const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectNode('')
  // 取消选中时可以选择性隐藏属性面板（或保持展开）
  // rightCollapsed.value = true
}

// 保存面板
const handleSave = async () => {
  // 检查是否为Canvas渲染器，如果是则显示开发中提示
  if (currentRenderer.value === 'canvas') {
    message.warning('Canvas渲染器功能正在开发中，暂不支持保存')
    console.warn('Canvas功能尚未完成，无法保存')
    return
  }

  isSaving.value = true
  try {
    const currentState = getState()

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
      preEditorConfig.value = JSON.parse(JSON.stringify(currentState))
      hasChanges.value = false
      message.success($t('page.dataForward.saveSuccess'))
    } else {
      message.error($t('page.dataForward.saveFailed') || '保存失败')
    }
  } catch (err: any) {
    message.error($t('page.dataForward.saveFailed') || '保存失败')
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

// 学习 PanelManage 的 onMounted 写法
onMounted(() => {
  // 初始化时同步预览模式状态
  setPreviewMode(!isEditing.value)
  fetchBoard()
})

// 🧪 临时测试函数 - 用于测试数据源组件
const testUpdateData = () => {
  console.log('🧪 测试更新数据')

  // 使用editorContext获取节点数据
  const allNodes = editorContext.editorStore.nodes
  console.log('🔍 从editorStore获取的所有节点:', allNodes)
  console.log(
    '🔍 节点类型:',
    allNodes.map(node => ({ id: node.id, type: node.type }))
  )

  // 找到数据源测试组件
  const dataSourceTestWidgets = allNodes.filter(node => node.type === 'datasource-test')

  console.log('🎯 找到数据源测试组件:', dataSourceTestWidgets.length, '个')
  console.log('🎯 数据源测试组件详情:', dataSourceTestWidgets)

  if (dataSourceTestWidgets.length === 0) {
    message.warning('未找到数据源测试组件，请先添加组件到画布')
    return
  }

  // 更新所有数据源测试组件
  let updatedCount = 0
  dataSourceTestWidgets.forEach((node: any, index: number) => {
    // 为每个组件生成不同的测试数据
    const testData = {
      key1: Math.round((Math.random() * 100 + index * 10) * 100) / 100,
      key2: ['online', 'offline', 'maintenance', 'warning'][index % 4],
      key3: Math.floor(Math.random() * 1000) + index * 100
    }

    // 确保metadata对象存在
    if (!node.metadata) {
      node.metadata = {}
    }

    // 更新节点的card2Data
    node.metadata.card2Data = testData

    // 使用editorContext更新节点
    editorContext.updateNode(node.id, {
      ...node,
      metadata: {
        ...node.metadata,
        card2Data: testData
      }
    })

    updatedCount++
    console.log(`🧪 组件${index + 1}(${node.id})数据已更新:`, testData)
  })

  hasChanges.value = true
  message.success(`已更新${updatedCount}个数据源测试组件的数据`)
}

const randomizeTestData = () => {
  console.log('🎲 随机更新测试数据')

  const allNodes = editorContext.editorStore.nodes
  const dataSourceTestWidgets = allNodes.filter(node => node.type === 'datasource-test')

  if (dataSourceTestWidgets.length === 0) {
    message.warning('未找到数据源测试组件')
    return
  }

  // 为所有数据源测试组件生成随机数据
  dataSourceTestWidgets.forEach((node: any, index: number) => {
    // 为每个组件生成不同的随机数据
    const randomData = {
      key1: (25 + (Math.random() - 0.5) * 10 + index * 2).toFixed(1), // 温度变化
      key2: ['online', 'offline', 'maintenance', 'warning'][Math.floor(Math.random() * 4)],
      key3: Math.floor(1000 + Math.random() * 500) + index * 50
    }

    // 确保metadata对象存在
    if (!node.metadata) {
      node.metadata = {}
    }

    // 更新节点的card2Data
    node.metadata.card2Data = randomData

    // 使用editorContext更新节点
    editorContext.updateNode(node.id, {
      ...node,
      metadata: {
        ...node.metadata,
        card2Data: randomData
      }
    })

    console.log(`🎲 组件${index + 1}(${node.id})随机数据:`, randomData)
  })

  hasChanges.value = true
  message.success(`已为${dataSourceTestWidgets.length}个组件生成随机数据`)
}

const clearTestData = () => {
  console.log('🧹 清空测试数据')

  const allNodes = editorContext.editorStore.nodes
  const dataSourceTestWidgets = allNodes.filter(node => node.type === 'datasource-test')

  if (dataSourceTestWidgets.length === 0) {
    message.warning('未找到数据源测试组件')
    return
  }

  // 清空所有数据源测试组件的数据
  dataSourceTestWidgets.forEach((node: any, index: number) => {
    const clearData = { key1: null, key2: null, key3: null }

    // 确保metadata对象存在
    if (!node.metadata) {
      node.metadata = {}
    }

    // 更新节点的card2Data
    node.metadata.card2Data = clearData

    // 使用editorContext更新节点
    editorContext.updateNode(node.id, {
      ...node,
      metadata: {
        ...node.metadata,
        card2Data: clearData
      }
    })

    console.log(`🧹 组件${index + 1}(${node.id})数据已清空`)
  })

  hasChanges.value = true
  message.info(`已清空${dataSourceTestWidgets.length}个组件的测试数据`)
}

// 组件卸载时的清理工作
onUnmounted(() => {
  isUnmounted.value = true
  // 清理定时器
  if (selectedWidgetTimer) {
    clearTimeout(selectedWidgetTimer)
  }
})
</script>

<template>
  <div class="w-full px-5 py-5">
    <!-- 页面标题栏 -->
    <div
      v-show="!appStore.fullContent"
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
        <!-- 工具栏 -->
        <div class="toolbar-container flex-shrink-0">
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

        <!-- 临时测试按钮 -->
        <div class="test-toolbar flex justify-center py-2 bg-yellow-50 border-b">
          <n-space>
            <n-button size="small" type="info" @click="testUpdateData">测试更新数据</n-button>
            <n-button size="small" type="warning" @click="randomizeTestData">随机数据</n-button>
            <n-button size="small" type="success" @click="clearTestData">清空数据</n-button>
          </n-space>
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
                @toggle-widget-titles="handleToggleWidgetTitles"
                @grid-config-change="handleGridConfigChange"
              />
            </NDrawerContent>
          </NDrawer>
        </div>
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
