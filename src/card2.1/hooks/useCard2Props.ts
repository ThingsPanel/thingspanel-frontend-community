/**
 * 🔥 Card 2.1 统一配置管理中心 - 全新重构版本
 * 
 * 核心职责：
 * 1. 作为唯一的配置数据源头
 * 2. 管理基础、组件、数据源、交互四层配置
 * 3. 提供配置更新和事件通信机制
 * 4. 与编辑器保持配置同步
 */

import { computed, ref, watch, inject } from 'vue'
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
  data?: Record<string, unknown>
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
   * 🔥 显示数据计算 - 集成基础配置和数据源映射
   */
  const displayData = computed(() => {
    if (!componentId) {
      return { ...config, ...(data || {}) }
    }
    
    // 获取组件类型
    let componentType = componentId
    if (editorContext?.getNodeById) {
      const node = editorContext.getNodeById(componentId)
      componentType = node?.type || componentId
    }
    
    // 🔥 修复：处理真实的数据源执行结果结构
    let mappedData = {}
    if (data && typeof data === 'object') {
      console.log(`🔥 [useCard2Props] 处理数据源执行结果 ${componentId}:`, {
        originalData: data,
        dataKeys: Object.keys(data),
        dataStructure: Object.keys(data).reduce((acc, key) => {
          const item = data[key]
          acc[key] = {
            hasType: item && typeof item === 'object' && 'type' in item,
            hasData: item && typeof item === 'object' && 'data' in item,
            hasMetadata: item && typeof item === 'object' && 'metadata' in item,
            structure: item && typeof item === 'object' ? Object.keys(item) : 'primitive'
          }
          return acc
        }, {})
      })
      
      // 🔥 处理数据源执行结果：每个数据源都有 {type, data, metadata} 结构
      mappedData = Object.keys(data).reduce((result, sourceId) => {
        const sourceResult = data[sourceId]
        
        if (sourceResult && typeof sourceResult === 'object') {
          // 🔥 标准数据源结果：{type, data, metadata}
          if ('data' in sourceResult && sourceResult.data !== undefined) {
            // 提取 .data 部分，并智能处理显示
            const sourceData = sourceResult.data
            
            if (sourceData && typeof sourceData === 'object') {
              // 如果data是对象，转换为可读字符串
              result[sourceId] = JSON.stringify(sourceData, null, 2)
            } else {
              // 如果data是基础类型，直接使用
              result[sourceId] = String(sourceData)
            }
            
            console.log(`🔥 [useCard2Props] 数据源 ${sourceId} 映射:`, {
              type: sourceResult.type,
              originalData: sourceData,
              mappedValue: result[sourceId]
            })
          } else {
            // 🔥 非标准结构，直接字符串化
            result[sourceId] = JSON.stringify(sourceResult, null, 2)
            console.log(`🔥 [useCard2Props] 数据源 ${sourceId} 非标准结构，直接字符串化`)
          }
        } else {
          // 🔥 基础类型数据
          result[sourceId] = String(sourceResult)
          console.log(`🔥 [useCard2Props] 数据源 ${sourceId} 基础类型:`, sourceResult)
        }
        
        return result
      }, {})
      
      console.log(`🔥 [useCard2Props] 最终映射结果:`, mappedData)
    } else {
      // 使用原来的映射器逻辑作为回退
      mappedData = DataSourceMapper.mapDataSources(componentType, data as any)
    }
    
    // 🔥 调试信息：查看各层数据
    const baseConfig = unifiedConfig.value.base
    const componentConfig = unifiedConfig.value.component
    
    console.log(`🔥 [displayData] 计算各层数据 ${componentId}:`, {
      config,
      baseConfig,
      componentConfig,
      mappedData,
      hasNullInMappedData: mappedData && Object.keys(mappedData).some(key => mappedData[key] === null)
    })
    
    // 🔥 修复：过滤掉mappedData中的null值，避免覆盖有效配置
    const filteredMappedData = mappedData ? Object.fromEntries(
      Object.entries(mappedData).filter(([key, value]) => value !== null && value !== undefined)
    ) : {}
    
    // 🔥 数据优先级：数据源数据 > 组件配置 > 基础配置 > 默认配置
    const result = {
      ...config,
      ...baseConfig,              // 基础配置：设备ID、设备指标、标题、样式等
      ...componentConfig,         // 组件配置：组件特有属性
      ...filteredMappedData,      // 数据源数据：最高优先级（过滤null值）
      
      // 🔥 修复：添加嵌套的base对象，支持base.deviceId等路径访问
      base: {
        ...baseConfig,
        deviceId: baseConfig?.deviceId,
        metricsList: baseConfig?.metricsList || []
      }
    }
    
    console.log(`🔥 [displayData] 计算结果 ${componentId}:`, {
      result,
      titleFromComponent: componentConfig?.title,
      titleFromMapped: mappedData?.title,
      titleFinal: result.title
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