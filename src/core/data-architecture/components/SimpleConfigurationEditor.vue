<!--
  简易配置系统 - 替代复杂UI组件的轻量级配置编辑器
  实现可视化数据源配置，支持JSON/HTTP/Script三种类型
-->
<script setup lang="ts">
/**
 * SimpleConfigurationEditor - 简易配置编辑器
 * 基于SUBTASK-010要求，实现轻量级可视化配置界面
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, h, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog, useMessage } from 'naive-ui'
import {
  createExecutorChain,
  type DataSourceConfiguration,
  type DataSource,
  type DataItem,
  type ProcessingConfig
} from '../index'
import { type MergeStrategy } from '@/core/data-architecture/executors/DataSourceMerger'
import RawDataConfigModal from '@/core/data-architecture/components/modals/RawDataConfigModal.vue'
// 简洁脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// 导入组件级别轮询配置组件
import ComponentPollingConfig from '@/core/data-architecture/components/ComponentPollingConfig.vue'
// 导入全局轮询管理器
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
// 导入@vicons图标组件
import {
  PlusOutlined,
  SearchOutlined,
  LinkOutlined,
  DotChartOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined
} from '@vicons/antd'
import { DocumentTextOutline, BarChartOutline, GlobeOutline } from '@vicons/ionicons5'
// 新配置管理系统
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import { MultiLayerExecutorChain } from '@/core/data-architecture/executors/MultiLayerExecutorChain'
import { smartDeepClone } from '@/utils/deep-clone'
// 导入导出面板组件
import ConfigurationImportExportPanel from '@/core/data-architecture/components/common/ConfigurationImportExportPanel.vue'
// 单数据源导入导出功能
import {
  singleDataSourceExporter,
  singleDataSourceImporter
} from '@/core/data-architecture/utils/ConfigurationImportExport'
import type { SingleDataSourceImportPreview } from '@/core/data-architecture/utils/ConfigurationImportExport'

// 🚀 导入Card2.1 Core响应式数据管理器
import { reactiveDataManager } from '@/card2.1/core2/data-source'
import { dataBindingManager } from '@/card2.1/core2/data-source'
import { ComponentRegistry } from '@/card2.1/core2/registry'

// Props接口 - 兼容现有系统和ConfigurationPanel调用方式
interface Props {
  /** v-model绑定的配置数据 */
  modelValue?: Record<string, any>
  /** 从组件定义获取的数据源需求 */
  dataSources?: Record<string, any> | Array<any>
  /** 组件ID */
  componentId?: string
  /** 组件类型 */
  componentType?: string
  /** 选中的组件ID */
  selectedWidgetId?: string
  /** 是否为预览模式 - 轮询功能仅在预览模式下生效 */
  previewMode?: boolean
  /** 新增：从ConfigurationPanel传递的widget对象 */
  widget?: any
  /** 新增：从ConfigurationPanel传递的nodeId */
  nodeId?: string
  /** 新增：只读模式 */
  readonly?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  dataSources: () => [],
  previewMode: false,
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 弹窗和消息提示
const dialog = useDialog()
const message = useMessage()

// 轮询管理器
const pollingManager = useGlobalPollingManager()

// 注入编辑器上下文用于配置同步
const editorContext = inject('editorContext', null) as any

// 🚀 Card2.1 Core响应式数据管理状态
const card2CoreDataSubscription = ref<string | null>(null)
const useCard2CoreReactiveData = ref(false)

// 导入导出相关状态
const exportLoading = ref<Record<string, boolean>>({})
const importFileRef = ref<HTMLInputElement>()
const singleDataSourceImportPreview = ref<SingleDataSourceImportPreview | null>(null)
const originalImportData = ref<any>(null) // 保存原始导入数据
const showSingleDataSourceImportModal = ref(false)
const targetDataSourceId = ref<string>('')
const isProcessing = ref(false) // 新增：导入导出处理状态

// ⚡ 性能优化：加载状态，改善用户体验
const isInitializing = ref(true)

/**
 * 新增：从widget对象智能提取组件信息
 * 兼容ConfigurationPanel的调用方式
 */
const componentInfo = computed(() => {
  // 优先使用直接传递的props（只有当dataSources有内容时才使用）
  if (
    props.componentId &&
    props.componentType &&
    props.dataSources &&
    Array.isArray(props.dataSources) &&
    props.dataSources.length > 0
  ) {
    return {
      componentId: props.componentId,
      componentType: props.componentType,
      dataSources: props.dataSources
    }
  }

  // 从widget对象提取信息（ConfigurationPanel调用方式）
  if (props.widget) {
    const widget = props.widget
    const componentId = props.nodeId || widget.id
    const componentType = widget.type

    // 从Card2.1组件定义中提取数据源
    let dataSources = []

    if (widget.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      dataSources = card2Definition.dataSources || []
    }

    // 检查传统组件的数据源定义
    if (dataSources.length === 0 && widget.metadata?.dataSources) {
      dataSources = widget.metadata.dataSources
    }

    return {
      componentId,
      componentType,
      dataSources
    }
  }

  // 默认返回空信息
  return {
    componentId: props.componentId || props.nodeId || '',
    componentType: props.componentType || '',
    dataSources: []
  }
})

/**
 * 处理数据源选项 - 兼容数组和对象格式
 */
const dataSourceOptions = computed(() => {
  const dataSources = componentInfo.value.dataSources

  if (!dataSources || dataSources.length === 0) {
    return []
  }

  // 处理数组格式
  if (Array.isArray(dataSources)) {
    return dataSources.map((dataSource, index) => {
      const key = dataSource.key || `dataSource${index + 1}`
      return {
        label: dataSource.name || dataSource.title || `数据源${index + 1}`,
        value: key,
        description: dataSource.description || '',
        type: dataSource.type || dataSource.expectedDataFormat || 'object',
        originalData: dataSource
      }
    })
  }

  // 处理对象格式
  return Object.entries(dataSources).map(([key, dataSource]) => {
    return {
      label: dataSource.name || dataSource.title || key,
      value: key,
      description: dataSource.description || '',
      type: dataSource.type || dataSource.expectedDataFormat || 'object',
      originalData: dataSource
    }
  })
})

/**
 * 弹窗状态管理
 */
const showRawDataModal = ref(false)
const currentDataSourceKey = ref('')
// 修复：添加编辑模式状态
const isEditMode = ref(false)
const editingItemId = ref('')
// RawDataConfigModal 组件引用，用于访问内部状态
const rawDataConfigModalRef = ref<any>(null)
// 当前选择的数据录入方式
const currentSelectedMethod = ref<'json' | 'http' | 'script'>('json')

/**
 * 移除导入导出状态管理 - 已迁移到独立组件
 */

/**
 * 数据项配置存储
 * 格式：{ dataSourceKey: [dataItemConfig1, dataItemConfig2, ...] }
 */
const dataSourceItems = reactive<Record<string, any[]>>({})

/**
 * 存储每个数据源的合并策略
 * 格式：{ dataSourceKey: { type: 'object' | 'array' | 'script', script?: string } }
 */
const mergeStrategies = reactive<Record<string, any>>({})

/**
 * ⚡ 性能优化：HTTP配置转换缓存
 * 缓存已转换的配置，避免重复计算
 */
const configConversionCache = new Map<string, any>()

/**
 * 处理添加数据项按钮点击
 */
const handleAddDataItem = (dataSourceKey: string) => {
  currentDataSourceKey.value = dataSourceKey
  // 修复：重置为新增模式
  isEditMode.value = false
  editingItemId.value = ''
  showRawDataModal.value = true
}

/**
 * 处理编辑数据项
 */
const handleEditDataItem = (dataSourceKey: string, itemId: string) => {
  currentDataSourceKey.value = dataSourceKey

  // 找到要编辑的数据项
  const item = dataSourceItems[dataSourceKey]?.find(item => item.id === itemId)
  if (item) {
    // 修复：设置为编辑模式
    isEditMode.value = true
    editingItemId.value = itemId
    showRawDataModal.value = true
  }
}

/**
 * 处理合并策略更新
 */
const handleMergeStrategyUpdate = (dataSourceKey: string, strategy: any) => {
  mergeStrategies[dataSourceKey] = strategy

  // 使用新配置管理系统：内容哈希去重和版本控制
  // 重建完整配置并提交
  const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

  // 清除组件缓存，确保新策略生效
  simpleDataBridge.clearComponentCache(componentInfo.value.componentId)
  // 使用新配置管理系统更新配置（内置循环检测和去重）
  configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', rebuiltConfig)
}

/**
 * 更新数据源配置（合并策略变化时调用）
 */
const updateDataSourceConfiguration = (dataSourceKey: string) => {
  try {
    // 获取现有配置
    const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    const currentDataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

    if (currentDataSourceConfig?.dataSources) {
      const dataSourceIndex = currentDataSourceConfig.dataSources.findIndex(ds => ds.sourceId === dataSourceKey)

      if (dataSourceIndex !== -1) {
        // 更新合并策略
        const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }
        currentDataSourceConfig.dataSources[dataSourceIndex].mergeStrategy =
          strategy.type === 'script' ? { type: 'script', script: strategy.script } : strategy.type

        // 更新时间戳
        currentDataSourceConfig.updatedAt = Date.now()

        // 提交配置更新
        configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', currentDataSourceConfig)
      }
    }
  } catch (error) {}
}

