<!--
  简易配置系统 - 替代复杂UI组件的轻量级配置编辑器
  实现可视化数据源配置，支持JSON/HTTP/Script三种类型
-->
<script setup lang="ts">
/**
 * SimpleConfigurationEditor - 简易配置编辑器
 * 基于SUBTASK-010要求，实现轻量级可视化配置界面
 */

import { ref, reactive, computed, watch, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from 'naive-ui'
import {
  createExecutorChain,
  type DataSourceConfiguration,
  type DataSource,
  type DataItem,
  type ProcessingConfig
} from '../index'
import { type MergeStrategy } from '../executors/DataSourceMerger'
import RawDataConfigModal from './modals/RawDataConfigModal.vue'
// 🔥 简洁脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// 🔥 导入组件级别轮询配置组件
import ComponentPollingConfig from './ComponentPollingConfig.vue'
// 导入@vicons图标组件
import { PlusOutlined, SearchOutlined, LinkOutlined, DotChartOutlined, SettingOutlined, DownloadOutlined, UploadOutlined } from '@vicons/antd'
import { DocumentTextOutline, BarChartOutline, GlobeOutline } from '@vicons/ionicons5'
// 🔥 新配置管理系统
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import { MultiLayerExecutorChain } from '@/core/data-architecture/executors/MultiLayerExecutorChain'
import { smartDeepClone } from '@/utils/deep-clone'
// 🔥 导入导出工具类
import { configurationExporter, configurationImporter } from '../utils/ConfigurationImportExport'
import type { ImportPreview } from '../utils/ConfigurationImportExport'

// Props接口 - 匹配现有系统
interface Props {
  /** v-model绑定的配置数据 */
  modelValue: Record<string, any>
  /** 从组件定义获取的数据源需求 */
  dataSources: Record<string, any> | Array<any>
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 选中的组件ID */
  selectedWidgetId?: string
  /** 是否为预览模式 - 轮询功能仅在预览模式下生效 */
  previewMode?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  dataSources: () => [],
  previewMode: false
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 弹窗
const dialog = useDialog()

/**
 * 处理数据源选项 - 兼容数组和对象格式
 */
const dataSourceOptions = computed(() => {
  if (!props.dataSources) return []

  // 处理数组格式
  if (Array.isArray(props.dataSources)) {
    const result = props.dataSources.map((dataSource, index) => {
      const key = dataSource.key || `dataSource${index + 1}`
      return {
        label: dataSource.name || dataSource.title || `数据源${index + 1}`,
        value: key,
        description: dataSource.description || '',
        type: dataSource.type || dataSource.expectedDataFormat || 'object',
        originalData: dataSource
      }
    })
    return result
  }

  // 处理对象格式
  const result = Object.entries(props.dataSources).map(([key, dataSource]) => {
    return {
      label: dataSource.name || dataSource.title || key,
      value: key,
      description: dataSource.description || '',
      type: dataSource.type || dataSource.expectedDataFormat || 'object',
      originalData: dataSource
    }
  })
  return result
})

/**
 * 弹窗状态管理
 */
const showRawDataModal = ref(false)
const currentDataSourceKey = ref('')
// 🔥 修复：添加编辑模式状态
const isEditMode = ref(false)
const editingItemId = ref('')

/**
 * 导入导出状态管理
 */
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const isProcessingImportExport = ref(false)

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
 * 处理添加数据项按钮点击
 */
const handleAddDataItem = (dataSourceKey: string) => {
  currentDataSourceKey.value = dataSourceKey
  // 🔥 修复：重置为新增模式
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
    // 🔥 修复：设置为编辑模式
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

  // 🔥 使用新配置管理系统：内容哈希去重和版本控制
  // 重建完整配置并提交
  const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

  // 清除组件缓存，确保新策略生效
  simpleDataBridge.clearComponentCache(props.componentId)
  // 使用新配置管理系统更新配置（内置循环检测和去重）
  configurationManager.updateConfiguration(props.componentId, 'dataSource', rebuiltConfig)
}

/**
 * 更新数据源配置（合并策略变化时调用）
 */
const updateDataSourceConfiguration = (dataSourceKey: string) => {
  try {
    // 获取现有配置
    const existingConfig = configurationManager.getConfiguration(props.componentId)
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
        configurationManager.updateConfiguration(props.componentId, 'dataSource', currentDataSourceConfig)
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
const handleDataItemConfirm = (dataItemConfig: any) => {
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

    // 🔥 修复：根据模式进行新增或编辑
    let displayItem
    if (isEditMode.value && editingItemId.value) {
      // 编辑模式：查找并更新现有项
      const existingIndex = dataSourceItems[dataSourceKey].findIndex(item => item.id === editingItemId.value)
      if (existingIndex !== -1) {
        // 🔥 性能优化：使用结构化克隆或浅拷贝代替JSON深拷贝
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

    // 🔥 核心：根据当前所有数据项重新构建完整的 DataSourceConfiguration
    const dataSourceConfig = rebuildCompleteDataSourceConfiguration()

    // 🔥 新配置管理系统：内容哈希去重，避免无限循环
    configurationManager.updateConfiguration(props.componentId, 'dataSource', dataSourceConfig)

    // 关闭弹窗并重置状态
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    // 🔥 修复：重置编辑状态
    isEditMode.value = false
    editingItemId.value = ''
  } catch (error) {
    // 可以在这里添加用户友好的错误提示
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
      // 🔥 关键修复：优先使用完整的 httpConfigData，回退到基础配置
      // HTTP配置转换
      console.log('🔍 [convertToStandardDataItem] 处理HTTP配置:', JSON.stringify(dataItemConfig, null, 2))

      if (dataItemConfig.httpConfigData) {
        console.log('✅ [convertToStandardDataItem] 使用完整的httpConfigData分支')
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

        // 🔥 关键修复：保持params数组格式，因为DataItemFetcher期望数组格式
        if (httpConfigData.params && httpConfigData.params.length > 0) {
          // 直接保存数组格式，不转换为对象
          config.params = httpConfigData.params.filter(p => p.enabled && p.key) // 只保存启用且有key的param
        }

        // 🔥 关键修复：保存新增的HTTP配置字段
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
          config.pathParams = httpConfigData.pathParams
        }
        if (httpConfigData.pathParameter) {
          // 🔥 调试：监听pathParameter传递
          console.log(
            '🔍 [SimpleConfigurationEditor] pathParameter传递:',
            JSON.stringify(httpConfigData.pathParameter, null, 2)
          )
          config.pathParameter = httpConfigData.pathParameter
        }

        // 保存请求体
        if (httpConfigData.body) {
          config.body = httpConfigData.body
        }

        // 🔥 关键：保存脚本配置
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
        console.log('❌ [convertToStandardDataItem] 使用旧的基础配置格式分支（数据可能丢失）')
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
 * 🔥 新方法：基于当前所有显示数据项重建完整配置
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

  // 🔥 修复：遍历所有数据源，保留空数据源的结构
  for (const [sourceId, items] of Object.entries(dataSourceItems)) {
    // 转换数据项（如果有的话）
    const standardDataItems =
      items && items.length > 0
        ? items.map((item, index) => {
            const convertedItem = convertToStandardDataItem(item)
            const convertedProcessing = convertToProcessingConfig(item)
            // 🔥 性能优化：仅在开发环境输出详细调试信息

            return {
              item: convertedItem,
              processing: convertedProcessing
            }
          })
        : [] // 🔥 关键：空数据源也要保留，传空数组

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

    // 🔥 关键：即使数据项为空也要添加到配置中
    dataSources.push({
      sourceId,
      dataItems: standardDataItems,
      mergeStrategy
    })
  }
  // 🔍 最终调试：输出完整的配置以确认内容
  const finalConfig = {
    componentId: props.componentId,
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
  const config = configurationManager.getConfiguration(props.componentId)
  return config?.component?.polling || null
}

/**
 * 处理组件轮询配置变化
 * 将轮询配置保存到 component 配置中
 */
const handleComponentPollingConfigChange = (pollingConfig: any) => {
  try {
    // 获取当前组件配置
    const config = configurationManager.getConfiguration(props.componentId)
    const componentConfig = config?.component || {}
    // 更新组件轮询配置
    componentConfig.polling = {
      enabled: pollingConfig.enabled || false,
      interval: pollingConfig.interval || 30000,
      // 🔥 修复：正确保存 immediate 属性，允许为 false
      immediate: pollingConfig.immediate !== undefined ? pollingConfig.immediate : true,
      lastUpdated: Date.now()
    }

    // 保存到配置管理器
    configurationManager.updateConfiguration(props.componentId, 'component', componentConfig)
  } catch (error) {}
}

/**
 * 🚨 废弃：旧的构建方法（会导致重复添加问题）
 * 构建完整的 DataSourceConfiguration
 */
const buildDataSourceConfiguration_DEPRECATED = (
  dataSourceKey: string,
  dataItem: DataItem,
  processing: ProcessingConfig
): DataSourceConfiguration => {
  // 获取现有配置或创建新配置
  const existingConfig = configurationManager.getConfiguration(props.componentId)
  const currentDataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

  // 构建新的数据项
  const newDataItem = {
    item: dataItem,
    processing: processing
  }

  // 如果已有配置，则在现有数据源中添加数据项
  if (currentDataSourceConfig?.dataSources) {
    const existingDataSource = currentDataSourceConfig.dataSources.find(ds => ds.sourceId === dataSourceKey)

    if (existingDataSource) {
      // 添加到现有数据源
      existingDataSource.dataItems.push(newDataItem)
      return currentDataSourceConfig
    } else {
      // 创建新数据源
      const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }
      currentDataSourceConfig.dataSources.push({
        sourceId: dataSourceKey,
        dataItems: [newDataItem],
        mergeStrategy: strategy.type === 'script' ? { type: 'script', script: strategy.script } : strategy.type
      })
      currentDataSourceConfig.updatedAt = Date.now()
      return currentDataSourceConfig
    }
  } else {
    // 创建全新配置
    const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }
    return {
      componentId: props.componentId,
      dataSources: [
        {
          sourceId: dataSourceKey,
          dataItems: [newDataItem],
          mergeStrategy: strategy.type === 'script' ? { type: 'script', script: strategy.script } : strategy.type
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
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
      const existingConfig = configurationManager.getConfiguration(props.componentId)
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

          // 🔥 新配置管理系统：删除后重建完整配置
          const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

          // 清除组件缓存，确保删除后数据更新
          simpleDataBridge.clearComponentCache(props.componentId)
          // 🔥 使用新配置管理系统提交更新（内置去重和循环检测）
          configurationManager.updateConfiguration(props.componentId, 'dataSource', rebuiltConfig)
        }
      }
    } catch (error) {}
  }
}

/**
 * 从 ConfigurationManager 恢复数据项显示状态
 * 组件初始化或配置变化时调用
 */
const restoreDataItemsFromConfig = () => {
  try {
    const existingConfig = configurationManager.getConfiguration(props.componentId)
    const dataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

    if (dataSourceConfig?.dataSources) {
      // 清空现有显示状态
      Object.keys(dataSourceItems).forEach(key => {
        dataSourceItems[key] = []
      })
      // 🔥 修复：清空现有合并策略
      Object.keys(mergeStrategies).forEach(key => {
        delete mergeStrategies[key]
      })

      // 遍历配置中的数据源，恢复到显示状态
      dataSourceConfig.dataSources.forEach(dataSource => {
        const { sourceId, dataItems: configDataItems, mergeStrategy } = dataSource

        if (!dataSourceItems[sourceId]) {
          dataSourceItems[sourceId] = []
        }

        // 🔥 修复：恢复合并策略，避免无限循环
        mergeStrategies[sourceId] = mergeStrategy || { type: 'object' }
        // 将标准格式转换回显示格式
        configDataItems.forEach((configItem, index) => {
          const displayItem = convertConfigItemToDisplay(configItem, index)
          dataSourceItems[sourceId].push(displayItem)
        })
      })
    } else {
      // 如果没有配置，但有数据源选项，初始化空的数据项列表
      dataSourceOptions.value.forEach(option => {
        if (!dataSourceItems[option.value]) {
          dataSourceItems[option.value] = []
        }
        if (!mergeStrategies[option.value]) {
          mergeStrategies[option.value] = { type: 'object' }
        }
      })
    }
  } catch (error) {}
}

/**
 * 将配置格式的数据项转换为显示格式
 */
const convertConfigItemToDisplay = (configItem: any, index: number) => {
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

      // 🔥 关键修复：从原始配置中恢复httpConfigData
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
                isDynamic: false,
                dataType: 'string',
                variableName: '',
                description: ''
              }))
            : [],

          // 🔥 关键：恢复params数组格式
          params: item.config.params
            ? // 如果是数组格式（新格式），直接使用
              Array.isArray(item.config.params)
              ? item.config.params
              : // 如果是对象格式（旧格式），转换为数组
                Object.entries(item.config.params).map(([key, value]) => ({
                  key,
                  value: String(value),
                  enabled: true,
                  isDynamic: false,
                  dataType: 'string',
                  variableName: '',
                  description: ''
                }))
            : [],

          body: item.config.body
            ? typeof item.config.body === 'string'
              ? item.config.body
              : JSON.stringify(item.config.body)
            : '',

          // 🔥 关键：恢复脚本配置
          preRequestScript: item.config.preRequestScript || '',
          postResponseScript: item.config.postResponseScript || '',

          // 🔥 重大修复：恢复地址类型相关字段（这是数据不一致的根本原因）
          addressType: item.config.addressType || 'external',
          selectedInternalAddress: item.config.selectedInternalAddress || '',
          enableParams: item.config.enableParams || false,
          pathParams: item.config.pathParams || [],
          pathParameter: item.config.pathParameter
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
  return displayConfig
}

// 组件挂载时恢复显示状态并设置集成
onMounted(async () => {
  try {
    // 🔥 新架构：初始化配置集成桥接器
    await configurationManager.initialize()

    // 为当前组件设置数据源执行集成
    if ('setupComponentDataSourceIntegration' in configurationManager) {
      ;(configurationManager as any).setupComponentDataSourceIntegration(props.componentId)
    }

    // 🔥 修复：确保组件配置存在，如果不存在则初始化
    const existingConfig = configurationManager.getConfiguration(props.componentId)
    if (!existingConfig) {
      configurationManager.initializeConfiguration(props.componentId)
    } else {
    }

    // 恢复显示状态
    restoreDataItemsFromConfig()
  } catch (error) {
    // 降级处理：即使配置管理器初始化失败，也尝试恢复显示状态
    try {
      restoreDataItemsFromConfig()
    } catch (fallbackError) {}
  }
})

/**
 * 🔥 新增：获取当前编辑的数据项
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
 */
const getCurrentDataSourceExampleData = () => {
  if (!currentDataSourceKey.value) return undefined

  const currentDataSource = dataSourceOptions.value.find(opt => opt.value === currentDataSourceKey.value)
  // 🔥 修复：支持两种示例数据格式
  const exampleData = currentDataSource?.originalData?.config?.exampleData || currentDataSource?.originalData?.example
  return exampleData
}

// 🔥 新UI辅助方法

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

// 🔥 查看真实数据结果

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

    // 🔥 修复：使用配置管理系统获取最新配置，确保数据一致性
    const existingConfig = configurationManager.getConfiguration(props.componentId)
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
 * 🔥 导出配置为 JSON 文件
 */
const handleExportConfiguration = async () => {
  if (isProcessingImportExport.value) return

  try {
    isProcessingImportExport.value = true
    
    console.log(`📤 [SimpleConfigurationEditor] 开始导出组件配置: ${props.componentId}`)
    
    // 使用导出工具类导出配置
    const exportedConfig = await configurationExporter.exportConfiguration(
      props.componentId,
      configurationManager,
      props.componentType
    )
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `${props.componentType || 'component'}-config-${timestamp}.json`
    
    // 下载文件
    configurationExporter.downloadConfigurationAsJson(exportedConfig, filename)
    
    // 显示成功消息
    const stats = exportedConfig.metadata.statistics
    const message = `配置导出成功！包含 ${stats.dataSourceCount} 个数据源、${stats.httpConfigCount} 个HTTP配置、${stats.interactionCount} 个交互配置`
    
    dialog.success({
      title: '导出成功',
      content: message,
      positiveText: '确定'
    })
    
    console.log(`✅ [SimpleConfigurationEditor] 配置导出完成: ${filename}`)
    
  } catch (error) {
    console.error(`❌ [SimpleConfigurationEditor] 配置导出失败:`, error)
    
    dialog.error({
      title: '导出失败',
      content: `配置导出失败: ${error.message}`,
      positiveText: '确定'
    })
  } finally {
    isProcessingImportExport.value = false
  }
}

/**
 * 🔥 处理文件选择（导入）
 */
const handleImportFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  if (!file.name.endsWith('.json')) {
    dialog.error({
      title: '文件格式错误',
      content: '请选择 JSON 格式的配置文件',
      positiveText: '确定'
    })
    return
  }
  
  importFile.value = file
  showImportModal.value = true
  
  // 自动预览导入内容
  handlePreviewImport()
}

/**
 * 🔥 预览导入配置
 */
const handlePreviewImport = async () => {
  if (!importFile.value) return
  
  try {
    isProcessingImportExport.value = true
    
    console.log(`🔍 [SimpleConfigurationEditor] 开始预览导入文件: ${importFile.value.name}`)
    
    // 读取文件内容
    const fileContent = await readFileAsText(importFile.value)
    
    // 预览导入配置
    const preview = await configurationImporter.previewImport(
      fileContent,
      props.componentId,
      configurationManager,
      getAvailableComponents()
    )
    
    importPreview.value = preview
    
    console.log(`✅ [SimpleConfigurationEditor] 导入预览完成，可导入: ${preview.canImport}`)
    
  } catch (error) {
    console.error(`❌ [SimpleConfigurationEditor] 导入预览失败:`, error)
    
    dialog.error({
      title: '预览失败',
      content: `无法预览配置文件: ${error.message}`,
      positiveText: '确定'
    })
    
    importPreview.value = null
  } finally {
    isProcessingImportExport.value = false
  }
}

/**
 * 🔥 执行配置导入
 */
const handleConfirmImport = async () => {
  if (!importFile.value || !importPreview.value) return
  
  try {
    isProcessingImportExport.value = true
    
    console.log(`📥 [SimpleConfigurationEditor] 开始导入配置到组件: ${props.componentId}`)
    
    // 读取文件内容
    const fileContent = await readFileAsText(importFile.value)
    
    // 执行导入
    const result = await configurationImporter.importConfiguration(
      fileContent,
      props.componentId,
      configurationManager,
      {
        overwriteExisting: true,
        skipMissingDependencies: true
      }
    )
    
    if (result.success) {
      // 导入成功，刷新显示状态
      restoreDataItemsFromConfig()
      
      // 显示成功消息
      let successMessage = '配置导入成功！'
      if (result.warnings.length > 0) {
        successMessage += `\n注意事项：${result.warnings.join(', ')}`
      }
      
      dialog.success({
        title: '导入成功',
        content: successMessage,
        positiveText: '确定'
      })
      
      // 关闭导入弹窗
      showImportModal.value = false
      importFile.value = null
      importPreview.value = null
      
      console.log(`✅ [SimpleConfigurationEditor] 配置导入完成`)
    } else {
      // 导入失败
      dialog.error({
        title: '导入失败',
        content: `配置导入失败：${result.errors.join(', ')}`,
        positiveText: '确定'
      })
    }
    
  } catch (error) {
    console.error(`❌ [SimpleConfigurationEditor] 配置导入失败:`, error)
    
    dialog.error({
      title: '导入失败',
      content: `配置导入失败: ${error.message}`,
      positiveText: '确定'
    })
  } finally {
    isProcessingImportExport.value = false
  }
}

/**
 * 🔥 关闭导入弹窗
 */
const handleCancelImport = () => {
  showImportModal.value = false
  importFile.value = null
  importPreview.value = null
}

/**
 * 🔥 工具函数：读取文件为文本
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 🔥 获取可用组件列表（用于依赖验证）
 */
const getAvailableComponents = () => {
  // TODO: 从 Visual Editor 或其他组件管理器获取可用组件列表
  // 这里先返回空数组，后续可以集成实际的组件列表
  return []
}

/**
 * 🔥 触发文件选择
 */
const triggerFileInput = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = handleImportFileSelect
  input.click()
}

