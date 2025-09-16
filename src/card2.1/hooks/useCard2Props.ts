/**
 * 🔥 Card 2.1 统一配置管理中心 - 全新重构版本
 * 
 * 核心职责：
 * 1. 作为唯一的配置数据源头
 * 2. 管理基础、组件、数据源、交互四层配置
 * 3. 提供配置更新和事件通信机制
 * 4. 与编辑器保持配置同步
 */

import { computed, ref, watch, inject, type ComputedRef, isRef } from 'vue'
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'
import type { MetricItem } from '@/card2.1/core/types'

/**
 * 基础配置接口 - 定义通用的基础配置结构
 */
export interface BaseConfiguration {
  // 设备绑定配置（最高优先级）
  deviceId?: string
  metricsList?: MetricItem[]
  // UI基础配置
  title?: string
  showTitle?: boolean
  visible?: boolean
  opacity?: number
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double'
  borderRadius?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  margin?: { top: number; right: number; bottom: number; left: number }
}

/**
 * 统一配置接口 - 四层配置结构
 */
export interface UnifiedCard2Configuration {
  /** 基础配置 - 设备绑定、UI样式等通用配置 */
  base?: BaseConfiguration
  /** 组件配置 - 组件特定的属性和设置 */
  component?: Record<string, unknown>
  /** 数据源配置 - 数据绑定和来源配置 */
  dataSource?: Record<string, unknown>
  /** 交互配置 - 组件间交互和行为配置 */
  interaction?: Record<string, unknown>
  /** 组件ID - 用于配置管理和持久化 */
  componentId?: string
}

/**
 * 配置管理选项
 */
interface ConfigManagementOptions {
  config: any
  data?: Record<string, unknown> | ComputedRef<Record<string, unknown>>
  componentId?: string
  /** 从编辑器接收的初始统一配置 */
  initialUnifiedConfig?: UnifiedCard2Configuration
}

/**
 * 🔥 统一配置管理中心 Hook
 */