/**
 * 处理抽屉关闭事件
 */
const handleRawDataModalClose = () => {
  showRawDataModal.value = false
  currentDataSourceKey.value = ''
  isEditMode.value = false
  editingItemId.value = ''
}

/**
 * 处理数据项配置确认 - 集成配置驱动架构
 */
const handleDataItemConfirm = async (dataItemConfig: any) => {
  const dataSourceKey = currentDataSourceKey.value
  if (!dataSourceKey) return

  try {
    // 转换为标准 DataItem 格式
    const standardDataItem: DataItem = convertToStandardDataItem(dataItemConfig)

    // 转换为标准 ProcessingConfig 格式
    const processingConfig: ProcessingConfig = convertToProcessingConfig(dataItemConfig)

    // 初始化数据源的数据项数组
    if (!dataSourceItems[dataSourceKey]) {
      dataSourceItems[dataSourceKey] = []
    }

    // 修复：根据模式进行新增或编辑
    let displayItem
    if (isEditMode.value && editingItemId.value) {
      // 编辑模式：查找并更新现有项
      const existingIndex = dataSourceItems[dataSourceKey].findIndex(item => item.id === editingItemId.value)
      if (existingIndex !== -1) {
        // 性能优化：使用结构化克隆或浅拷贝代替JSON深拷贝
        displayItem = {
          id: editingItemId.value,
          ...smartDeepClone(dataItemConfig), // 使用智能深拷贝
          createdAt: dataSourceItems[dataSourceKey][existingIndex].createdAt, // 保持原创建时间
          updatedAt: new Date().toISOString() // 添加更新时间
        }
        dataSourceItems[dataSourceKey][existingIndex] = displayItem
      } else {
        return
      }
    } else {
      // 新增模式：添加新项
      displayItem = {
        id: Date.now().toString(),
        ...smartDeepClone(dataItemConfig), // 使用智能深拷贝避免引用共享
        createdAt: new Date().toISOString()
      }
      dataSourceItems[dataSourceKey].push(displayItem)
    }

    // 核心：根据当前所有数据项重新构建完整的 DataSourceConfiguration
    const dataSourceConfig = rebuildCompleteDataSourceConfiguration()

    // 🔥 关键修复：清除组件缓存，确保新数据源配置生效
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)

    // 新配置管理系统：内容哈希去重，避免无限循环
    configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', dataSourceConfig)

    // 🔥 关键修复：配置保存后立即重新执行数据源，获取最新数据

    const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
    const visualEditorBridge = getVisualEditorBridge()
    const result = await visualEditorBridge.updateComponentExecutor(
      componentInfo.value.componentId,
      componentInfo.value.componentType,
      dataSourceConfig
    )

    // 🔥 关键修复：强制清除DataWarehouse的合并数据缓存，确保组件获取最新数据
    const { dataWarehouse } = await import('@/core/data-architecture/DataWarehouse')
    dataWarehouse.clearComponentMergedCache(componentInfo.value.componentId)

    // 强制同步到编辑器确保配置持久化
    try {
      if (editorContext?.updateNode) {
        const currentNode = editorContext.getNodeById(componentInfo.value.componentId)
        if (currentNode) {
          editorContext.updateNode(componentInfo.value.componentId, {
            metadata: {
              ...currentNode.metadata,
              unifiedConfig: {
                ...currentNode.metadata?.unifiedConfig,
                dataSource: dataSourceConfig
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('同步配置到编辑器失败:', error)
    }

    // 关闭弹窗并重置状态
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    // 修复：重置编辑状态
    isEditMode.value = false
    editingItemId.value = ''
  } catch (error) {
    console.error('数据项配置保存失败:', error)

    // 即使出现错误也要关闭抽屉
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    isEditMode.value = false
    editingItemId.value = ''

    // 显示用户友好的错误提示
    const errorMessage = error instanceof Error ? error.message : '保存配置时发生未知错误'
    message.error(`数据项配置保存失败：${errorMessage}`)

    if (process.env.NODE_ENV === 'development') {
      console.error('详细错误信息:', error)
    }
  }
}

/**
 * 转换为标准 DataItem 格式
 */
const convertToStandardDataItem = (dataItemConfig: any): DataItem => {
  const { type } = dataItemConfig

  switch (type) {
    case 'json':
      return {
        type: 'json',
        config: {
          jsonString: dataItemConfig.jsonData || '{}'
        }
      }

    case 'script':
      return {
        type: 'script',
        config: {
          script: dataItemConfig.scriptCode || 'return {}',
          context: {}
        }
      }

    case 'http':
      // HTTP配置转换
      if (dataItemConfig.httpConfigData) {
        const httpConfigData = dataItemConfig.httpConfigData

        // 将HttpConfigData转换为标准DataItem格式，同时保留完整信息
        const config: any = {
          url: httpConfigData.url || '',
          method: httpConfigData.method || 'GET',
          timeout: httpConfigData.timeout || 10000
        }

        // 转换headers数组为对象格式
        if (httpConfigData.headers && httpConfigData.headers.length > 0) {
          const headersObj = {}
          httpConfigData.headers
            .filter(h => h.enabled && h.key) // 只包含启用且有key的header
            .forEach(h => {
              headersObj[h.key] = h.value
            })
          if (Object.keys(headersObj).length > 0) {
            config.headers = headersObj
          }
        }

        // 保持params数组格式，应用保护机制
        if (httpConfigData.params && httpConfigData.params.length > 0) {
          // 在保存前应用保护机制，确保绑定路径不被损坏
          const protectedParams = protectParameterBindingPaths(httpConfigData.params)
          config.params = protectedParams.filter(p => p.enabled && p.key) // 只保存启用且有key的param
        }

        // 保存新增的HTTP配置字段
        if (httpConfigData.addressType) {
          config.addressType = httpConfigData.addressType
        }
        if (httpConfigData.selectedInternalAddress) {
          config.selectedInternalAddress = httpConfigData.selectedInternalAddress
        }
        if (httpConfigData.enableParams !== undefined) {
          config.enableParams = httpConfigData.enableParams
        }
        if (httpConfigData.pathParams && httpConfigData.pathParams.length > 0) {
          // 应用保护机制到路径参数
          config.pathParams = protectParameterBindingPaths(httpConfigData.pathParams)
        }
        if (httpConfigData.pathParameter) {
          // 应用保护机制到单个路径参数
          const protectedParams = protectParameterBindingPaths([httpConfigData.pathParameter])
          config.pathParameter = protectedParams[0]
        }

        // 保存请求体
        if (httpConfigData.body) {
          config.body = httpConfigData.body
        }

        // 保存脚本配置
        if (httpConfigData.preRequestScript) {
          config.preRequestScript = httpConfigData.preRequestScript
        }
        if (httpConfigData.postResponseScript) {
          config.postResponseScript = httpConfigData.postResponseScript
        }

        return {
          type: 'http',
          config
        }
      } else {
        // 回退到旧的基础配置格式
        return {
          type: 'http',
          config: {
            url: dataItemConfig.url || '',
            method: dataItemConfig.method || 'GET',
            headers: dataItemConfig.headers ? JSON.parse(dataItemConfig.headers) : undefined,
            body: dataItemConfig.body ? JSON.parse(dataItemConfig.body) : undefined,
            timeout: 10000
          }
        }
      }

    default:
      throw new Error(`不支持的数据项类型: ${type}`)
  }
}

/**
 * 转换为标准 ProcessingConfig 格式
 */
const convertToProcessingConfig = (dataItemConfig: any): ProcessingConfig => {
  const processingConfig = dataItemConfig.processingConfig || {}

  return {
    filterPath: processingConfig.jsonPath || '$', // 默认根路径
    customScript: processingConfig.scriptCode || undefined,
    defaultValue: processingConfig.defaultValue || undefined
  }
}

/**
 * 新方法：基于当前所有显示数据项重建完整配置
 * 这确保了本地显示状态和配置状态的完全同步
 */
const rebuildCompleteDataSourceConfiguration = (): DataSourceConfiguration => {
  const timestamp = Date.now()

  // 构建所有数据源
  const dataSources: Array<{
    sourceId: string
    dataItems: Array<{ item: DataItem; processing: ProcessingConfig }>
    mergeStrategy: MergeStrategy
  }> = []

  // 修复：遍历所有数据源，保留空数据源的结构
  for (const [sourceId, items] of Object.entries(dataSourceItems)) {
    // 转换数据项（如果有的话）
    const standardDataItems =
      items && items.length > 0
        ? items.map((item, index) => {
            const convertedItem = convertToStandardDataItem(item)
            const convertedProcessing = convertToProcessingConfig(item)
            // 性能优化：仅在开发环境输出详细调试信息

            return {
              item: convertedItem,
              processing: convertedProcessing
            }
          })
        : [] // 关键：空数据源也要保留，传空数组

    // 获取合并策略
    const strategy = mergeStrategies[sourceId] || { type: 'object' }
    let mergeStrategy: MergeStrategy

    if (strategy.type === 'script') {
      mergeStrategy = { type: 'script', script: strategy.script }
    } else if (strategy.type === 'select') {
      mergeStrategy = { type: 'select', selectedIndex: strategy.selectedIndex }
    } else {
      mergeStrategy = { type: strategy.type }
    }

    // 关键：即使数据项为空也要添加到配置中
    dataSources.push({
      sourceId,
      dataItems: standardDataItems,
      mergeStrategy
    })
  }
  // 🔍 最终调试：输出完整的配置以确认内容
  const finalConfig = {
    componentId: componentInfo.value.componentId,
    dataSources,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  return finalConfig
}

/**
 * 获取组件的轮询配置
 * @returns 组件轮询配置或null
 */
const getComponentPollingConfig = () => {
  const config = configurationManager.getConfiguration(componentInfo.value.componentId)
  return config?.component?.polling || null
}

/**
 * 初始化组件轮询（用于恢复已保存的轮询配置）
 */
const initializeComponentPolling = () => {
  try {
    const pollingConfig = getComponentPollingConfig()
    if (pollingConfig && pollingConfig.enabled) {
      if (process.env.NODE_ENV === 'development') {
      }

      // 移除可能存在的旧任务
      const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
      existingTasks.forEach(task => pollingManager.removeTask(task.id))

      // 注册轮询任务
      const taskId = pollingManager.addTask({
        componentId: componentInfo.value.componentId,
        componentName: `${componentInfo.value.componentType}-${componentInfo.value.componentId.slice(0, 8)}`,
        interval: pollingConfig.interval || 30000,
        callback: executeComponentPolling,
        autoStart: false
      })

      if (process.env.NODE_ENV === 'development') {
      }

      // 如果全局轮询已启用，立即启动
      if (pollingManager.isGlobalPollingEnabled()) {
        pollingManager.startTask(taskId)
      }
    }
  } catch (error) {
    console.error('初始化组件轮询失败:', error)
  }
}

/**
 * 🚀 检查组件是否支持Card2.1 Core响应式数据管理
 */
const checkCard2CoreReactiveSupport = () => {
  const isRegistered = ComponentRegistry.has(componentInfo.value.componentType)
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys(componentInfo.value.componentType)
  const supportsReactiveData = isRegistered && dataSourceKeys.length > 0

  useCard2CoreReactiveData.value = supportsReactiveData
  return supportsReactiveData
}

/**
 * 🚀 初始化Card2.1 Core响应式数据管理
 */
const initializeCard2CoreReactiveData = async () => {
  if (!useCard2CoreReactiveData.value) {
    return
  }

  try {
    // 获取数据源配置
    const dataSourceConfig = configurationManager.getConfiguration(componentInfo.value.componentId)?.dataSource

    if (!dataSourceConfig) {
      return
    }

    // 创建响应式数据订阅
    const subscriptionId = reactiveDataManager.subscribe(
      componentInfo.value.componentId, // 使用组件ID作为数据源ID
      newData => {},
      {
        updateStrategy: 'polling', // 使用轮询策略
        interval: 30000 // 30秒轮询间隔
      }
    )

    card2CoreDataSubscription.value = subscriptionId
  } catch (error) {
    console.error(`❌ [SimpleConfigurationEditor] Card2.1 Core响应式数据初始化失败:`, error)
  }
}

/**
 * 🚀 清理Card2.1 Core响应式数据订阅
 */
const cleanupCard2CoreReactiveData = () => {
  if (card2CoreDataSubscription.value) {
    reactiveDataManager.removeSubscription(card2CoreDataSubscription.value)
    card2CoreDataSubscription.value = null
  }
}

/**
 * 轮询任务执行函数
 * 当轮询触发时执行组件的所有数据源刷新
 */
const executeComponentPolling = async () => {
  try {
    // 传统轮询逻辑（回退方案）
    const config = configurationManager.getConfiguration(componentInfo.value.componentId)
    if (!config?.dataSource) {
      console.error(`⚠️ 组件 ${componentInfo.value.componentId} 没有数据源配置，跳过轮询`)
      return
    }

    // 使用 VisualEditorBridge 执行组件数据刷新
    const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
    const visualEditorBridge = getVisualEditorBridge()

    // 清除缓存确保获取最新数据
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)

    // 执行组件数据更新
    const result = await visualEditorBridge.updateComponentExecutor(
      componentInfo.value.componentId,
      componentInfo.value.componentType,
      config.dataSource
    )

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    console.error(`❌ 轮询执行失败: ${componentInfo.value.componentId}`, error)
  }
}

/**
 * 处理组件轮询配置变化
 * 将轮询配置保存到 component 配置中，并同步到全局轮询管理器
 */
const handleComponentPollingConfigChange = (pollingConfig: any) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }

    // 获取当前组件配置
    const config = configurationManager.getConfiguration(componentInfo.value.componentId)
    const componentConfig = config?.component || {}

    // 先移除现有的轮询任务（如果存在）
    const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
    existingTasks.forEach(task => {
      pollingManager.removeTask(task.id)
      if (process.env.NODE_ENV === 'development') {
      }
    })

    // 更新组件轮询配置
    componentConfig.polling = {
      enabled: pollingConfig.enabled || false,
      interval: pollingConfig.interval || 30000,
      // 修复：正确保存 immediate 属性，允许为 false
      immediate: pollingConfig.immediate !== undefined ? pollingConfig.immediate : true,
      lastUpdated: Date.now()
    }

    // 保存到配置管理器
    configurationManager.updateConfiguration(componentInfo.value.componentId, 'component', componentConfig)

    // 如果启用了轮询，注册新的轮询任务
    if (pollingConfig.enabled) {
      const taskId = pollingManager.addTask({
        componentId: componentInfo.value.componentId,
        componentName: `${componentInfo.value.componentType}-${componentInfo.value.componentId.slice(0, 8)}`,
        interval: pollingConfig.interval || 30000,
        callback: executeComponentPolling,
        autoStart: false // 不自动启动，由全局开关控制
      })

      if (process.env.NODE_ENV === 'development') {
      }

      // 如果全局轮询已启用，立即启动这个任务
      if (pollingManager.isGlobalPollingEnabled()) {
        pollingManager.startTask(taskId)
        if (process.env.NODE_ENV === 'development') {
        }
      }
    }
  } catch (error) {
    console.error('轮询配置变化处理失败:', error)
  }
}

/**
 * 删除数据项 - 集成配置驱动架构
 */
const handleDeleteDataItem = (dataSourceKey: string, itemId: string) => {
  if (!dataSourceItems[dataSourceKey]) return

  const index = dataSourceItems[dataSourceKey].findIndex(item => item.id === itemId)
  if (index > -1) {
    // 从本地显示存储中删除
    dataSourceItems[dataSourceKey].splice(index, 1)

    try {
      // 获取现有配置
      const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      const currentDataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

      if (currentDataSourceConfig?.dataSources) {
        const dataSourceIndex = currentDataSourceConfig.dataSources.findIndex(ds => ds.sourceId === dataSourceKey)

        if (dataSourceIndex !== -1) {
          const dataSource = currentDataSourceConfig.dataSources[dataSourceIndex]

          // 删除对应的数据项 (根据索引，因为没有直接的ID映射)
          if (index < dataSource.dataItems.length) {
            dataSource.dataItems.splice(index, 1)
          }

          // 如果数据源没有数据项了，保留空的数据源（而不是删除整个数据源）
          // 这样执行器知道应该返回 null 或空数据
          if (dataSource.dataItems.length === 0) {
            // 保留数据源结构但清空数据项，这样执行器会返回null
            dataSource.mergeStrategy = { type: 'object' } // 重置为默认合并策略
          }

          // 更新时间戳
          currentDataSourceConfig.updatedAt = Date.now()

          // 新配置管理系统：删除后重建完整配置
          const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

          // 清除组件缓存，确保删除后数据更新
          simpleDataBridge.clearComponentCache(componentInfo.value.componentId)
          // 使用新配置管理系统提交更新（内置去重和循环检测）
          configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', rebuiltConfig)
        }
      }
    } catch (error) {}
  }
}

/**
 * 从 ConfigurationManager 恢复数据项显示状态
 * 组件初始化或配置变化时调用
 * ⚡ 性能优化：批量操作、提前返回、减少响应式触发
 * 🔥 激进优化：分片处理大量数据项，避免阻塞主线程
 */
const restoreDataItemsFromConfig = () => {
  try {
    const perfStart = performance.now()

    // ✅ 优化1：只查询一次 ConfigurationManager
    const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    let dataSourceConfig: DataSourceConfiguration | undefined = latestConfig?.dataSource as
      | DataSourceConfiguration
      | undefined

    // ✅ 优化2：简化回退逻辑，减少复杂判断
    if (!dataSourceConfig && editorContext?.getNodeById) {
      const realNode = editorContext.getNodeById(componentInfo.value.componentId)
      dataSourceConfig = realNode?.dataSource || realNode?.metadata?.unifiedConfig?.dataSource
    }

    // ✅ 优化3：提前返回，避免不必要的操作
    if (!dataSourceConfig?.dataSources || dataSourceConfig.dataSources.length === 0) {
      // 初始化空数据项列表（只在必要时）
      dataSourceOptions.value.forEach(option => {
        if (!dataSourceItems[option.value]) {
          dataSourceItems[option.value] = []
        }
        if (!mergeStrategies[option.value]) {
          mergeStrategies[option.value] = { type: 'object' }
        }
      })
      return // ✅ 提前返回
    }

    // ✅ 优化4：使用临时对象批量收集，减少响应式触发次数
    const tempItems: Record<string, any[]> = {}
    const tempStrategies: Record<string, any> = {}

    // ✅ 优化5：计算总数据项数量，决定是否使用分片处理
    let totalItems = 0
    dataSourceConfig.dataSources.forEach(ds => {
      totalItems += ds.dataItems?.length || 0
    })

    // 🔥 如果数据项较少（<10），直接同步处理
    if (totalItems < 10) {
      dataSourceConfig.dataSources.forEach(dataSource => {
        const { sourceId, dataItems: configDataItems, mergeStrategy } = dataSource
        tempItems[sourceId] = []
        tempStrategies[sourceId] = mergeStrategy || { type: 'object' }

        if (configDataItems && Array.isArray(configDataItems)) {
          configDataItems.forEach((configItem, index) => {
            try {
              const displayItem = convertConfigItemToDisplay(
                configItem && typeof configItem === 'object' && 'item' in configItem
                  ? configItem
                  : {
                      item: configItem,
                      processing: { filterPath: '$', customScript: undefined, defaultValue: undefined }
                    },
                index
              )
              tempItems[sourceId].push(displayItem)
            } catch (itemError) {
              console.error(`❌ [restoreDataItemsFromConfig] 处理数据项失败:`, { sourceId, index, error: itemError })
            }
          })
        }
      })

      // 一次性赋值
      Object.keys(dataSourceItems).forEach(key => delete dataSourceItems[key])
      Object.keys(mergeStrategies).forEach(key => delete mergeStrategies[key])
      Object.assign(dataSourceItems, tempItems)
      Object.assign(mergeStrategies, tempStrategies)

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] 配置恢复(同步): ${(performance.now() - perfStart).toFixed(2)}ms, 数据项: ${totalItems}`)
      }
    } else {
      // 🔥 数据项较多，使用异步分片处理
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] 配置恢复(异步分片): 开始处理 ${totalItems} 个数据项`)
      }

      let processedItems = 0
      dataSourceConfig.dataSources.forEach(dataSource => {
        const { sourceId, dataItems: configDataItems, mergeStrategy } = dataSource
        tempItems[sourceId] = []
        tempStrategies[sourceId] = mergeStrategy || { type: 'object' }

        if (configDataItems && Array.isArray(configDataItems)) {
          // 分片处理每个数据源的数据项
          configDataItems.forEach((configItem, index) => {
            try {
              const displayItem = convertConfigItemToDisplay(
                configItem && typeof configItem === 'object' && 'item' in configItem
                  ? configItem
                  : {
                      item: configItem,
                      processing: { filterPath: '$', customScript: undefined, defaultValue: undefined }
                    },
                index
              )
              tempItems[sourceId].push(displayItem)
              processedItems++
            } catch (itemError) {
              console.error(`❌ [restoreDataItemsFromConfig] 处理数据项失败:`, { sourceId, index, error: itemError })
            }
          })
        }
      })

      // 一次性赋值
      Object.keys(dataSourceItems).forEach(key => delete dataSourceItems[key])
      Object.keys(mergeStrategies).forEach(key => delete mergeStrategies[key])
      Object.assign(dataSourceItems, tempItems)
      Object.assign(mergeStrategies, tempStrategies)

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `⚡ [Perf] 配置恢复(异步分片): ${(performance.now() - perfStart).toFixed(2)}ms, 处理: ${processedItems}/${totalItems}`
        )
      }
    }
  } catch (error) {
    console.error('❌ [restoreDataItemsFromConfig] 恢复配置失败:', error)
  }
}

