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

const props = defineProps<{ panelId: string }>()

const emit = defineEmits<{
  'state-manager-ready': [stateManager: any]
}>()

// 状态管理
const panelData = ref<Panel.Board>()
const fullui = ref()
const isEditing = ref(false) // 默认预览模式
const isSaving = ref(false)
const dataFetched = ref(false)

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

// 多数据源数据存储 - 以组件ID为键
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})

// 多数据源配置存储 - 以组件ID为键，存储完整配置信息
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 轮询管理器实例
const pollingManager = useGlobalPollingManager()

// 全局轮询开关状态
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// 手动切换全局轮询开关
const handleToggleGlobalPolling = () => {
  if (!globalPollingEnabled.value) {
    // 启用前先初始化轮询任务
    console.log(`🔄 [PanelEditor] 启用全局轮询前先初始化任务`)
    initializePollingTasksAndEnable()
  } else {
    // 直接关闭
    console.log(`🔄 [PanelEditor] 手动关闭全局轮询`)
    pollingManager.disableGlobalPolling()
  }
}

// 全屏功能
const { isFullscreen, toggle } = useFullscreen(fullui)

// 创建编辑器上下文
const editorContext = createEditor()
const { stateManager, addWidget, selectNode, updateNode } = editorContext
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
      }
    }, 100)
  },
  { deep: true }
)

