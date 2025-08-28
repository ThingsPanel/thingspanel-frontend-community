<!--
  简易配置系统 - 替代复杂UI组件的轻量级配置编辑器
  实现可视化数据源配置，支持JSON/HTTP/Script三种类型
-->
<script setup lang="ts">
/**
 * SimpleConfigurationEditor - 简易配置编辑器
 * 基于SUBTASK-010要求，实现轻量级可视化配置界面
 */

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  createExecutorChain,
  type DataSourceConfiguration,
  type DataSource,
  type DataItem,
  type ProcessingConfig
} from '../index'
import { type MergeStrategy } from '../executors/DataSourceMerger'
import RawDataConfigModal from './modals/RawDataConfigModal.vue'
import DataSourceMergeStrategyEditor from './DataSourceMergeStrategyEditorSimple.vue'
import { configurationManager } from '@/components/visual-editor/configuration/ConfigurationManager'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

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
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  dataSources: () => []
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

/**
 * 处理数据源选项 - 兼容数组和对象格式
 */
const dataSourceOptions = computed(() => {
  if (!props.dataSources) return []

  // 处理数组格式
  if (Array.isArray(props.dataSources)) {
    return props.dataSources.map((dataSource, index) => {
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
  return Object.entries(props.dataSources).map(([key, dataSource]) => ({
    label: dataSource.name || dataSource.title || key,
    value: key,
    description: dataSource.description || '',
    type: dataSource.type || dataSource.expectedDataFormat || 'object',
    originalData: dataSource
  }))
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
  console.log('点击添加数据项:', dataSourceKey)
}

/**
 * 处理编辑数据项
 */
const handleEditDataItem = (dataSourceKey: string, itemId: string) => {
  console.log('点击编辑数据项:', dataSourceKey, itemId)
  currentDataSourceKey.value = dataSourceKey

  // 找到要编辑的数据项
  const item = dataSourceItems[dataSourceKey]?.find(item => item.id === itemId)
  if (item) {
    console.log('找到要编辑的数据项:', item)
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
  console.log(`📝 [SimpleConfigurationEditor] 合并策略已更新: ${dataSourceKey}`, strategy)

  // 🔥 关键修复：合并策略更新后重建完整配置
  const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

  // 清除组件缓存，确保新策略生效
  simpleDataBridge.clearComponentCache(props.componentId)
  console.log(`🧹 [SimpleConfigurationEditor] 已清除组件缓存: ${props.componentId}`)

  // 提交重建的配置
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

        console.log('✅ 合并策略配置已提交到配置管理器:', {
          componentId: props.componentId,
          dataSourceKey,
          strategy: mergeStrategies[dataSourceKey]
        })
      }
    }
  } catch (error) {
    console.error('❌ 更新合并策略配置失败:', error)
  }
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
        // 🔥 修复：深度克隆配置避免对象引用共享
        displayItem = {
          id: editingItemId.value,
          ...JSON.parse(JSON.stringify(dataItemConfig)), // 深度克隆避免引用共享
          createdAt: dataSourceItems[dataSourceKey][existingIndex].createdAt, // 保持原创建时间
          updatedAt: new Date().toISOString() // 添加更新时间
        }
        dataSourceItems[dataSourceKey][existingIndex] = displayItem
        console.log('✏️ [SimpleConfigurationEditor] 编辑模式：更新现有数据项', displayItem)
      } else {
        console.error('❌ 编辑模式下未找到对应数据项:', editingItemId.value)
        return
      }
    } else {
      // 新增模式：添加新项
      displayItem = {
        id: Date.now().toString(),
        ...JSON.parse(JSON.stringify(dataItemConfig)), // 深度克隆避免引用共享
        createdAt: new Date().toISOString()
      }
      dataSourceItems[dataSourceKey].push(displayItem)
      console.log('➕ [SimpleConfigurationEditor] 新增模式：添加新数据项', displayItem)
    }

    // 🔥 核心：根据当前所有数据项重新构建完整的 DataSourceConfiguration
    const dataSourceConfig = rebuildCompleteDataSourceConfiguration()

    // 调用 configurationManager 更新配置 - 触发配置驱动链路
    configurationManager.updateConfiguration(props.componentId, 'dataSource', dataSourceConfig)

    // 关闭弹窗并重置状态
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    // 🔥 修复：重置编辑状态
    isEditMode.value = false
    editingItemId.value = ''

    console.log('✅ 数据项配置已提交到配置管理器:', {
      componentId: props.componentId,
      dataSourceKey,
      dataSourceConfig
    })
  } catch (error) {
    console.error('❌ 数据项配置提交失败:', error)
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
        ? items.map(item => ({
            item: convertToStandardDataItem(item),
            processing: convertToProcessingConfig(item)
          }))
        : [] // 🔥 关键：空数据源也要保留，传空数组

    // 获取合并策略
    const strategy = mergeStrategies[sourceId] || { type: 'object' }
    let mergeStrategy: MergeStrategy
    
    if (strategy.type === 'script') {
      mergeStrategy = { type: 'script', script: strategy.script }
    } else if (strategy.type === 'select') {
      mergeStrategy = { type: 'select', selectedIndex: strategy.selectedIndex }
      console.log(`🔍 [SimpleConfigurationEditor] 构建select策略: sourceId=${sourceId}, selectedIndex=${strategy.selectedIndex}`)
    } else {
      mergeStrategy = { type: strategy.type }
    }

    // 🔥 关键：即使数据项为空也要添加到配置中
    dataSources.push({
      sourceId,
      dataItems: standardDataItems,
      mergeStrategy
    })

    console.log(`📝 [rebuildConfig] 数据源 ${sourceId}: ${standardDataItems.length} 个数据项`)
  }

  console.log('🔄 [SimpleConfigurationEditor] 重建完整配置:', {
    componentId: props.componentId,
    dataSourcesCount: dataSources.length,
    totalItems: dataSources.reduce((sum, ds) => sum + ds.dataItems.length, 0)
  })

  return {
    componentId: props.componentId,
    dataSources,
    createdAt: timestamp,
    updatedAt: timestamp
  }
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
            console.log(`📝 [SimpleConfigurationEditor] 数据源 ${dataSourceKey} 的所有数据项已删除，保留空数据源配置`)
          }

          // 更新时间戳
          currentDataSourceConfig.updatedAt = Date.now()

          // 🔥 关键修复：删除后重建完整配置确保同步
          const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

          // 清除组件缓存，确保删除后数据更新
          simpleDataBridge.clearComponentCache(props.componentId)
          console.log(`🧹 [SimpleConfigurationEditor] 删除数据项后已清除组件缓存: ${props.componentId}`)

          // 📝 调试：打印删除后的完整配置
          console.log('🔍 [DEBUG] 删除操作完成后重建的配置:', JSON.stringify(rebuiltConfig, null, 2))

          // 提交配置更新
          configurationManager.updateConfiguration(props.componentId, 'dataSource', rebuiltConfig)

          console.log('✅ 数据项删除已提交到配置管理器:', {
            componentId: props.componentId,
            dataSourceKey,
            itemId,
            remainingDataSources: currentDataSourceConfig.dataSources.map(ds => ({
              sourceId: ds.sourceId,
              dataItemsCount: ds.dataItems.length
            }))
          })
        }
      }
    } catch (error) {
      console.error('❌ 数据项删除失败:', error)
      // 错误回滚：恢复本地显示状态
      // 这里可以添加回滚逻辑
    }
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
        console.log(`✅ [SimpleConfigurationEditor] 恢复合并策略: ${sourceId}`, mergeStrategies[sourceId])

        // 将标准格式转换回显示格式
        configDataItems.forEach((configItem, index) => {
          const displayItem = convertConfigItemToDisplay(configItem, index)
          dataSourceItems[sourceId].push(displayItem)
        })
      })

      console.log('✅ 数据项显示状态恢复完成:', dataSourceItems)
    }
  } catch (error) {
    console.error('❌ 数据项显示状态恢复失败:', error)
  }
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