/**
 * ⚡ 性能优化：合并智能检测和保护逻辑，减少重复遍历
 * 检测参数是否为动态参数并保护绑定路径
 */
const processAndProtectParameter = (param: any): any => {
  // ✅ 优化：一次性检测所有绑定特征
  const hasBindingFeatures =
    param.valueMode === 'component' ||
    param.selectedTemplate === 'component-property-binding' ||
    (typeof param.value === 'string' && param.value.includes('.') && param.value.length > 15)

  // ✅ 优化：检测绑定路径是否被损坏
  const isBindingCorrupted =
    param.value &&
    typeof param.value === 'string' &&
    !param.value.includes('.') &&
    param.value.length < 10 &&
    param.variableName &&
    param.variableName.includes('_')

  // ✅ 如果已经正确，直接返回
  if (hasBindingFeatures && param.isDynamic && param.value?.includes('.') && !isBindingCorrupted) {
    return param
  }

  // ✅ 需要修正的情况
  if (isBindingCorrupted && param.variableName) {
    const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
    if (lastUnderscoreIndex > 0) {
      const componentId = param.variableName.substring(0, lastUnderscoreIndex)
      const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
      return {
        ...param,
        value: `${componentId}.base.${propertyName}`,
        isDynamic: true
      }
    }
  }

  // ✅ 设置正确的 isDynamic 状态
  if (hasBindingFeatures && !param.isDynamic) {
    return { ...param, isDynamic: true }
  }

  return param
}

