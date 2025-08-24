/**
 * 数据源配置管理 Composable
 * 提取 DataSourceConfigForm 中的核心逻辑
 */

import { ref, reactive, computed, watch } from 'vue'
import type { DataSource, DataSourceValue, FinalProcessingType } from '../types'

export interface UseDataSourceConfigOptions {
  dataSources: DataSource[]
  selectedWidgetId?: string
  onConfigUpdate?: (config: any) => void
}

export function useDataSourceConfig(options: UseDataSourceConfigOptions) {
  const { dataSources, selectedWidgetId, onConfigUpdate } = options

  // 🔥 核心状态管理
  const dataValues = reactive<Record<string, DataSourceValue>>({})
  const isInitializing = ref(false)
  const isUpdatingConfig = ref(false)

  // 🆕 处理状态管理
  const finalProcessingStatus = reactive<
    Record<
      string,
      {
        loading: boolean
        error?: string
        lastUpdateTime?: Date
      }
    >
  >({})

  const processingPreviewStatus = reactive<
    Record<
      string,
      {
        loading: boolean
        error?: string
        dataCount: number
      }
    >
  >({})

  // 🔥 计算属性：内部配置状态
  const internalConfig = computed({
    get: () => {
      const dataSourceBindings: Record<string, any> = {}

      dataSources.forEach(dataSource => {
        const dataSourceValue = dataValues[dataSource.key]
        if (dataSourceValue) {
          dataSourceBindings[dataSource.key] = {
            rawData: dataSourceValue.currentData ? JSON.stringify(dataSourceValue.currentData) : '{}',
            enhancedConfig: {
              rawDataList: dataSourceValue.rawDataList || [],
              metadata: {
                hasRawDataList: (dataSourceValue.rawDataList?.length || 0) > 0,
                rawDataCount: dataSourceValue.rawDataList?.length || 0,
                lastUpdated: new Date().toISOString(),
                version: '2.1'
              },
              dataSourceInfo: {
                key: dataSource.key,
                name: dataSource.name,
                description: dataSource.description,
                fieldMappings: dataSource.fieldMappings,
                fieldsToMap: dataSource.fieldsToMap
              }
            }
          }
        }
      })

      return {
        dataSourceBindings,
        systemConfig: {
          version: '2.1',
          features: ['rawDataManagement', 'scriptProcessing', 'dataFiltering'],
          lastConfigUpdate: new Date().toISOString(),
          selectedWidgetId
        }
      }
    },
    set: value => {
      // 触发外部更新
      if (onConfigUpdate) {
        const enhancedConfig = {
          type: 'data-source-bindings',
          enabled: true,
          config: value,
          metadata: {
            componentType: 'dual-data-display',
            updatedAt: Date.now(),
            source: 'data-source-config-form'
          }
        }
        onConfigUpdate(enhancedConfig)
      }
    }
  })

  // 🔥 核心方法：更新数据源
  const updateDataSource = (key: string, updates: Partial<DataSourceValue>) => {
    if (!dataValues[key]) {
      dataValues[key] = createDefaultDataSourceValue()
    }
    Object.assign(dataValues[key], updates)
  }

  // 🔥 核心方法：获取或初始化数据源状态
  const getOrInitDataSource = (key: string): DataSourceValue => {
    if (!dataValues[key]) {
      dataValues[key] = createDefaultDataSourceValue()
    }
    return dataValues[key]
  }

  // 🔥 核心方法：创建默认数据源值
  const createDefaultDataSourceValue = (): DataSourceValue => {
    return {
      currentData: null,
      rawDataList: [],
      finalProcessingType: 'custom-script',
      finalProcessingScript: 'return processedDataList',
      finalProcessingConfig: {},
      selectedDataItemIndex: 0
    }
  }

  // 🔥 核心方法：更新最终处理类型
  const updateFinalProcessingType = (dataSourceKey: string, type: FinalProcessingType) => {
    const dataSourceValue = getOrInitDataSource(dataSourceKey)
    dataSourceValue.finalProcessingType = type

    // 根据类型设置默认脚本
    if (type !== 'custom-script') {
      const defaultScripts = {
        'merge-object': 'return Object.assign({}, ...processedDataList)',
        'concat-array': 'return processedDataList.flat()',
        'select-specific': 'return processedDataList[0] // 使用第一个数据项'
      }
      dataSourceValue.finalProcessingScript = defaultScripts[type] || 'return processedDataList'
    }

    // 重新计算最终数据
    updateFinalData(dataSourceKey)
  }

  // 🔥 核心方法：更新最终处理脚本
  const updateFinalProcessingScript = (dataSourceKey: string, script: string) => {
    const dataSourceValue = getOrInitDataSource(dataSourceKey)
    dataSourceValue.finalProcessingScript = script

    // 重新计算最终数据
    updateFinalData(dataSourceKey)
  }

  // 🔥 核心方法：更新选中的数据项索引
  const updateSelectedDataItemIndex = (dataSourceKey: string, index: number) => {
    const dataSourceValue = getOrInitDataSource(dataSourceKey)
    dataSourceValue.selectedDataItemIndex = index

    // 重新计算最终数据
    updateFinalData(dataSourceKey)
  }

  // 🔥 核心方法：获取数据项选择器选项
  const getDataItemSelectOptions = (dataSourceKey: string) => {
    const dataSourceValue = dataValues[dataSourceKey]
    if (!dataSourceValue?.rawDataList) return []

    return dataSourceValue.rawDataList.map((item, index) => ({
      label: `${index}: ${item.name} (${item.type})`,
      value: index
    }))
  }

  // 🔥 核心方法：获取选中数据项预览
  const getSelectedDataItemPreview = (dataSourceKey: string) => {
    const dataSourceValue = dataValues[dataSourceKey]
    if (!dataSourceValue?.rawDataList?.length) return '暂无数据项'

    const selectedIndex = dataSourceValue.selectedDataItemIndex ?? 0
    const selectedItem = dataSourceValue.rawDataList[selectedIndex]

    if (!selectedItem) return '选择的数据项不存在'

    try {
      return JSON.stringify(selectedItem.data, null, 2)
    } catch {
      return JSON.stringify(selectedItem, null, 2)
    }
  }

  // 🔥 核心方法：重置数据源
  const resetDataSource = (dataSourceKey: string) => {
    const defaultData = getDefaultData(dataSourceKey)
    updateDataSource(dataSourceKey, {
      currentData: defaultData,
      rawDataList: [],
      finalProcessingType: 'custom-script',
      finalProcessingScript: 'return processedDataList',
      finalProcessingConfig: {},
      selectedDataItemIndex: 0
    })

    triggerConfigUpdate()
  }

  // 🔥 核心方法：获取默认数据
  const getDefaultData = (dataSourceKey: string) => {
    const dataSource = dataSources.find(ds => ds.key === dataSourceKey)
    if (!dataSource) return {}

    // 优先从 fieldMappings 中获取 defaultValue
    if (dataSource.fieldMappings) {
      const targetFieldMapping = Object.values(dataSource.fieldMappings).find(
        (mapping: any) => mapping.targetField === dataSourceKey || mapping.type
      )

      if (targetFieldMapping && targetFieldMapping.defaultValue !== undefined) {
        return targetFieldMapping.defaultValue
      }
    }

    return {}
  }

  // 🔥 核心方法：触发配置更新
  const triggerConfigUpdate = () => {
    if (isInitializing.value || isUpdatingConfig.value) {
      console.log('⏸️ [ConfigUpdate] 防止循环更新，跳过配置更新')
      return
    }

    isUpdatingConfig.value = true

    try {
      const currentConfig = internalConfig.value
      console.log('🔄 [DataSourceConfigForm] 触发配置更新:', currentConfig)

      // 通过 setter 触发更新
      internalConfig.value = { ...currentConfig }
      console.log('📤 [DataSourceConfigForm] 通过v-model setter发送配置更新')
    } finally {
      isUpdatingConfig.value = false
    }
  }

  // 🔥 核心方法：更新最终数据（占位符，需要实现）
  const updateFinalData = async (dataSourceKey: string) => {
    // TODO: 实现最终数据更新逻辑
    console.log(`🔧 [FinalProcessing] 更新最终数据: ${dataSourceKey}`)

    // 这里应该调用数据处理逻辑
    // 暂时只触发配置更新
    triggerConfigUpdate()
  }

  // 🔥 初始化方法
  const initialize = () => {
    if (isInitializing.value) {
      console.log('🚫 [DataSourceConfigForm] 正在初始化中，跳过重复调用')
      return
    }

    isInitializing.value = true

    try {
      console.log('🔧 [DataSourceConfigForm] 初始化数据源数据')

      // 为每个数据源创建默认值
      dataSources.forEach(dataSource => {
        if (!dataValues[dataSource.key]) {
          dataValues[dataSource.key] = createDefaultDataSourceValue()
        }
      })

      // 触发初始配置更新
      triggerConfigUpdate()
    } finally {
      setTimeout(() => {
        isInitializing.value = false
        console.log('🔓 [DataSourceConfigForm] 初始化完成')
      }, 100)
    }
  }

  // 🔥 监听数据源变化
  watch(
    () => dataSources.length,
    (newLength, oldLength) => {
      if (newLength !== oldLength) {
        console.log('🔄 [DataSourceConfigForm] 数据源数量变化，重新初始化')
        initialize()
      }
    }
  )

  return {
    // 状态
    dataValues,
    isInitializing,
    isUpdatingConfig,
    finalProcessingStatus,
    processingPreviewStatus,

    // 计算属性
    internalConfig,

    // 方法
    updateDataSource,
    getOrInitDataSource,
    createDefaultDataSourceValue,
    updateFinalProcessingType,
    updateFinalProcessingScript,
    updateSelectedDataItemIndex,
    getDataItemSelectOptions,
    getSelectedDataItemPreview,
    resetDataSource,
    getDefaultData,
    triggerConfigUpdate,
    updateFinalData,
    initialize
  }
}