// 状态管理辅助方法
const setState = (config: any) => {
  console.log('🔄 setState - 开始恢复状态:', {
    hasNodes: !!config.nodes,
    nodesCount: config.nodes?.length || 0,
    hasComponentConfigurations: !!config.componentConfigurations,
    configsCount: config.componentConfigurations ? Object.keys(config.componentConfigurations).length : 0
  })

  // 重置状态
  stateManager.reset()

  // 加载节点
  if (config.nodes && Array.isArray(config.nodes)) {
    console.log('🔄 setState - 加载节点数量:', config.nodes.length)
    config.nodes.forEach((node: any) => {
      stateManager.addNode(node as GraphData)
    })
    console.log('🔄 setState - 节点加载完成，当前节点数:', stateManager.nodes.length)
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

  // 🔥 关键修复：恢复所有组件的配置数据
  if (config.componentConfigurations) {
    try {
      console.log('🔄 setState - 恢复组件配置:', Object.keys(config.componentConfigurations))

      // 恢复每个组件的配置
      for (const [nodeId, nodeConfig] of Object.entries(config.componentConfigurations)) {
        if (nodeConfig && typeof nodeConfig === 'object') {
          try {
            // 🔥 关键修复：分离和恢复 multiDataSourceConfigStore 数据
            const typedConfig = nodeConfig as any

            // 检查是否有数据源配置需要恢复
            if (typedConfig.dataSource?.type === 'data-mapping' && typedConfig.dataSource?.config) {
              // 恢复到 multiDataSourceConfigStore
              multiDataSourceConfigStore.value[nodeId] = typedConfig.dataSource.config
              console.log(`🔄 setState - 恢复多数据源配置: ${nodeId}`, typedConfig.dataSource.config)
            }

            // 🔥 修复：保留完整配置，不删除 dataSource 字段
            configurationManager.setConfiguration(nodeId, typedConfig)

            console.log(`✅ setState - 恢复组件配置成功: ${nodeId}`)
          } catch (configError) {
            console.error(`❌ setState - 恢复组件配置失败: ${nodeId}`, configError)
            // 配置恢复失败不应阻止整个状态恢复过程
          }
        }
      }

      console.log('🎉 setState - 所有组件配置恢复完成')
    } catch (error) {
      console.error('💥 setState - 配置恢复过程失败:', error)
    }
  } else {
    console.log('ℹ️ setState - 没有组件配置需要恢复')
  }
}

const getState = () => {
  // 收集所有组件的配置数据
  const componentConfigurations: Record<string, any> = {}
  try {
    // 遍历所有节点，收集它们的配置
    for (const node of stateManager.nodes) {
      const config = configurationManager.getConfiguration(node.id)
      if (config) {
        // 🔥 关键修复：集成 multiDataSourceConfigStore 的数据
        const nodeId = node.id
        const multiDataSourceConfig = multiDataSourceConfigStore.value[nodeId]

        if (multiDataSourceConfig) {
          // 将多数据源配置合并到 dataSource 字段中
          const enhancedConfig = {
            ...config,
            dataSource: {
              type: 'data-mapping',
              enabled: true,
              config: multiDataSourceConfig,
              metadata: {
                componentType: node.type,
                mappingType: 'json-path',
                updatedAt: Date.now()
              }
            }
          }
          componentConfigurations[nodeId] = enhancedConfig
        } else {
          componentConfigurations[nodeId] = config
        }
      }
    }
    console.log('💾 保存状态 - 节点数量:', stateManager.nodes.length)
    console.log('💾 保存状态 - 组件配置数量:', Object.keys(componentConfigurations).length)
    if (stateManager.nodes.length > 0) {
      console.log('💾 保存状态 - 第一个组件:', stateManager.nodes[0])
    }
  } catch (error) {
    console.error('💾 getState - 收集组件配置失败:', error)
  }

  const finalState = {
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
    draggedComponent: draggedComponent.value,
    // 🔥 关键修复：包含所有组件的配置数据
    componentConfigurations: componentConfigurations
  }

  console.log('💾 最终保存状态:', {
    nodesCount: finalState.nodes.length,
    configsCount: Object.keys(finalState.componentConfigurations).length,
    renderer: finalState.currentRenderer
  })

  return finalState
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
      console.log('📊 配置原始数据:', data.config)

      if (data.config) {
        console.log('📝 解析现有配置:', data.config)
        const config = parseConfig(data.config)
        editorConfig.value = config.visualEditor || getDefaultConfig()
        // 🔥 智能深拷贝：使用优化的smartDeepClone
        preEditorConfig.value = smartDeepClone(editorConfig.value)

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
        preEditorConfig.value = smartDeepClone(editorConfig.value)
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
      preEditorConfig.value = smartDeepClone(editorConfig.value)
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
    // 🔥 智能深拷贝：使用优化的smartDeepClone
    preEditorConfig.value = smartDeepClone(editorConfig.value)
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

// 已迁移到 /utils/deep-clone.ts

// 🔥 调试：分析structuredClone失败的具体原因
const analyzeCloneability = (obj: any, path = 'root'): string[] => {
  const issues: string[] = []

  if (obj === null || obj === undefined) return issues

  if (typeof obj === 'function') {
    issues.push(`${path}: function`)
    return issues
  }

  if (obj instanceof Error) {
    issues.push(`${path}: Error object`)
    return issues
  }

  if (typeof obj === 'object') {
    // 检查是否是Vue响应式对象
    if (obj.__v_isReactive || obj.__v_isReadonly || obj.__v_isRef) {
      issues.push(`${path}: Vue reactive object`)
      return issues
    }

    // 检查原型链
    if (obj.constructor !== Object && obj.constructor !== Array) {
      issues.push(`${path}: Custom class instance (${obj.constructor.name})`)
    }

    // 递归检查属性
    for (const [key, value] of Object.entries(obj)) {
      issues.push(...analyzeCloneability(value, `${path}.${key}`))
    }
  }

  return issues
}

// 默认配置
const getDefaultConfig = () => {
  const config = {
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
  }

  // 🔥 调试：分析配置对象的可克隆性
  const cloneabilityIssues = analyzeCloneability(config)
  if (cloneabilityIssues.length > 0) {
    console.warn('🔍 Default config cloneability issues:', cloneabilityIssues)
  }

  return config
}

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
          
          // 🔛 启动全局轮询（预览模式）
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
      
      // 🔛 启动全局轮询（预览模式）
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

/**
 * 初始化轮询任务并启用全局轮询
 * 扫描所有组件的轮询配置，创建轮询任务，然后启用全局轮询开关
 */
const initializePollingTasksAndEnable = () => {
  console.log('🚀 [PanelEditor] 启动预览模式轮询')
  
  try {
    // 🔥 修复重复定时器漏洞：先清除所有现有任务
    console.log('🧹 [PanelEditor] 清除所有现有轮询任务，避免重复定时器')
    pollingManager.clearAllTasks()
    
    // 获取所有组件的轮询配置
    const allComponents = stateManager.nodes
    console.log(`🔍 [PanelEditor] 扫描 ${allComponents.length} 个组件的轮询配置`)
    console.log(`🔍 [PanelEditor] 所有组件:`, allComponents.map(c => ({ id: c.id, type: c.type })))
    
    allComponents.forEach(component => {
      const componentId = component.id
      console.log(`🔍 [PanelEditor] 开始检查组件: ${componentId} (${component.type})`)
      
      // 从 ConfigurationManager 读取组件级别的轮询配置
      const config = configurationManager.getConfiguration(componentId)
      console.log(`🔍 [PanelEditor] 组件 ${componentId} 完整配置:`, config)
      
      // 检查配置结构
      console.log(`🔍 [PanelEditor] 组件 ${componentId} 配置结构检查:`, {
        hasConfig: !!config,
        hasComponent: !!config?.component,
        componentKeys: config?.component ? Object.keys(config.component) : [],
        fullConfig: config
      })
      
      const pollingConfig = config?.component?.polling
      console.log(`🔍 [PanelEditor] 组件 ${componentId} 轮询配置:`, pollingConfig)
      console.log(`🔍 [PanelEditor] 组件 ${componentId} 轮询判断:`, {
        hasPollingConfig: !!pollingConfig,
        isEnabled: pollingConfig?.enabled,
        willCreateTask: !!(pollingConfig && pollingConfig.enabled)
      })
      
      if (pollingConfig && pollingConfig.enabled) {
        console.log(`✅ [PanelEditor] 组件 ${componentId} 启用轮询:`, pollingConfig)
        
        const interval = pollingConfig.interval || 30000
          
        console.log(`▶️ [PanelEditor] 启动组件轮询: ${componentId}, 间隔: ${interval}ms`)
        
        // 创建轮询任务（但不自动启动）
        const taskId = pollingManager.addTask({
          componentId: componentId,
          componentName: `组件-${component.type}`,
          interval: interval,
          callback: async () => {
            console.log(`🔄 [PanelEditor] 轮询触发组件执行: ${componentId}`)
            console.log(`🔄 [PanelEditor] 执行时间: ${new Date().toLocaleTimeString()}`)
            try {
              console.log(`🔍 [PanelEditor] 开始调用执行器: ${componentId}`)
              console.log(`🔍 [PanelEditor] EditorDataSourceManager 状态:`, {
                isInitialized: editorDataSourceManager.isInitialized(),
                hasManager: !!editorDataSourceManager
              })
              
              // 🔥 直接调用组件执行器，这个应该是正确的方式
              console.log(`🔍 [PanelEditor] 尝试直接触发组件执行器`)
              
              // 🔥 直接使用 VisualEditorBridge 调用，这个是确定有效的方法
              console.log(`🔍 [PanelEditor] 使用 VisualEditorBridge 直接调用组件执行器`)
              
              try {
                // 导入 VisualEditorBridge 并调用
                const { visualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
                
                // 获取组件配置
                const config = configurationManager.getConfiguration(componentId)
                if (!config || !config.dataSource) {
                  console.warn(`⚠️ [PanelEditor] 组件数据源配置不存在: ${componentId}`)
                  return
                }
                
                console.log(`🔍 [PanelEditor] 找到组件配置，开始执行`)
                
                // 获取组件类型
                const component = stateManager.nodes.find(n => n.id === componentId)
                const componentType = component?.type || 'unknown'
                
                console.log(`🔍 [PanelEditor] 调用参数:`, {
                  componentId,
                  componentType,
                  hasDataSourceConfig: !!config.dataSource,
                  dataSourceConfig: config.dataSource
                })
                
                console.log(`🔍 [PanelEditor] 轮询调用前清除缓存: ${componentId}`)
                
                // 🔥 关键修复：轮询执行前先清除组件缓存，强制重新获取数据
                const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
                simpleDataBridge.clearComponentCache(componentId)
                
                const result = await visualEditorBridge.updateComponentExecutor(componentId, componentType, config.dataSource)
                console.log(`✅ [PanelEditor] VisualEditorBridge 调用成功，执行结果:`, result)
                console.log(`✅ [PanelEditor] 轮询执行完成: ${componentId}`)
                
              } catch (bridgeError) {
                console.error(`❌ [PanelEditor] VisualEditorBridge 调用失败: ${componentId}`, bridgeError)
                console.warn(`⚠️ [PanelEditor] 轮询执行失败: ${componentId}`)
              }
            } catch (error) {
              console.error(`❌ [PanelEditor] 轮询执行错误: ${componentId}`, error)
            }
          },
          autoStart: false // 统一不自动启动，由全局开关控制
        })
        
        console.log(`✅ [PanelEditor] 轮询任务已创建: ${componentId} -> ${taskId}`)
        
        // 启动这个任务
        pollingManager.startTask(taskId)
      }
    })
    
    // 最终轮询任务统计
    const finalStats = pollingManager.getStatistics()
    console.log(`📊 [PanelEditor] 轮询任务创建完成，统计信息:`, finalStats)
    
    // 🔛 启用全局轮询开关
    console.log('🔛 [PanelEditor] 启用全局轮询开关')
    pollingManager.enableGlobalPolling()
    
  } catch (error) {
    console.error('❌ [PanelEditor] 初始化轮询任务失败:', error)
  }
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
      throw new Error('Invalid config format')
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
  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...newGridConfig }
  hasChanges.value = true
}

const handleGridstackConfigChange = (newGridConfig: any) => {
  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...newGridConfig }
  hasChanges.value = true
}

const handleCanvasConfigChange = (newCanvasConfig: any) => {
  editorConfig.value.canvasConfig = { ...editorConfig.value.canvasConfig, ...newCanvasConfig }
  hasChanges.value = true
}

// 交互测试方法已迁移到上层组件 visual-editor-details/index.vue

/**
 * 处理多数据源数据更新
 */
const handleMultiDataSourceUpdate = (widgetId: string, dataSources: Record<string, any>) => {
  // 存储数据源数据
  multiDataSourceStore.value[widgetId] = dataSources

  // 标记有变化
  hasChanges.value = true
}

/**
 * 处理多数据源配置更新
 */
const handleMultiDataSourceConfigUpdate = (widgetId: string, config: any) => {
  // 🔍 详细调试存储前后的数据

  // 存储配置信息
  multiDataSourceConfigStore.value[widgetId] = config

  // 标记有变化
  hasChanges.value = true
}

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
    if (action === 'update') {
      const hasDataSourceBindings = config.dataSourceBindings && Object.keys(config.dataSourceBindings).length > 0
      const hasDataSources =
        config.type === 'data-source-bindings' && (config.dataSource1 || config.dataSource2 || config.dataSource3)

      if (!hasDataSourceBindings && !hasDataSources) {
        console.log(`ℹ️ [PanelEditor] 配置无有效数据源，跳过更新: ${componentId}`)
        return
      }

      console.log(`🔧 [PanelEditor] 配置有效，继续处理: ${componentId}`, {
        hasDataSourceBindings,
        hasDataSources,
        configType: config.type
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
const setupComponentLifecycleListeners = () => {
  // 监听组件节点变化
  watch(
    () => stateManager.nodes,
    async (newNodes, oldNodes) => {
      if (!newNodes || !oldNodes) return

      // 检测新增的组件
      const oldNodeIds = new Set(oldNodes.map(node => node.id))
      const newNodeIds = new Set(newNodes.map(node => node.id))

      // 处理新增组件
      for (const node of newNodes) {
        if (!oldNodeIds.has(node.id)) {
          await handleComponentAdded(node)
        }
      }

      // 处理删除的组件
      for (const oldNode of oldNodes) {
        if (!newNodeIds.has(oldNode.id)) {
          await handleComponentRemoved(oldNode.id)
        }
      }
    },
    { deep: true }
  )

  // 监听组件配置变化
  watch(
    () => multiDataSourceConfigStore.value,
    (newConfigs, oldConfigs) => {
      if (!newConfigs || !oldConfigs) return

      // 🔥 性能优化：只检测配置变化的组件，避免深度对比
      for (const [componentId, config] of Object.entries(newConfigs)) {
        const oldConfig = oldConfigs[componentId]

        // 简单检查：如果配置对象引用不同，说明可能有变化
        if (!oldConfig || oldConfig !== config) {
          try {
            // 只有在引用不同时才进行深度对比
            const configChanged = !oldConfig || JSON.stringify(config) !== JSON.stringify(oldConfig)
            if (configChanged) {
              handleComponentConfigChanged(componentId, config)
            }
          } catch (error) {
            console.error(`❌ [PanelEditor] 配置变化检测失败: ${componentId}`, error)
          }
        }
      }

      // 检测删除的配置
      for (const componentId of Object.keys(oldConfigs)) {
        if (!newConfigs[componentId]) {
          // 可以在这里处理配置删除的逻辑
        }
      }
    },
    { deep: true }
  )
}

/**
 * 处理组件添加事件
 */
const handleComponentAdded = async (node: GraphData) => {
  try {
    // 检查是否有数据源配置
    const config = multiDataSourceConfigStore.value[node.id]
    if (config && Object.keys(config).length > 0) {
      // 注册到编辑器数据源管理器
      editorDataSourceManager.registerComponentDataSource(
        node.id,
        node.type,
        config,
        { type: 'timer', interval: 30000 } // 默认30秒轮询
      )
    }
  } catch (error) {
    console.error(`❌ [PanelEditor] 处理组件添加失败: ${node.id}`, error)
  }
}

/**
 * 处理组件删除事件
 */
const handleComponentRemoved = async (componentId: string) => {
  try {
    // 从编辑器数据源管理器移除
    editorDataSourceManager.removeComponentDataSource(componentId)

    // 清理本地配置存储
    delete multiDataSourceConfigStore.value[componentId]
    delete multiDataSourceStore.value[componentId]
  } catch (error) {
    console.error(`❌ [PanelEditor] 处理组件删除失败: ${componentId}`, error)
  }
}

/**
 * 处理组件配置变更事件
 */
const handleComponentConfigChanged = async (componentId: string, config: any) => {
  // 🔥 错误边界：确保数据源管理器已初始化
  if (!editorDataSourceManager.isInitialized()) {
    console.warn(`⚠️ [PanelEditor] 数据源管理器未初始化，跳过配置变更: ${componentId}`)
    return
  }

  try {
    // 如果组件已在数据源管理器中注册，更新配置
    const existingConfig = editorDataSourceManager.getComponentConfig(componentId)
    if (existingConfig) {
      // 先移除旧配置
      editorDataSourceManager.removeComponentDataSource(componentId)

      // 重新注册新配置
      const node = stateManager.nodes.find(n => n.id === componentId)
      if (node) {
        editorDataSourceManager.registerComponentDataSource(
          componentId,
          node.type,
          config,
          existingConfig.trigger // 保持原有的触发器配置
        )
      } else {
        console.warn(`⚠️ [PanelEditor] 找不到组件节点: ${componentId}`)
      }
    } else if (config && Object.keys(config).length > 0) {
      // 新增数据源配置
      const node = stateManager.nodes.find(n => n.id === componentId)
      if (node) {
        editorDataSourceManager.registerComponentDataSource(
          componentId,
          node.type,
          config,
          { type: 'timer', interval: 30000 } // 默认30秒轮询
        )
      } else {
        console.warn(`⚠️ [PanelEditor] 找不到组件节点: ${componentId}`)
      }
    }
  } catch (error) {
    console.error(`❌ [PanelEditor] 处理组件配置变更失败: ${componentId}`, error)

    // 🔥 错误恢复：尝试清理可能的残留状态
    try {
      editorDataSourceManager.removeComponentDataSource(componentId)
    } catch (cleanupError) {
      console.error(`❌ [PanelEditor] 清理残留状态失败: ${componentId}`, cleanupError)
    }
  }
}

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
const initializePanelData = async () => {
  console.log('🔄 [PanelEditor] 开始初始化面板数据')

  // 加载面板数据
  await fetchBoard()

  // 面板数据加载完成后，检查多数据源配置状态
  await nextTick() // 确保DOM更新完成
  restoreMultiDataSourceConfigs() // 现在只做状态检查

  // 初始化编辑器数据源管理器
  try {
    await editorDataSourceManager.initialize()

    // 设置数据更新监听器
    setupDataSourceEventListeners()

    // 为现有组件注册数据源配置（如果有的话）
    if (stateManager?.nodes?.length > 0) {
      await syncDataSourceConfigs()
    }

    // 设置组件生命周期监听
    setupComponentLifecycleListeners()

    console.log('✅ [PanelEditor] 面板数据初始化完成')
  } catch (error) {
    console.error('❌ [PanelEditor] 编辑器数据源管理器初始化失败:', error)
  }
}

// 学习 PanelManage 的 onMounted 写法
onMounted(async () => {
  // 初始化时同步预览模式状态
  setPreviewMode(!isEditing.value)

  // 执行初始化
  await initializePanelData()

  // 发出状态管理器就绪事件，供上层组件使用
  emit('state-manager-ready', stateManager)
})

// 暴露方法给父组件使用
defineExpose({
  initializePollingTasksAndEnable
})

// 🔥 关键修复：监听页签刷新标志，确保页签刷新时重新加载配置
watch(
  () => appStore.reloadFlag,
  async (newFlag, oldFlag) => {
    // 当 reloadFlag 从 false 变为 true 时，说明页签刷新完成，需要重新初始化
    if (newFlag && !oldFlag && dataFetched.value) {
      console.log('🔄 [PanelEditor] 检测到页签刷新，重新初始化面板数据')
      try {
        // 重新初始化面板数据和配置
        await initializePanelData()
      } catch (error) {
        console.error('❌ [PanelEditor] 页签刷新后重新初始化失败:', error)
      }
    }
  },
  { immediate: false }
)

/**
 * V6: 恢复多数据源配置（已弃用）
 * 🔥 修复说明：配置恢复现在已集成到 setState 方法中
 * 这个函数保留用于调试和状态检查
 */
const restoreMultiDataSourceConfigs = () => {
  if (!stateManager?.nodes || stateManager.nodes.length === 0) {
    return
  }

  // 🔥 配置恢复现在在 setState 中完成，这里只做状态报告
  return

  const restored: Record<string, any> = {}
  let restoredCount = 0
  let skippedCount = 0

  // 遍历所有节点，从ConfigurationManager恢复配置
  stateManager.nodes.forEach(node => {
    const widgetId = node.id

    try {
      const configuration = configurationManager.getConfiguration(widgetId)

      // 检查是否有V6数据源配置
      if (
        (configuration?.dataSource?.type === 'data-mapping' ||
          configuration?.dataSource?.type === 'data-source-bindings') &&
        configuration.dataSource.config
      ) {
        restored[widgetId] = configuration.dataSource.config
        restoredCount++
      } else {
        skippedCount++
      }
    } catch (error) {
      console.warn(`⚠️ [PanelEditor] 恢复组件 ${widgetId} 配置失败:`, error)
      skippedCount++
    }
  })

  // 批量更新multiDataSourceConfigStore
  if (restoredCount > 0) {
    const oldStore = { ...multiDataSourceConfigStore.value }
    multiDataSourceConfigStore.value = { ...multiDataSourceConfigStore.value, ...restored }

    // 🔥 关键修复：同时恢复数据源数据和配置

    const restoredData: Record<string, any> = {}

    Object.entries(restored).forEach(([widgetId, config]) => {
      // 从配置中恢复数据源数据
      if (config.dataSourceBindings) {
        const widgetData: Record<string, any> = {}
        Object.entries(config.dataSourceBindings).forEach(([dataSourceKey, binding]: [string, any]) => {
          if (binding.rawData) {
            try {
              widgetData[dataSourceKey] = JSON.parse(binding.rawData)
            } catch (error) {
              console.warn(`⚠️ [PanelEditor] 解析组件 ${widgetId} 数据源 ${dataSourceKey} 失败:`, error)
            }
          }
        })

        if (Object.keys(widgetData).length > 0) {
          restoredData[widgetId] = widgetData
        }
      }

      // 触发配置更新事件，让组件立即接收到配置
      handleMultiDataSourceConfigUpdate(widgetId, config)
    })

    // 批量更新 multiDataSourceStore
    if (Object.keys(restoredData).length > 0) {
      multiDataSourceStore.value = { ...multiDataSourceStore.value, ...restoredData }
    }
  } else {
  }
}

// 存储事件监听器引用，用于清理
let dataUpdateListener: Function | null = null
let statusChangeListener: Function | null = null
let pollingStatusListener: Function | null = null

// 组件卸载时的清理工作
onUnmounted(() => {
  isUnmounted.value = true
  // 清理定时器
  if (selectedWidgetTimer) {
    clearTimeout(selectedWidgetTimer)
  }

  // 清理事件监听器
  try {
    if (dataUpdateListener) {
      editorDataSourceManager.off('data-updated', dataUpdateListener)
    }
    if (statusChangeListener) {
      editorDataSourceManager.off('component-status-changed', statusChangeListener)
    }
    if (pollingStatusListener) {
      editorDataSourceManager.off('polling-status-changed', pollingStatusListener)
    }
  } catch (error) {
    console.error('❌ [PanelEditor] 数据源事件监听器清理失败:', error)
  }

  // 清理编辑器数据源管理器
  try {
    editorDataSourceManager.destroy()
  } catch (error) {
    console.error('❌ [PanelEditor] 编辑器数据源管理器清理失败:', error)
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