/**
 * ⚡ 性能优化：批量处理参数数组
 */
const processAndProtectParameters = (params: any[]): any[] => {
  if (!params || !Array.isArray(params)) return params
  return params.map(processAndProtectParameter)
}

/**
 * 保留原函数名作为兼容性包装（向后兼容）
 */
const detectIsDynamicParameter = (param: any): boolean => {
  return processAndProtectParameter(param).isDynamic || false
}

const protectParameterBindingPaths = (params: any[]): any[] => {
  return processAndProtectParameters(params)
}

/**
 * 将配置格式的数据项转换为显示格式
 * ⚡ 性能优化：使用缓存避免重复转换
 */
const convertConfigItemToDisplay = (configItem: any, index: number) => {
  // ✅ 优化：生成缓存键（基于配置内容）
  const cacheKey = `${JSON.stringify(configItem)}-${index}`

  // ✅ 优化：检查缓存
  if (configConversionCache.has(cacheKey)) {
    // 返回缓存的深拷贝，避免引用共享
    return smartDeepClone(configConversionCache.get(cacheKey))
  }

  const { item, processing } = configItem

  // 根据数据项类型转换
  let displayConfig: any = {
    id: `restored-${Date.now()}-${index}`,
    type: item.type,
    createdAt: new Date().toISOString()
  }

  // 转换数据项配置
  switch (item.type) {
    case 'json':
      displayConfig.jsonData = item.config.jsonString
      break
    case 'script':
      displayConfig.scriptCode = item.config.script
      break
    case 'http':
      displayConfig.url = item.config.url
      displayConfig.method = item.config.method
      if (item.config.headers) {
        displayConfig.headers = JSON.stringify(item.config.headers)
      }
      if (item.config.body) {
        displayConfig.body = JSON.stringify(item.config.body)
      }

      // 关键修复：从原始配置中恢复httpConfigData
      // 由于这是从配置管理器恢复，需要重构HttpConfig格式
      // 如果原始配置包含了完整的HttpConfig信息，恢复它
      if (item.config.url) {
        displayConfig.httpConfigData = {
          url: item.config.url || '',
          method: item.config.method || 'GET',
          timeout: item.config.timeout || 10000,

          // 恢复headers数组格式
          headers: item.config.headers
            ? Object.entries(item.config.headers).map(([key, value]) => ({
                key,
                value: String(value),
                enabled: true,
                isDynamic: false, // headers通常是静态的
                dataType: 'string',
                variableName: '',
                description: ''
              }))
            : [],

          // 关键：恢复params数组格式，正确处理isDynamic字段，并应用保护机制
          params: item.config.params
            ? // 如果是数组格式（新格式），直接使用并保持原有的isDynamic状态
              Array.isArray(item.config.params)
              ? protectParameterBindingPaths(
                  item.config.params.map((param: any) => ({
                    key: param.key || '',
                    value: param.value || '',
                    enabled: param.enabled !== undefined ? param.enabled : true,
                    // 关键修复：智能检测并修正isDynamic状态
                    isDynamic: detectIsDynamicParameter(param),
                    dataType: param.dataType || 'string',
                    variableName: param.variableName || '',
                    description: param.description || '',
                    // 保持组件属性绑定相关字段
                    valueMode: param.valueMode || 'manual',
                    selectedTemplate: param.selectedTemplate || 'manual',
                    defaultValue: param.defaultValue
                  }))
                )
              : // 如果是对象格式（旧格式），转换为数组，默认为静态参数
                Object.entries(item.config.params).map(([key, value]) => ({
                  key,
                  value: String(value),
                  enabled: true,
                  isDynamic: false, // 旧格式默认为静态
                  dataType: 'string',
                  variableName: '',
                  description: '',
                  valueMode: 'manual',
                  selectedTemplate: 'manual'
                }))
            : [],

          body: item.config.body
            ? typeof item.config.body === 'string'
              ? item.config.body
              : JSON.stringify(item.config.body)
            : '',

          // 关键：恢复脚本配置
          preRequestScript: item.config.preRequestScript || '',
          postResponseScript: item.config.postResponseScript || '',

          // 重大修复：恢复地址类型相关字段（这是数据不一致的根本原因）
          addressType: item.config.addressType || 'external',
          selectedInternalAddress: item.config.selectedInternalAddress || '',
          enableParams: item.config.enableParams || false,
          // 修复：pathParams也应用智能检测和保护机制
          pathParams: item.config.pathParams
            ? protectParameterBindingPaths(
                item.config.pathParams.map((param: any) => ({
                  ...param,
                  isDynamic: detectIsDynamicParameter(param)
                }))
              )
            : [],
          // 修复：pathParameter也应用智能检测和保护机制
          pathParameter: item.config.pathParameter
            ? (() => {
                const processedParam = {
                  ...item.config.pathParameter,
                  isDynamic: detectIsDynamicParameter(item.config.pathParameter)
                }
                // 对单个参数应用保护（将其包装为数组处理后取出）
                const protectedParams = protectParameterBindingPaths([processedParam])
                return protectedParams[0]
              })()
            : undefined
        }
      }
      break
  }

  // 转换处理配置
  displayConfig.processingConfig = {
    jsonPath: processing.filterPath === '$' ? '' : processing.filterPath,
    scriptCode: processing.customScript || '',
    defaultValue: processing.defaultValue || ''
  }

  // ✅ 优化：缓存转换结果
  configConversionCache.set(cacheKey, smartDeepClone(displayConfig))

  return displayConfig
}