// 暴露方法给父组件
defineExpose({
  getCurrentConfig: () => props.modelValue,
  restoreDataItemsFromConfig,
  exportConfiguration: handleExportConfiguration,
  importConfiguration: triggerFileInput
})
</script>

<template>
  <div class="simple-configuration-editor">
    <!-- 🔥 配置操作工具栏 -->
    <div class="config-toolbar">
      <div class="toolbar-title">
        <span>{{ props.componentType || '组件' }}配置</span>
        <n-tag v-if="props.componentId" size="small" type="info">
          {{ props.componentId.slice(0, 8) }}...
        </n-tag>
      </div>
      
      <n-space>
        <!-- 导出配置按钮 -->
        <n-button
          size="small"
          type="primary"
          ghost
          :loading="isProcessingImportExport"
          @click="handleExportConfiguration"
        >
          <template #icon>
            <n-icon size="14">
              <DownloadOutlined />
            </n-icon>
          </template>
          导出配置
        </n-button>
        
        <!-- 导入配置按钮 -->
        <n-button
          size="small"
          type="success"
          ghost
          :loading="isProcessingImportExport"
          @click="triggerFileInput"
        >
          <template #icon>
            <n-icon size="14">
              <UploadOutlined />
            </n-icon>
          </template>
          导入配置
        </n-button>
      </n-space>
    </div>

    <!-- 组件级别轮询配置 -->
    <ComponentPollingConfig
      :component-id="props.componentId"
      :component-name="props.componentType"
      :preview-mode="props.previewMode"
      :initial-config="getComponentPollingConfig()"
      @config-change="handleComponentPollingConfigChange"
    />

    <!-- 数据源折叠面板 - accordion模式，每次只能展开一个 -->
    <n-collapse
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
                <div class="tooltip-title">
                  <n-icon size="14" style="margin-right: 4px">
                    <DocumentTextOutline />
                  </n-icon>
                  示例数据
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

          <!-- 查看结果按钮（底部） -->
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
      <n-drawer-content title="数据项配置" closable>
        <RawDataConfigModal
          :show="true"
          :data-source-key="currentDataSourceKey"
          :is-edit-mode="isEditMode"
          :edit-data="getEditData()"
          :example-data="getCurrentDataSourceExampleData()"
          :use-drawer-mode="true"
          @confirm="handleDataItemConfirm"
          @close="handleRawDataModalClose"
          @cancel="handleRawDataModalClose"
          @update:show="() => {}"
        />
      </n-drawer-content>
    </n-drawer>

    <!-- 🔥 导入预览弹窗 -->
    <n-modal
      v-model:show="showImportModal"
      preset="card"
      title="配置导入预览"
      style="width: 80vw; max-width: 800px;"
      :bordered="false"
      :closable="true"
      @close="handleCancelImport"
    >
      <div v-if="importPreview" class="import-preview">
        <!-- 配置概要信息 -->
        <n-card title="配置概要" size="small" class="preview-section">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item label="导出版本">
              {{ importPreview.summary.version }}
            </n-descriptions-item>
            <n-descriptions-item label="导出时间">
              {{ new Date(importPreview.summary.exportTime).toLocaleString() }}
            </n-descriptions-item>
            <n-descriptions-item label="原组件ID">
              <n-tag size="small">{{ importPreview.summary.originalComponentId }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="目标组件ID">
              <n-tag size="small" type="success">{{ props.componentId }}</n-tag>
            </n-descriptions-item>
          </n-descriptions>
          
          <div class="statistics">
            <n-space>
              <n-tag type="info">
                {{ importPreview.summary.statistics?.dataSourceCount || 0 }} 个数据源
              </n-tag>
              <n-tag type="success">
                {{ importPreview.summary.statistics?.httpConfigCount || 0 }} 个HTTP配置
              </n-tag>
              <n-tag type="warning">
                {{ importPreview.summary.statistics?.interactionCount || 0 }} 个交互配置
              </n-tag>
            </n-space>
          </div>
        </n-card>

        <!-- 依赖检查结果 -->
        <n-card title="依赖检查" size="small" class="preview-section">
          <div v-if="importPreview.dependencies.external.length === 0" class="no-dependencies">
            <n-tag type="success">✓ 无外部组件依赖</n-tag>
          </div>
          
          <div v-else>
            <div v-if="importPreview.dependencies.missing.length > 0" class="missing-dependencies">
              <n-alert type="error" title="缺失依赖组件" style="margin-bottom: 8px">
                以下组件在当前环境中不存在，可能导致部分功能无法正常工作：
              </n-alert>
              <n-space>
                <n-tag 
                  v-for="missing in importPreview.dependencies.missing" 
                  :key="missing" 
                  type="error"
                  size="small"
                >
                  {{ missing }}
                </n-tag>
              </n-space>
            </div>
            
            <div v-if="importPreview.dependencies.external.length > 0" class="external-dependencies">
              <div style="margin: 8px 0; font-size: 12px; color: var(--text-color-2)">外部组件依赖:</div>
              <n-space>
                <n-tag 
                  v-for="external in importPreview.dependencies.external" 
                  :key="external" 
                  type="info"
                  size="small"
                >
                  {{ external }}
                </n-tag>
              </n-space>
            </div>
          </div>
        </n-card>

        <!-- 冲突检查结果 -->
        <n-card title="配置冲突检查" size="small" class="preview-section">
          <div class="conflicts">
            <div class="conflict-item">
              <n-tag :type="importPreview.conflicts.dataSource ? 'warning' : 'success'" size="small">
                {{ importPreview.conflicts.dataSource ? '⚠️ 数据源配置存在冲突' : '✓ 数据源配置无冲突' }}
              </n-tag>
            </div>
            <div class="conflict-item">
              <n-tag :type="importPreview.conflicts.component ? 'warning' : 'success'" size="small">
                {{ importPreview.conflicts.component ? '⚠️ 组件配置存在冲突' : '✓ 组件配置无冲突' }}
              </n-tag>
            </div>
            <div class="conflict-item">
              <n-tag :type="importPreview.conflicts.interaction ? 'warning' : 'success'" size="small">
                {{ importPreview.conflicts.interaction ? '⚠️ 交互配置存在冲突' : '✓ 交互配置无冲突' }}
              </n-tag>
            </div>
          </div>
          
          <n-alert 
            v-if="importPreview.conflicts.dataSource || importPreview.conflicts.component || importPreview.conflicts.interaction" 
            type="warning" 
            style="margin-top: 8px"
          >
            检测到配置冲突，导入将覆盖现有配置。建议先导出当前配置作为备份。
          </n-alert>
        </n-card>

        <!-- 导入状态提示 -->
        <n-alert 
          v-if="!importPreview.canImport" 
          type="error" 
          title="无法导入"
          style="margin-top: 16px"
        >
          由于存在缺失的依赖组件或其他严重问题，当前配置无法安全导入。请检查并解决上述问题后重试。
        </n-alert>

        <n-alert 
          v-else-if="importPreview.dependencies.missing.length > 0"
          type="warning" 
          title="可以导入但有警告"
          style="margin-top: 16px"
        >
          配置可以导入，但部分依赖组件缺失。导入后涉及这些组件的功能可能无法正常工作。
        </n-alert>

        <n-alert 
          v-else
          type="success" 
          title="可以安全导入"
          style="margin-top: 16px"
        >
          所有检查通过，配置可以安全导入到当前组件。
        </n-alert>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="isProcessingImportExport" class="loading-preview">
        <n-spin size="large">
          <div style="text-align: center; padding: 40px;">
            <div>正在分析配置文件...</div>
          </div>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <div v-else class="error-preview">
        <n-empty description="无法预览配置文件，请检查文件格式是否正确" />
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancelImport">取消</n-button>
          <n-button
            v-if="importPreview?.canImport || (importPreview && importPreview.dependencies.missing.length > 0)"
            type="warning" 
            :loading="isProcessingImportExport"
            @click="handleConfirmImport"
          >
            {{ importPreview?.dependencies.missing.length > 0 ? '强制导入' : '确认导入' }}
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

/* 🔥 配置工具栏样式 */
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

/* 🔥 导入预览弹窗样式 */
.import-preview {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.statistics {
  margin-top: 12px;
}

.conflicts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conflict-item {
  display: flex;
  align-items: center;
}

.no-dependencies {
  text-align: center;
  padding: 8px;
}

.missing-dependencies {
  margin-bottom: 12px;
}

.external-dependencies {
  margin-top: 8px;
}

.loading-preview,
.error-preview {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

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

/* 示例数据提示框样式 */
.example-data-tooltip {
  max-width: 400px;
}

.tooltip-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--info-color);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
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