export function useCard2Props<T = Record<string, unknown>>(options: ConfigManagementOptions) {
  const { config, data, componentId, initialUnifiedConfig } = options
  
  // 注入编辑器上下文用于同步
  const editorContext = inject('editorContext', null) as any
  
  console.log(`🔥 [useCard2Props] 初始化统一配置管理 ${componentId}:`, {
    hasInitialConfig: !!initialUnifiedConfig,
    initialConfig: initialUnifiedConfig,
    componentConfigFromInitial: initialUnifiedConfig?.component,
    baseConfigFromInitial: initialUnifiedConfig?.base
  })

  // 🔥 统一配置状态 - 唯一的配置数据源
  const unifiedConfig = ref<UnifiedCard2Configuration>({
    // 基础配置：设备绑定、UI样式等通用配置
    base: {
      // 设备绑定配置（最高优先级）
      deviceId: initialUnifiedConfig?.base?.deviceId || '',
      metricsList: initialUnifiedConfig?.base?.metricsList || [],
      // UI基础配置
      title: initialUnifiedConfig?.base?.title || '',
      showTitle: initialUnifiedConfig?.base?.showTitle || false,
      visible: initialUnifiedConfig?.base?.visible ?? true,
      opacity: initialUnifiedConfig?.base?.opacity ?? 1,
      backgroundColor: initialUnifiedConfig?.base?.backgroundColor,
      borderWidth: initialUnifiedConfig?.base?.borderWidth || 0,
      borderColor: initialUnifiedConfig?.base?.borderColor || '#d9d9d9',
      borderStyle: initialUnifiedConfig?.base?.borderStyle || 'solid',
      borderRadius: initialUnifiedConfig?.base?.borderRadius || 6,
      padding: initialUnifiedConfig?.base?.padding || { top: 0, right: 0, bottom: 0, left: 0 },
      margin: initialUnifiedConfig?.base?.margin || { top: 0, right: 0, bottom: 0, left: 0 }
    },
    // 组件配置：来自settingConfig的组件特有属性
    component: initialUnifiedConfig?.component || { ...config },
    // 数据源配置：数据绑定配置
    dataSource: initialUnifiedConfig?.dataSource || {},
    // 交互配置：组件间交互配置
    interaction: initialUnifiedConfig?.interaction || {},
    componentId
  })

  // 🔥 配置变更回调函数
  let configChangeCallback: ((config: UnifiedCard2Configuration) => void) | null = null

  /**
   * 🔥 按层级更新配置 - 核心配置管理函数
   */
  const updateConfig = (layer: keyof UnifiedCard2Configuration, newConfig: any) => {
    console.log(`🔥 [useCard2Props] 更新配置层 ${layer}:`, newConfig)
    console.log(`🔥 [useCard2Props] 更新前配置:`, unifiedConfig.value[layer])
    
    // 🔥 强制响应式更新 - 深度合并并触发响应
    const updatedLayer = { ...unifiedConfig.value[layer], ...newConfig }
    unifiedConfig.value = {
      ...unifiedConfig.value,
      [layer]: updatedLayer
    }
    
    console.log(`🔥 [useCard2Props] 更新后配置:`, unifiedConfig.value[layer])
    console.log(`🔥 [useCard2Props] 新的displayData:`, displayData.value)
    
    // 同步到编辑器
    syncToEditor()
    
    // 触发配置变更事件
    emitConfigChange()
  }

  /**
   * 🔥 批量更新配置
   */
  const updateUnifiedConfig = (partialConfig: Partial<UnifiedCard2Configuration>) => {
    console.log(`🔥 [useCard2Props] 批量更新配置:`, partialConfig)
    
    unifiedConfig.value = {
      ...unifiedConfig.value,
      ...partialConfig
    }
    
    syncToEditor()
    emitConfigChange()
  }

  /**
   * 🔥 同步配置到编辑器
   */
  const syncToEditor = () => {
    if (!editorContext?.updateNode || !componentId) return

    const currentNode = editorContext.getNodeById(componentId)
    if (!currentNode) return

    // 防止循环更新
    const currentUnifiedConfig = currentNode.metadata?.unifiedConfig
    if (JSON.stringify(currentUnifiedConfig) === JSON.stringify(unifiedConfig.value)) return

    console.log(`🔥 [useCard2Props] 同步配置到编辑器 ${componentId}`)
    
    editorContext.updateNode(componentId, {
      properties: unifiedConfig.value.component || {},
      metadata: {
        ...currentNode.metadata,
        unifiedConfig: unifiedConfig.value,
        updatedAt: Date.now()
      }
    })
  }

  /**
   * 🔥 设置配置变更回调
   */
  const setConfigChangeCallback = (callback: (config: UnifiedCard2Configuration) => void) => {
    configChangeCallback = callback
  }

  /**
   * 🔥 触发配置变更事件
   */
  const emitConfigChange = () => {
    if (configChangeCallback) {
      configChangeCallback({ ...unifiedConfig.value })
    }
  }

  /**
   * 🔥 获取完整配置
   */
  const getFullConfiguration = (): UnifiedCard2Configuration => {
    return { ...unifiedConfig.value }
  }

  /**
   * 🔥 简化版显示数据计算 - 直接传递数据源执行结果
   */
  const displayData = computed(() => {
    // 🔥 关键修复：正确获取data值，无论它是响应式引用还是普通值
    const currentData = isRef(data) || (typeof data === 'object' && data !== null && '__v_isRef' in data)
      ? (data as ComputedRef<Record<string, unknown>>).value
      : data as Record<string, unknown>

    console.log(`🔥 [useCard2Props] displayData 计算中 ${componentId}:`, {
      isDataRef: isRef(data) || (typeof data === 'object' && data !== null && '__v_isRef' in data),
      originalData: data,
      currentData: currentData,
      hasCurrentData: !!currentData,
      currentDataType: typeof currentData,
      currentDataKeys: currentData && typeof currentData === 'object' ? Object.keys(currentData) : []
    })

    // 🔥 简化逻辑：如果有数据源执行结果，直接使用；否则使用组件配置
    if (currentData && typeof currentData === 'object' && Object.keys(currentData).length > 0) {
      // 🔥 数据源执行结果直接转换为组件可用格式
      const dataSourceResults = {}

      Object.entries(currentData).forEach(([sourceId, sourceResult]) => {
        if (sourceResult && typeof sourceResult === 'object' && 'data' in sourceResult) {
          // 标准格式：{type, data, metadata}
          const sourceData = sourceResult.data
          if (sourceData && typeof sourceData === 'object') {
            dataSourceResults[sourceId] = JSON.stringify(sourceData, null, 2)
          } else {
            dataSourceResults[sourceId] = String(sourceData)
          }
        } else {
          // 非标准格式，直接字符串化
          dataSourceResults[sourceId] = typeof sourceResult === 'object'
            ? JSON.stringify(sourceResult, null, 2)
            : String(sourceResult)
        }
      })

      // 🎯 用户要求的打印这几个字 - 阶段4：useCard2Props数据转换完成
      console.log(`🎯 用户要求的打印这几个字 - 阶段4：useCard2Props数据转换完成`, {
        componentId,
        接收到的原始数据: currentData,
        转换后的数据源结果: dataSourceResults,
        组件将接收到的数据: dataSourceResults
      })

      return dataSourceResults
    }

    // 🔥 没有数据源结果时，返回组件配置
    const result = {
      ...config,
      ...unifiedConfig.value.component
    }

    // 🎯 用户要求的打印这几个字 - 阶段4.5：useCard2Props无数据源时使用配置
    console.log(`🎯 用户要求的打印这几个字 - 阶段4.5：useCard2Props无数据源时使用配置`, {
      componentId,
      使用组件配置: result,
      无数据源执行结果: true,
      currentData的内容: currentData
    })

    return result
  })

  /**
   * 🔥 监听初始配置变化
   */
  watch(() => config, (newConfig) => {
    if (newConfig && typeof newConfig === 'object') {
      updateConfig('component', newConfig)
    }
  }, { deep: true, immediate: false })

  // 🔥 新增：属性暴露映射表，记录组件内部属性的当前值
  const exposedProperties = ref<Record<string, any>>({})

  /**
   * 🔥 新增：暴露属性值 - 组件调用此函数暴露内部属性
   */
  const exposeProperty = (propertyName: string, value: any) => {
    exposedProperties.value[propertyName] = value

    // 同步到编辑器节点的metadata，供InteractionCardWizard访问
    if (editorContext?.updateNode && componentId) {
      const currentNode = editorContext.getNodeById(componentId)
      if (currentNode) {
        editorContext.updateNode(componentId, {
          metadata: {
            ...currentNode.metadata,
            exposedProperties: { ...exposedProperties.value },
            lastPropertyUpdate: Date.now()
          }
        })
      }
    }

    console.log(`🔥 [useCard2Props] 暴露属性 ${componentId}.${propertyName}:`, value)
  }

  /**
   * 🔥 新增：批量暴露多个属性
   */
  const exposeProperties = (properties: Record<string, any>) => {
    Object.assign(exposedProperties.value, properties)

    // 同步到编辑器
    if (editorContext?.updateNode && componentId) {
      const currentNode = editorContext.getNodeById(componentId)
      if (currentNode) {
        editorContext.updateNode(componentId, {
          metadata: {
            ...currentNode.metadata,
            exposedProperties: { ...exposedProperties.value },
            lastPropertyUpdate: Date.now()
          }
        })
      }
    }

    console.log(`🔥 [useCard2Props] 批量暴露属性 ${componentId}:`, properties)
  }

  /**
   * 🔥 新增：获取暴露的属性值
   */
  const getExposedProperty = (propertyName: string) => {
    return exposedProperties.value[propertyName]
  }

  /**
   * 🔥 新增：获取所有暴露的属性
   */
  const getAllExposedProperties = () => {
    return { ...exposedProperties.value }
  }

  /**
   * 🔥 新增：属性变化监听器映射表
   */
  const propertyWatchers = ref<Record<string, ((newValue: any, oldValue: any) => void)[]>>({})

  /**
   * 🔥 新增：监听属性变化
   */
  const watchProperty = (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    if (!propertyWatchers.value[propertyName]) {
      propertyWatchers.value[propertyName] = []
    }
    propertyWatchers.value[propertyName].push(callback)

    console.log(`🔥 [useCard2Props] 添加属性监听器 ${componentId}.${propertyName}`)

    // 返回取消监听的函数
    return () => {
      const watchers = propertyWatchers.value[propertyName]
      if (watchers) {
        const index = watchers.indexOf(callback)
        if (index > -1) {
          watchers.splice(index, 1)
        }
      }
    }
  }

  /**
   * 🔥 增强：暴露属性值并触发监听器
   */
  const exposePropertyWithWatch = (propertyName: string, newValue: any) => {
    const oldValue = exposedProperties.value[propertyName]
    exposedProperties.value[propertyName] = newValue

    // 触发属性监听器
    const watchers = propertyWatchers.value[propertyName]
    if (watchers && watchers.length > 0) {
      watchers.forEach(callback => {
        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error(`🔥 [useCard2Props] 属性监听器执行失败 ${componentId}.${propertyName}:`, error)
        }
      })
    }

    // 同步到编辑器
    if (editorContext?.updateNode && componentId) {
      const currentNode = editorContext.getNodeById(componentId)
      if (currentNode) {
        editorContext.updateNode(componentId, {
          metadata: {
            ...currentNode.metadata,
            exposedProperties: { ...exposedProperties.value },
            lastPropertyUpdate: Date.now()
          }
        })
      }
    }

    console.log(`🔥 [useCard2Props] 暴露属性并触发监听 ${componentId}.${propertyName}:`, { newValue, oldValue, watcherCount: watchers?.length || 0 })
  }

  // 返回配置管理接口
  return {
    // 配置数据
    config: computed(() => unifiedConfig.value.component || {}),
    displayData,
    unifiedConfig: computed(() => unifiedConfig.value),

    // 配置管理功能
    updateConfig,
    updateUnifiedConfig,
    getFullConfiguration,

    // 事件管理
    setConfigChangeCallback,
    emitConfigChange,
    syncToEditor,

    // 🔥 新增：属性暴露功能
    exposeProperty,
    exposeProperties,
    exposePropertyWithWatch,
    getExposedProperty,
    getAllExposedProperties,
    watchProperty
  }
}