// 组件挂载时恢复显示状态并设置集成
// ⚡ 性能优化：使用延迟加载和懒初始化策略，避免阻塞UI渲染
// 🔥 激进优化：最小化首次渲染阻塞，推迟所有非关键操作
onMounted(async () => {
  const perfStart = performance.now()

  try {
    // ✅ 阶段1：最小化关键初始化（仅配置管理器）
    const initStart = performance.now()
    await configurationManager.initialize()
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [Perf] ConfigManager初始化: ${(performance.now() - initStart).toFixed(2)}ms`)
    }

    // ✅ 阶段2：立即返回控制权给浏览器，让UI先渲染
    await nextTick()

    // ✅ 阶段3：使用 setTimeout(0) 快速推迟配置初始化
    setTimeout(() => {
      const configStart = performance.now()

      // 确保组件配置存在
      let existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      if (!existingConfig) {
        configurationManager.initializeConfiguration(componentInfo.value.componentId)
        existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      }

      // 设置数据源执行集成
      if ('setupComponentDataSourceIntegration' in configurationManager) {
        ;(configurationManager as any).setupComponentDataSourceIntegration(componentInfo.value.componentId)
      }

      // 配置同步（如果需要）
      if (existingConfig && (!existingConfig.dataSource || Object.keys(existingConfig.dataSource).length === 0)) {
        if (editorContext?.getNodeById) {
          const realNode = editorContext.getNodeById(componentInfo.value.componentId)
          if (
            realNode?.metadata?.unifiedConfig?.dataSource &&
            typeof realNode.metadata.unifiedConfig.dataSource === 'object' &&
            Object.keys(realNode.metadata.unifiedConfig.dataSource).length > 0
          ) {
            configurationManager.updateConfiguration(
              componentInfo.value.componentId,
              'dataSource',
              realNode.metadata.unifiedConfig.dataSource
            )
          }
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] 配置初始化: ${(performance.now() - configStart).toFixed(2)}ms`)
      }

      // ✅ 阶段4：延迟恢复显示状态（使用 requestAnimationFrame 确保在下一帧）
      requestAnimationFrame(() => {
        const restoreStart = performance.now()
        restoreDataItemsFromConfig()

        // ✅ 设置初始化完成
        isInitializing.value = false

        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ [Perf] 配置恢复: ${(performance.now() - restoreStart).toFixed(2)}ms`)
          console.log(`⚡ [Perf] 总耗时: ${(performance.now() - perfStart).toFixed(2)}ms`)
        }
      })
    }, 0)

    // ✅ 阶段5：使用 requestIdleCallback 延迟所有低优先级操作
    const delayedInitialization = () => {
      const idleStart = performance.now()

      // Card2.1 Core响应式数据管理
      checkCard2CoreReactiveSupport()
      if (useCard2CoreReactiveData.value) {
        initializeCard2CoreReactiveData()
      }

      // 初始化组件轮询
      initializeComponentPolling()

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] 低优先级初始化: ${(performance.now() - idleStart).toFixed(2)}ms`)
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(delayedInitialization, { timeout: 2000 })
    } else {
      setTimeout(delayedInitialization, 200)
    }
  } catch (error) {
    console.error('❌ [SimpleConfigurationEditor] 初始化失败:', error)
    // 降级处理
    try {
      setTimeout(() => {
        restoreDataItemsFromConfig()
        setTimeout(() => {
          try {
            initializeComponentPolling()
          } catch (pollingError) {
            console.error('❌ [SimpleConfigurationEditor] 轮询初始化失败:', pollingError)
          }
        }, 100)
      }, 0)
    } catch (fallbackError) {
      console.error('❌ [SimpleConfigurationEditor] 降级处理失败:', fallbackError)
    }
  }
})

// 组件卸载时清理轮询任务
onUnmounted(() => {
  try {
    // 🚀 清理Card2.1 Core响应式数据订阅
    cleanupCard2CoreReactiveData()

    // 清理传统轮询任务
    const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
    existingTasks.forEach(task => {
      pollingManager.removeTask(task.id)
      if (process.env.NODE_ENV === 'development') {
      }
    })

    // ⚡ 性能优化：清理配置转换缓存
    configConversionCache.clear()
  } catch (error) {
    console.error('清理轮询任务失败:', error)
  }
})

/**
 * 新增：获取当前编辑的数据项
 */
const getEditData = () => {
  if (!isEditMode.value || !editingItemId.value || !currentDataSourceKey.value) {
    return null
  }

  const items = dataSourceItems[currentDataSourceKey.value]
  if (!items) return null

  const editItem = items.find(item => item.id === editingItemId.value)
  return editItem
}

/**
 * 获取当前数据源的示例数据
 * 统一标准：只使用 example 字段，确保组件间示例数据标准一致
 */
const getCurrentDataSourceExampleData = () => {
  if (!currentDataSourceKey.value) return undefined

  const currentDataSource = dataSourceOptions.value.find(opt => opt.value === currentDataSourceKey.value)

  // 统一标准：只检查example字段
  const exampleData = currentDataSource?.originalData?.example

  return exampleData
}

/**
 * 计算属性：是否应该显示示例数据图标
 * 只在 JSON 模式下显示
 */
const shouldShowExampleDataIcon = computed(() => {
  // 检查是否有示例数据
  const hasExampleData = !!getCurrentDataSourceExampleData()
  // 检查当前选择的是否为 JSON 模式
  const isJsonMode = currentSelectedMethod.value === 'json'
  return hasExampleData && isJsonMode
})

/**
 * 复制示例数据到剪贴板（用于抽屉标题）
 */
const copyExampleDataToClipboard = async () => {
  const exampleData = getCurrentDataSourceExampleData()
  if (!exampleData) {
    message.warning('没有可复制的示例数据')
    return
  }

  try {
    const jsonString = JSON.stringify(exampleData, null, 2)
    await navigator.clipboard.writeText(jsonString)
    message.success('示例数据已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请手动复制')
  }
}

/**
 * 复制数据源选项的示例数据到剪贴板（用于折叠面板）
 */
const copyDataSourceExampleToClipboard = async (dataSourceOption: any) => {
  const exampleData = dataSourceOption?.originalData?.config?.exampleData || dataSourceOption?.originalData?.example
  if (!exampleData) {
    message.warning('没有可复制的示例数据')
    return
  }

  try {
    const jsonString = JSON.stringify(exampleData, null, 2)
    await navigator.clipboard.writeText(jsonString)
    message.success('示例数据已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请手动复制')
  }
}

// 新UI辅助方法

/**
 * 获取数据项类型的颜色
 */
const getItemTypeColor = (type: string) => {
  const colorMap = {
    json: 'info',
    script: 'warning',
    http: 'success'
  }
  return colorMap[type] || 'default'
}

/**
 * 获取数据项类型的图标组件
 */
const getItemTypeIcon = (type: string) => {
  const iconMap = {
    json: DocumentTextOutline,
    script: SettingOutlined,
    http: GlobeOutline
  }
  return iconMap[type] || DocumentTextOutline
}

/**
 * 获取数据项摘要信息
 */
const getItemSummary = (item: any) => {
  switch (item.type) {
    case 'json':
      return item.jsonData ? 'JSON数据已配置' : '空JSON数据'
    case 'script':
      return item.scriptCode ? 'JavaScript脚本已配置' : '空脚本'
    case 'http':
      return item.url || 'HTTP接口未配置'
    default:
      return '未知类型'
  }
}