// 组件挂载时恢复显示状态
onMounted(() => {
  restoreDataItemsFromConfig()
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
  console.log('🔍 [SimpleConfigurationEditor] 获取编辑数据:', editItem)
  return editItem
}

// 暴露方法给父组件
defineExpose({
  getCurrentConfig: () => props.modelValue,
  restoreDataItemsFromConfig
})
</script>

<template>
  <div class="simple-configuration-editor">
    <!-- 数据源信息提示 -->
    <n-alert type="info" :show-icon="false" class="info-alert" style="margin-bottom: 16px">
      <template #icon><span>💾</span></template>
      <div>
        <strong>简易数据源配置</strong>
        <p class="alert-description">
          为每个数据源配置数据项和处理方式。当前有 {{ dataSourceOptions.length }} 个数据源需要配置。
        </p>
      </div>
    </n-alert>

    <!-- 数据源折叠面板 -->
    <n-collapse
      :default-expanded-names="dataSourceOptions.length > 0 ? [dataSourceOptions[0].value] : []"
      class="data-source-collapse"
    >
      <n-collapse-item
        v-for="dataSourceOption in dataSourceOptions"
        :key="dataSourceOption.value"
        :title="dataSourceOption.label"
        :name="dataSourceOption.value"
      >
        <!-- 数据源配置内容 -->
        <div class="simple-data-source-panel">
          <!-- 添加数据项按钮 - 置顶 -->
          <div class="add-data-item-section-top">
            <n-button
              type="primary"
              size="small"
              secondary
              @click="handleAddDataItem(dataSourceOption.value)"
            >
              <template #icon>
                <span>➕</span>
              </template>
              添加数据项
            </n-button>
            <n-text 
              v-if="dataSourceItems[dataSourceOption.value]?.length === 0" 
              style="font-size: 11px; color: var(--text-color-3); margin-left: 8px"
            >
              为此数据源添加第一个数据项
            </n-text>
          </div>

          <!-- 已配置的数据项列表 -->
          <div v-if="dataSourceItems[dataSourceOption.value]?.length > 0" class="data-items-list">
            <div class="data-items-header">
              <span class="items-title">已配置数据项 ({{ dataSourceItems[dataSourceOption.value].length }})</span>
            </div>

            <div class="data-items-content">
              <div v-for="item in dataSourceItems[dataSourceOption.value]" :key="item.id" class="data-item-card">
                <div class="item-info">
                  <div class="item-type-badge">
                    <n-tag
                      :type="item.type === 'json' ? 'info' : item.type === 'script' ? 'warning' : 'success'"
                      size="small"
                    >
                      {{ item.type === 'json' ? 'JSON数据' : item.type === 'script' ? 'JavaScript脚本' : 'HTTP接口' }}
                    </n-tag>
                  </div>
                  <div class="item-summary">
                    <span v-if="item.type === 'json'" class="summary-text">
                      {{ item.jsonData ? 'JSON数据已配置' : '空数据' }}
                    </span>
                    <span v-else-if="item.type === 'script'" class="summary-text">
                      {{ item.scriptCode ? 'JavaScript脚本已配置' : '空脚本' }}
                    </span>
                    <span v-else-if="item.type === 'http'" class="summary-text">
                      {{ item.url || 'HTTP接口配置' }}
                    </span>
                  </div>
                </div>

                <div class="item-processing">
                  <span v-if="item.processingConfig?.jsonPath" class="processing-info">
                    过滤: {{ item.processingConfig.jsonPath }}
                  </span>
                  <span v-if="item.processingConfig?.scriptCode" class="processing-info">脚本处理</span>
                </div>

                <div class="item-actions">
                  <n-space size="small">
                    <n-button
                      size="tiny"
                      type="primary"
                      secondary
                      @click="handleEditDataItem(dataSourceOption.value, item.id)"
                    >
                      编辑
                    </n-button>
                    <n-button
                      size="tiny"
                      type="error"
                      secondary
                      @click="handleDeleteDataItem(dataSourceOption.value, item.id)"
                    >
                      删除
                    </n-button>
                  </n-space>
                </div>
              </div>
            </div>
          </div>

          <!-- 🆕 合并策略配置 - 有数据项时就显示（包含单个数据项） -->
          <div
            v-if="dataSourceItems[dataSourceOption.value]?.length >= 1"
            class="merge-strategy-section"
            style="margin-top: 16px"
          >
            <DataSourceMergeStrategyEditor
              :data-source-id="dataSourceOption.label"
              :data-item-count="dataSourceItems[dataSourceOption.value]?.length || 0"
              :model-value="mergeStrategies[dataSourceOption.value] || { type: 'object' }"
              @update:model-value="handleMergeStrategyUpdate(dataSourceOption.value, $event)"
            />
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

    <!-- 原始数据配置弹窗 -->
    <RawDataConfigModal
      v-model:show="showRawDataModal"
      :data-source-key="currentDataSourceKey"
      :is-edit-mode="isEditMode"
      :edit-data="getEditData()"
      @confirm="handleDataItemConfirm"
    />
  </div>
</template>

<style scoped>
.simple-configuration-editor {
  width: 100%;
}

/* 数据项列表样式 */
.data-items-list {
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.data-items-header {
  background: var(--card-color);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.items-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.data-items-content {
  padding: 8px;
  background: var(--body-color);
}

/* 数据项卡片样式 */
.data-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  transition: all 0.2s;
}

.data-item-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.data-item-card:last-child {
  margin-bottom: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-type-badge {
  flex-shrink: 0;
}

.summary-text {
  font-size: 12px;
  color: var(--text-color-2);
}

.item-processing {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin: 0 12px;
}

.processing-info {
  font-size: 11px;
  color: var(--success-color);
  background: var(--success-color-suppl);
  padding: 2px 6px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.item-actions {
  flex-shrink: 0;
}

/* 添加按钮区域样式 - 置顶版本 */
.add-data-item-section-top {
  display: flex;
  align-items: center;
  padding: 8px 0 12px 0;
  border-bottom: 1px solid var(--divider-color);
  margin-bottom: 12px;
}

/* 🆕 合并策略编辑器样式 */
.merge-strategy-section {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--body-color);
  padding: 0;
  overflow: hidden;
}

.merge-strategy-section:hover {
  border-color: var(--primary-color-hover);
  background: var(--primary-color-suppl);
}

/* 空状态样式 */
.info-alert .alert-description {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--text-color-2);
}

/* 数据源面板样式 */
.simple-data-source-panel {
  padding: 12px 0;
}

/* 折叠面板自定义 */
.data-source-collapse {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.data-source-collapse :deep(.n-collapse-item) {
  border: none;
}

.data-source-collapse :deep(.n-collapse-item:not(:last-child)) {
  border-bottom: 1px solid var(--divider-color);
}

.data-source-collapse :deep(.n-collapse-item__header) {
  background: var(--card-color);
  padding: 12px 16px;
  font-weight: 500;
}

.data-source-collapse :deep(.n-collapse-item__content-wrapper) {
  background: var(--body-color);
}

.data-source-collapse :deep(.n-collapse-item__content-inner) {
  padding: 16px;
}

.info-alert .alert-description {
  margin: 8px 0 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.data-source-collapse {
  border-radius: 6px;
}

.simple-data-source-panel {
  padding: 4px 0;
}

.add-data-item-section {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