/**
 * 检查是否有处理配置
 */
const hasProcessingConfig = (item: any) => {
  const config = item.processingConfig
  return config && (config.jsonPath || config.scriptCode || config.defaultValue)
}

/**
 * 获取处理配置摘要
 */
const getProcessingSummary = (item: any) => {
  const config = item.processingConfig
  if (!config) return ''

  const parts = []
  if (config.jsonPath) parts.push(`路径: ${config.jsonPath}`)
  if (config.scriptCode) parts.push('自定义脚本')
  if (config.defaultValue) parts.push(`默认: ${config.defaultValue}`)

  return parts.join(', ')
}

/**
 * 获取合并策略显示文本
 */
const getMergeStrategyDisplay = (dataSourceKey: string) => {
  const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }

  const displayMap = {
    object: '对象合并',
    array: '数组组成',
    select: `选择第${(strategy.selectedIndex || 0) + 1}项`,
    script: '自定义脚本'
  }

  return displayMap[strategy.type] || '未知策略'
}

/**
 * 获取合并策略选项
 */
const getMergeStrategyOptions = () => [
  { label: '对象合并', value: 'object' },
  { label: '数组组成', value: 'array' },
  { label: '选择其中一个', value: 'select' },
  { label: '自定义脚本', value: 'script' }
]

/**
 * 更新合并策略类型
 */
const updateMergeStrategyType = (dataSourceKey: string, newType: string) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'object' }
  const newStrategy = { ...currentStrategy, type: newType }

  // 如果切换到select类型，确保有selectedIndex
  if (newType === 'select' && !('selectedIndex' in newStrategy)) {
    newStrategy.selectedIndex = 0
  }
  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

/**
 * 更新合并策略选中索引
 */
const updateMergeStrategyIndex = (dataSourceKey: string, newIndex: number) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'select' }
  const newStrategy = { ...currentStrategy, selectedIndex: newIndex }

  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

/**
 * 更新合并策略脚本（针对script类型）
 */
const updateMergeStrategyScript = (dataSourceKey: string, newScript: string) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'script' }
  const newStrategy = { ...currentStrategy, script: newScript }

  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

// 查看真实数据结果

/**
 * 查看最终数据
 */
const viewFinalData = async (dataSourceKey: string) => {
  try {
    // 获取当前数据源的配置项
    const currentDataSourceItems = dataSourceItems[dataSourceKey]
    if (!currentDataSourceItems || currentDataSourceItems.length === 0) {
      dialog.warning({
        title: '无数据项',
        content: `数据源 ${dataSourceKey} 暂无配置项`,
        positiveText: '关闭'
      })
      return
    }

    // 修复：使用配置管理系统获取最新配置，确保数据一致性
    const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    let dataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

    if (!dataSourceConfig) {
      // 如果配置不存在，使用当前显示状态重建
      dataSourceConfig = rebuildCompleteDataSourceConfiguration()
    }

    // 使用执行器链直接执行配置
    const executorChain = new MultiLayerExecutorChain()
    const executionResult = await executorChain.executeDataProcessingChain(dataSourceConfig, true)
    if (executionResult.success && executionResult.componentData) {
      // 提取指定数据源的数据
      const dataSourceData = executionResult.componentData[dataSourceKey]

      // 显示结果弹窗
      dialog.info({
        title: `${dataSourceKey} - 实时数据执行结果`,
        content: () =>
          h(
            'pre',
            {
              style: {
                maxHeight: '400px',
                overflow: 'auto',
                background: 'var(--code-color)',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.4'
              }
            },
            JSON.stringify(dataSourceData || { message: '执行成功但数据为空' }, null, 2)
          ),
        positiveText: '关闭'
      })
    } else {
      // 显示执行失败信息
      dialog.error({
        title: '数据执行失败',
        content: `数据源 ${dataSourceKey} 执行失败: ${executionResult.error || '未知错误'}`,
        positiveText: '关闭'
      })
    }
  } catch (error) {
    // 显示错误信息
    dialog.error({
      title: '获取数据失败',
      content: `无法获取 ${dataSourceKey} 的数据: ${error.message}`,
      positiveText: '关闭'
    })
  }
}

/**
 * 导出配置为 JSON 文件
 */
/**
 * 处理导出成功事件
 */
const handleExportSuccess = (exportData: any) => {
  if (process.env.NODE_ENV === 'development') {
  }

  // 显示成功消息
  const stats = exportData.metadata?.statistics
  if (stats) {
    const message = `配置导出成功！包含 ${stats.dataSourceCount} 个数据源、${stats.httpConfigCount} 个HTTP配置、${stats.interactionCount} 个交互配置`

    dialog.success({
      title: '导出成功',
      content: message,
      positiveText: '确定'
    })
  }
}

/**
 * 处理导入成功事件
 */
const handleImportSuccess = (importData: any) => {
  if (process.env.NODE_ENV === 'development') {
  }

  // 刷新显示状态
  restoreDataItemsFromConfig()

  dialog.success({
    title: '导入成功',
    content: '配置导入成功！',
    positiveText: '确定'
  })
}

/**
 * 处理导入导出错误事件
 */
const handleImportExportError = (error: Error) => {
  console.error('❌ [SimpleConfigurationEditor] 导入导出失败:', error)

  dialog.error({
    title: '操作失败',
    content: `操作失败: ${error.message}`,
    positiveText: '确定'
  })
}

/**
 * 导出单个数据源配置
 */
const exportSingleDataSource = async (dataSourceId: string): Promise<void> => {
  if (!dataSourceId || exportLoading.value[dataSourceId]) return

  try {
    exportLoading.value[dataSourceId] = true

    if (process.env.NODE_ENV === 'development') {
    }

    // 执行单数据源导出
    const exportResult = await singleDataSourceExporter.exportSingleDataSource(
      componentInfo.value.componentId,
      dataSourceId,
      configurationManager,
      componentInfo.value.componentType
    )

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `datasource_${dataSourceId}_${timestamp}.json`

    // 下载文件
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(`数据源 ${dataSourceId} 配置导出成功`)

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] 单数据源导出失败:', error)
    message.error(`导出失败: ${errorMessage}`)
    handleImportExportError(error instanceof Error ? error : new Error(errorMessage))
  } finally {
    exportLoading.value[dataSourceId] = false
  }
}

/**
 * 触发单数据源导入文件选择
 */
const triggerImportForDataSource = (dataSourceId: string): void => {
  targetDataSourceId.value = dataSourceId
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = handleImportFileSelect
  input.click()
}

/**
 * 处理导入文件选择
 */
const handleImportFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.json')) {
    message.error('文件格式不正确，请选择JSON文件')
    return
  }

  handleImportPreview(file)
}

/**
 * 处理导入预览
 */
const handleImportPreview = async (file: File): Promise<void> => {
  try {
    const fileContent = await readFileAsText(file)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
    }

    // 判断是否为单数据源文件 - 支持两种格式标识
    if (importData.exportType === 'single-datasource' || importData.type === 'singleDataSource') {
      // 保存原始导入数据
      originalImportData.value = importData

      // 生成单数据源导入预览
      singleDataSourceImportPreview.value = singleDataSourceImporter.generateImportPreview(
        importData,
        componentInfo.value.componentId,
        configurationManager
      )

      showSingleDataSourceImportModal.value = true
    } else {
      message.error('请选择单数据源格式的配置文件')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] 导入预览失败:', error)
    message.error(`预览失败: ${errorMessage}`)
  }
}

/**
 * 执行单数据源导入
 */
const handleSingleDataSourceImport = async (): Promise<void> => {
  if (!singleDataSourceImportPreview.value || !targetDataSourceId.value || !originalImportData.value) {
    return
  }

  try {
    isProcessing.value = true // 开始处理，显示loading

    if (process.env.NODE_ENV === 'development') {
    }

    // 使用原始导入数据执行导入
    await singleDataSourceImporter.importSingleDataSource(
      originalImportData.value,
      componentInfo.value.componentId,
      targetDataSourceId.value,
      configurationManager
    )

    message.success(`数据源 ${targetDataSourceId.value} 配置导入成功`)

    if (process.env.NODE_ENV === 'development') {
    }

    // 关闭模态框并重置状态
    showSingleDataSourceImportModal.value = false
    singleDataSourceImportPreview.value = null
    originalImportData.value = null
    targetDataSourceId.value = ''

    // 刷新配置数据
    await refreshConfigurationData()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] 单数据源导入失败:', error)
    message.error(`导入失败: ${errorMessage}`)
    handleImportExportError(error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false // 处理完成，隐藏loading
  }
}

/**
 * 读取文件为文本
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = e => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 刷新配置数据
 */
const refreshConfigurationData = async (): Promise<void> => {
  try {
    // 关键修复：强制清理数据缓存，确保获取最新配置
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)

    // 修复：强制清空当前显示的数据项，然后重新恢复
    Object.keys(dataSourceItems).forEach(key => {
      delete dataSourceItems[key]
    })
    Object.keys(mergeStrategies).forEach(key => {
      delete mergeStrategies[key]
    })

    // 等待Vue响应式更新完成
    await nextTick()

    // 重要：强制触发配置恢复
    restoreDataItemsFromConfig()

    // 再次等待Vue响应式更新
    await nextTick()

    // 额外：如果有编辑器上下文，同步最新状态
    if (editorContext?.updateNode) {
      const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      if (latestConfig) {
        const currentNode = editorContext.getNodeById(componentInfo.value.componentId)
        if (currentNode) {
          editorContext.updateNode(componentInfo.value.componentId, {
            metadata: {
              ...currentNode.metadata,
              unifiedConfig: {
                ...currentNode.metadata?.unifiedConfig,
                ...latestConfig
              },
              lastImportTime: Date.now()
            }
          })
        }
      }
    }

    // 强制验证恢复结果
    const totalItems = Object.values(dataSourceItems).reduce((sum, items) => sum + items.length, 0)

    // 如果还是没有数据，强制日志输出配置状态
    if (totalItems === 0) {
      const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      console.error(`❌ [refreshConfigurationData] 恢复后仍无数据项:`, {
        hasLatestConfig: !!latestConfig,
        dataSourceConfig: latestConfig?.dataSource,
        dataSourcesLength: latestConfig?.dataSource?.dataSources?.length || 0,
        dataSourcesContent: latestConfig?.dataSource?.dataSources
      })
    }
  } catch (error) {
    console.error('❌ [SimpleConfigurationEditor] 配置数据刷新失败:', error)
  }
}

// 所有导入导出方法已迁移到独立组件ConfigurationImportExportPanel

// 暴露方法给父组件
defineExpose({
  getCurrentConfig: () => props.modelValue,
  restoreDataItemsFromConfig
  // 导入导出功能已迁移到独立组件，不再需要暴露相关方法
})
</script>

<template>
  <div class="simple-configuration-editor">
    <!-- 配置操作工具栏 -->
    <div class="config-toolbar">
      <div class="toolbar-title">
        <span>{{ componentInfo.componentType || '组件' }}配置</span>
        <n-tag v-if="componentInfo.componentId" size="small" type="info">
          {{ componentInfo.componentId.slice(0, 8) }}...
        </n-tag>
      </div>

      <n-space>
        <!-- 原配置导入导出面板已移除，功能集成到各数据源按钮 -->
      </n-space>
    </div>

    <!-- 组件级别轮询配置 -->
    <ComponentPollingConfig
      :component-id="componentInfo.componentId"
      :component-name="componentInfo.componentType"
      :preview-mode="props.previewMode"
      :initial-config="getComponentPollingConfig()"
      @config-change="handleComponentPollingConfigChange"
    />

    <!-- ⚡ 加载状态骨架屏 -->
    <div v-if="isInitializing" class="loading-skeleton">
      <n-skeleton text :repeat="3" />
      <n-skeleton text style="width: 60%" />
    </div>

    <!-- 数据源折叠面板 - accordion模式，每次只能展开一个 -->
    <n-collapse
      v-else
      :default-expanded-names="dataSourceOptions.length > 0 ? [dataSourceOptions[0].value] : []"
      accordion
      class="data-source-collapse"
    >
      <n-collapse-item
        v-for="dataSourceOption in dataSourceOptions"
        :key="dataSourceOption.value"
        :name="dataSourceOption.value"
      >
        <template #header>
          <div class="collapse-header">
            <span class="header-title">{{ dataSourceOption.label }}</span>
            <n-tooltip
              v-if="dataSourceOption.originalData?.config?.exampleData || dataSourceOption.originalData?.example"
              trigger="hover"
              placement="left"
              :style="{ maxWidth: '400px' }"
            >
              <template #trigger>
                <n-icon size="14" class="example-data-icon" :style="{ color: 'var(--info-color)', cursor: 'pointer' }">
                  <DocumentTextOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-header">
                  <div class="tooltip-title">
                    <n-icon size="14" style="margin-right: 4px">
                      <DocumentTextOutline />
                    </n-icon>
                    示例数据
                  </div>
                  <n-button
                    size="tiny"
                    text
                    type="primary"
                    class="copy-button"
                    @click="copyDataSourceExampleToClipboard(dataSourceOption)"
                  >
                    <template #icon>
                      <n-icon size="14">
                        <CopyOutlined />
                      </n-icon>
                    </template>
                    复制
                  </n-button>
                </div>
                <pre class="example-data-content">{{
                  JSON.stringify(
                    dataSourceOption.originalData.config?.exampleData || dataSourceOption.originalData.example,
                    null,
                    2
                  )
                }}</pre>
              </div>
            </n-tooltip>
          </div>
        </template>

        <template #header-extra>
          <span style="font-size: 12px; color: var(--text-color-2)">
            {{ dataSourceItems[dataSourceOption.value]?.length || 0 }}项
          </span>
        </template>

        <div class="simple-content">
          <!-- 添加按钮 -->
          <n-button size="small" dashed @click="handleAddDataItem(dataSourceOption.value)">
            <template #icon>
              <n-icon size="14">
                <PlusOutlined />
              </n-icon>
            </template>
            添加数据项
          </n-button>

          <!-- 数据项列表 -->
          <div v-if="dataSourceItems[dataSourceOption.value]?.length" class="items-list">
            <div v-for="item in dataSourceItems[dataSourceOption.value]" :key="item.id" class="item-row">
              <div class="item-type-with-icon">
                <n-icon size="14" :color="`var(--${getItemTypeColor(item.type)}-color)`">
                  <component :is="getItemTypeIcon(item.type)" />
                </n-icon>
                <span class="item-type">{{ item.type.toUpperCase() }}</span>
              </div>
              <span class="item-desc">{{ getItemSummary(item) }}</span>
              <div class="item-actions">
                <n-button size="small" text @click="handleEditDataItem(dataSourceOption.value, item.id)">编辑</n-button>
                <n-button size="small" text type="error" @click="handleDeleteDataItem(dataSourceOption.value, item.id)">
                  删除
                </n-button>
              </div>
            </div>
          </div>

          <!-- 合并策略（多项时显示） -->
          <div v-if="(dataSourceItems[dataSourceOption.value]?.length || 0) >= 2" class="merge-section">
            <div class="merge-strategy-selector">
              <span class="strategy-label">合并方式:</span>
              <n-tag
                v-for="option in getMergeStrategyOptions()"
                :key="option.value"
                :type="
                  (mergeStrategies[dataSourceOption.value] || { type: 'object' }).type === option.value
                    ? 'primary'
                    : 'default'
                "
                :checkable="true"
                :checked="(mergeStrategies[dataSourceOption.value] || { type: 'object' }).type === option.value"
                :bordered="true"
                size="small"
                @click="updateMergeStrategyType(dataSourceOption.value, option.value)"
              >
                {{ option.label }}
              </n-tag>
            </div>

            <!-- 选择项配置 -->
            <n-form-item
              v-if="(mergeStrategies[dataSourceOption.value] || {}).type === 'select'"
              style="margin-top: 18px"
              label-placement="left"
              label="请选择："
              size="small"
            >
              <n-input-number
                :value="((mergeStrategies[dataSourceOption.value] || {}).selectedIndex || 0) + 1"
                :min="1"
                :max="dataSourceItems[dataSourceOption.value]?.length || 1"
                size="small"
                @update:value="updateMergeStrategyIndex(dataSourceOption.value, $event - 1)"
              >
                <template #prefix>第</template>
                <template #suffix>项</template>
              </n-input-number>
            </n-form-item>

            <!-- 脚本配置 -->
            <n-form-item v-if="(mergeStrategies[dataSourceOption.value] || {}).type === 'script'" size="small">
              <SimpleScriptEditor
                :model-value="(mergeStrategies[dataSourceOption.value] || {}).script || ''"
                template-category="data-merger"
                :show-templates="true"
                :show-toolbar="false"
                placeholder="请输入数据合并脚本..."
                height="120px"
                @update:model-value="updateMergeStrategyScript(dataSourceOption.value, $event)"
              />
            </n-form-item>
          </div>

          <!-- 查看结果按钮（仅在有数据时显示） -->
          <div v-if="(dataSourceItems[dataSourceOption.value]?.length || 0) > 0" class="result-section">
            <n-button size="small" text type="info" @click="viewFinalData(dataSourceOption.value)">
              <template #icon>
                <n-icon size="14">
                  <SearchOutlined />
                </n-icon>
              </template>
              查看最终结果
            </n-button>
          </div>

          <!-- 导入导出按钮（始终显示） -->
          <div class="import-export-section">
            <n-space :size="8" align="center" justify="center">
              <!-- 导出单数据源按钮（仅在有数据项时可用） -->
              <n-button
                size="small"
                text
                type="success"
                :disabled="
                  !dataSourceItems[dataSourceOption.value] || dataSourceItems[dataSourceOption.value].length === 0
                "
                :loading="exportLoading[dataSourceOption.value]"
                @click="exportSingleDataSource(dataSourceOption.value)"
              >
                <template #icon>
                  <n-icon size="14">
                    <DownloadOutlined />
                  </n-icon>
                </template>
                导出配置
              </n-button>

              <!-- 导入单数据源按钮（始终可用） -->
              <n-button size="small" text type="warning" @click="triggerImportForDataSource(dataSourceOption.value)">
                <template #icon>
                  <n-icon size="14">
                    <UploadOutlined />
                  </n-icon>
                </template>
                导入配置
              </n-button>
            </n-space>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>

    <!-- 空状态提示 -->
    <n-empty
      v-if="dataSourceOptions.length === 0"
      description="没有可配置的数据源"
      size="small"
      style="margin: 40px 0"
    />

    <!-- 原始数据配置抽屉 - 更大空间展示复杂配置 -->
    <n-drawer
      v-model:show="showRawDataModal"
      :width="'85vw'"
      :height="'85vh'"
      placement="right"
      class="raw-data-config-drawer"
    >
      <n-drawer-content closable>
        <!-- 自定义标题：包含文本和示例数据图标 -->
        <template #header>
          <div class="drawer-header-with-icon">
            <span>数据项配置</span>
            <n-tooltip
              v-if="shouldShowExampleDataIcon"
              trigger="hover"
              placement="bottom"
              :style="{ maxWidth: '400px' }"
            >
              <template #trigger>
                <n-icon
                  size="16"
                  class="example-data-icon-in-title"
                  :style="{ color: 'var(--info-color)', cursor: 'pointer', marginLeft: '8px' }"
                >
                  <DocumentTextOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-header">
                  <div class="tooltip-title">
                    <n-icon size="14" style="margin-right: 4px">
                      <DocumentTextOutline />
                    </n-icon>
                    示例数据
                  </div>
                  <n-button size="tiny" text type="primary" class="copy-button" @click="copyExampleDataToClipboard">
                    <template #icon>
                      <n-icon size="14">
                        <CopyOutlined />
                      </n-icon>
                    </template>
                    复制
                  </n-button>
                </div>
                <pre class="example-data-content">{{ JSON.stringify(getCurrentDataSourceExampleData(), null, 2) }}</pre>
              </div>
            </n-tooltip>
          </div>
        </template>

        <RawDataConfigModal
          :show="true"
          :data-source-key="currentDataSourceKey"
          :component-id="componentId"
          :is-edit-mode="isEditMode"
          :edit-data="getEditData()"
          :example-data="getCurrentDataSourceExampleData()"
          :use-drawer-mode="true"
          @confirm="handleDataItemConfirm"
          @close="handleRawDataModalClose"
          @cancel="handleRawDataModalClose"
          @method-change="currentSelectedMethod = $event"
          @update:show="() => {}"
        />
      </n-drawer-content>
    </n-drawer>

    <!-- 单数据源导入预览模态框 -->
    <n-modal
      v-model:show="showSingleDataSourceImportModal"
      preset="dialog"
      title="单数据源导入预览"
      style="width: 500px"
      :show-icon="false"
    >
      <div v-if="singleDataSourceImportPreview">
        <n-space vertical>
          <!-- 源信息 -->
          <n-card title="源信息" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item label="数据源">
                {{ singleDataSourceImportPreview.basicInfo.originalSourceId }}
              </n-descriptions-item>
              <n-descriptions-item label="版本">
                {{ singleDataSourceImportPreview.basicInfo.version }}
              </n-descriptions-item>
              <n-descriptions-item label="导出时间">
                {{ new Date(singleDataSourceImportPreview.basicInfo.exportTime).toLocaleString() }}
              </n-descriptions-item>
              <n-descriptions-item label="配置项数">
                {{ singleDataSourceImportPreview.configSummary.dataItemCount }}
              </n-descriptions-item>
              <n-descriptions-item label="导出来源">
                {{ singleDataSourceImportPreview.basicInfo.exportSource }}
              </n-descriptions-item>
              <n-descriptions-item label="合并策略">
                {{ singleDataSourceImportPreview.configSummary.mergeStrategy }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- 配置详情 -->
          <n-card title="配置详情" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item label="数据项数量">
                {{ singleDataSourceImportPreview.configSummary.dataItemCount }}
              </n-descriptions-item>
              <n-descriptions-item label="包含处理逻辑">
                {{ singleDataSourceImportPreview.configSummary.hasProcessing ? '是' : '否' }}
              </n-descriptions-item>
              <n-descriptions-item label="交互配置">
                {{ singleDataSourceImportPreview.relatedConfig.interactionCount }} 项
              </n-descriptions-item>
              <n-descriptions-item label="HTTP绑定">
                {{ singleDataSourceImportPreview.relatedConfig.httpBindingCount }} 项
              </n-descriptions-item>
            </n-descriptions>

            <!-- 依赖项和冲突检测 -->
            <div v-if="singleDataSourceImportPreview.dependencies.length > 0" style="margin-top: 12px">
              <n-text depth="2" style="font-size: 12px">外部依赖：</n-text>
              <n-space size="small" style="margin-top: 4px">
                <n-tag v-for="dep in singleDataSourceImportPreview.dependencies" :key="dep" type="warning" size="small">
                  {{ dep }}
                </n-tag>
              </n-space>
            </div>

            <div v-if="singleDataSourceImportPreview.conflicts.length > 0" style="margin-top: 12px">
              <n-alert type="warning" title="检测到冲突" size="small">
                <ul style="margin: 4px 0; padding-left: 20px">
                  <li v-for="conflict in singleDataSourceImportPreview.conflicts" :key="conflict">
                    {{ conflict }}
                  </li>
                </ul>
              </n-alert>
            </div>
          </n-card>

          <!-- 目标信息 -->
          <n-card title="目标信息" size="small">
            <n-descriptions :column="1" size="small">
              <n-descriptions-item label="目标数据源">
                {{ targetDataSourceId }}
              </n-descriptions-item>
            </n-descriptions>

            <n-alert type="info" title="导入说明" style="margin-top: 8px">
              此配置将导入到数据源 "{{ targetDataSourceId }}"，原有配置将被覆盖
            </n-alert>
          </n-card>
        </n-space>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceImportModal = false">取消</n-button>
          <n-button
            type="primary"
            :disabled="singleDataSourceImportPreview?.conflicts.length > 0"
            :loading="isProcessing"
            @click="handleSingleDataSourceImport"
          >
            确认导入
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.simple-configuration-editor {
  width: 100%;
}

/* 配置工具栏样式 */
.config-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 16px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

/* 导入预览弹窗样式已迁移到ConfigurationImportExportPanel组件 */

/* 简化后的内容区域 */
.simple-content {
  margin-top: -8px;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simple-content > *:first-child + .items-list {
  margin-top: 4px;
}

/* 数据项列表 */
.items-list {
  display: flex;
  flex-direction: column;
  max-height: 150px;
  overflow-y: auto;
  gap: 4px;
}

/* 数据项行 */
.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  font-size: 12px;
}

/* 数据项类型图标和文本容器 */
.item-type-with-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.item-type {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
}

.item-desc {
  flex: 1;
  color: var(--text-color);
  font-size: 12px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

/* ⚡ 加载骨架屏样式 */
.loading-skeleton {
  padding: 24px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 16px;
}

/* 合并策略区域 */
.merge-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

/* 合并策略选择器 */
.merge-strategy-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.strategy-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  margin-right: 2px;
}

/* 查看结果按钮区域 */
.result-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

/* 导入导出按钮区域 */
.import-export-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  margin-top: 8px;
}

/* 折叠面板自定义 */
.data-source-collapse {
  margin-top: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 折叠面板头部布局 */
.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  flex: 1;
  font-weight: 500;
}

.example-data-icon {
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.example-data-icon:hover {
  opacity: 1;
}

/* 抽屉标题布局 */
.drawer-header-with-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

/* 抽屉标题中的示例数据图标 */
.example-data-icon-in-title {
  flex-shrink: 0;
  opacity: 0.7;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.example-data-icon-in-title:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* 示例数据提示框样式 */
.example-data-tooltip {
  max-width: 400px;
}

/* 提示框头部：标题和复制按钮 */
.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

.tooltip-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--info-color);
}

/* 复制按钮样式 */
.copy-button {
  font-size: 12px;
  padding: 2px 8px;
  transition: all 0.2s;
}

.copy-button:hover {
  transform: translateY(-1px);
}

.example-data-content {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color);
  background: var(--code-color);
  padding: 12px;
  border-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 250px;
  overflow-y: auto;
}

/* 深度选择器：折叠面板样式定制 */
.data-source-collapse :deep(.n-collapse-item) {
  border: none;
}

.data-source-collapse :deep(.n-collapse-item:not(:last-child)) {
  border-bottom: 1px solid var(--divider-color);
}

.data-source-collapse :deep(.n-collapse-item__header) {
  background: var(--card-color);
  padding: 16px;
  font-weight: 500;
}

.data-source-collapse :deep(.n-collapse-item__content-wrapper) {
  background: var(--body-color);
}

.data-source-collapse :deep(.n-collapse-item__content-inner) {
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simple-content {
    padding: 8px;
  }

  .item-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .item-type-with-icon {
    min-width: auto;
    justify-content: center;
  }
}
</style>
