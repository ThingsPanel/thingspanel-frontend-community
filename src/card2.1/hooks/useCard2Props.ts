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
    baseConfigFromInitial: initialUnifiedConfig?.base,
    // 🔥 新增：详细调试初始配置
    初始配置的title: initialUnifiedConfig?.component?.title,
    初始配置的amount: initialUnifiedConfig?.component?.amount,
    初始配置的description: initialUnifiedConfig?.component?.description,
    初始配置完整内容: initialUnifiedConfig?.component
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

  // 🔥 关键调试：显示初始化后的统一配置
  console.log(`🔥 [useCard2Props] 统一配置初始化完成 ${componentId}:`, {
    统一配置全部: unifiedConfig.value,
    组件配置: unifiedConfig.value.component,
    组件配置的title: unifiedConfig.value.component?.title,
    组件配置的amount: unifiedConfig.value.component?.amount,
    组件配置的description: unifiedConfig.value.component?.description,
    是否使用了初始配置: !!initialUnifiedConfig?.component,
    初始传入的config: config
  })

  // 🔥 配置变更回调函数
  let configChangeCallback: ((config: UnifiedCard2Configuration) => void) | null = null

  /**
   * 🔥 按层级更新配置 - 核心配置管理函数
   */
  const updateConfig = (layer: keyof UnifiedCard2Configuration, newConfig: any) => {
    console.log(`🔍 [TRACE-14] useCard2Props.updateConfig 被调用:`, {
      componentId,
      layer,
      newConfig,
      当前统一配置: unifiedConfig.value,
      callStack: new Error().stack?.split('\n').slice(1, 5)
    })
    console.log(`🔍 [TRACE-15] 更新前配置:`, unifiedConfig.value[layer])

    // 🔥 强制响应式更新 - 深度合并并触发响应
    const updatedLayer = { ...unifiedConfig.value[layer], ...newConfig }

    // 🔥 关键修复：使用完全新的对象引用，确保响应式更新
    const newUnifiedConfig = {
      ...unifiedConfig.value,
      [layer]: updatedLayer
    }

    console.log(`🔍 [TRACE-16] 即将设置新的统一配置:`, newUnifiedConfig)

    // 🔥 直接赋值新对象，确保触发响应式更新
    unifiedConfig.value = newUnifiedConfig

    console.log(`🔍 [TRACE-17] 更新后配置:`, unifiedConfig.value[layer])
    console.log(`🔍 [TRACE-18] 新的displayData将会重新计算`)

    console.log(`🔍 [TRACE-19] 即将调用 syncToEditor():`)
    // 同步到编辑器
    syncToEditor()
    console.log(`🔍 [TRACE-20] syncToEditor() 调用完成`)

    console.log(`🔍 [TRACE-21] 即将调用 emitConfigChange():`)
    // 触发配置变更事件
    emitConfigChange()
    console.log(`🔍 [TRACE-22] emitConfigChange() 调用完成`)
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
    console.log(`🔍 [TRACE-22] useCard2Props.syncToEditor 被调用:`, {
      componentId,
      hasEditorContext: !!editorContext?.updateNode,
      callStack: new Error().stack?.split('\n').slice(1, 5)
    })

    if (!editorContext?.updateNode || !componentId) {
      console.log(`🔍 [TRACE-23] syncToEditor 提前退出：缺少编辑器上下文或组件ID`)
      return
    }

    const currentNode = editorContext.getNodeById(componentId)
    if (!currentNode) {
      console.log(`🔍 [TRACE-24] syncToEditor 提前退出：未找到当前节点`)
      return
    }

    // 防止循环更新
    const currentUnifiedConfig = currentNode.metadata?.unifiedConfig
    if (JSON.stringify(currentUnifiedConfig) === JSON.stringify(unifiedConfig.value)) {
      console.log(`🔍 [TRACE-25] syncToEditor 提前退出：配置内容相同，防止循环更新`)
      return
    }

    console.log(`🔍 [TRACE-26] syncToEditor 开始同步:`, {
      componentId,
      oldConfig: currentUnifiedConfig,
      newConfig: unifiedConfig.value
    })

    // 🚨 创建一个没有 interaction 配置的版本，避免保存僵尸交互配置
    const configWithoutInteraction = {
      ...unifiedConfig.value,
      interaction: {} // 🔥 清空 interaction，避免僵尸配置
    }

    console.log(`🔍 [TRACE-27] 即将调用 editorContext.updateNode:`, {
      componentId,
      properties: unifiedConfig.value.component || {},
      configWithoutInteraction
    })

    editorContext.updateNode(componentId, {
      properties: unifiedConfig.value.component || {},
      metadata: {
        ...currentNode.metadata,
        unifiedConfig: configWithoutInteraction, // 🔥 保存时移除 interaction
        updatedAt: Date.now()
      }
    })

    console.log(`🔍 [TRACE-28] editorContext.updateNode 调用完成`)
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
   * 🔥 修复：显示数据计算 - 确保完全响应统一配置变化
   */
  const displayData = computed(() => {
    console.log(`🔥 [useCard2Props] displayData 计算开始 ${componentId}`)

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
      currentDataKeys: currentData && typeof currentData === 'object' ? Object.keys(currentData) : [],
      // 🔥 新增：统一配置调试信息
      unifiedConfigComponent: unifiedConfig.value.component,
      configKeys: unifiedConfig.value.component ? Object.keys(unifiedConfig.value.component) : [],
      配置内容: unifiedConfig.value.component
    })

    // 🔥 修复逻辑：检查是否有有效的数据源执行结果
    const hasValidDataSource = currentData &&
      typeof currentData === 'object' &&
      Object.keys(currentData).length > 0 &&
      // 🔥 关键修复：过滤掉无效的数据源结果（如空的complete字段）
      Object.values(currentData).some(sourceResult => {
        if (!sourceResult || typeof sourceResult !== 'object') return false

        // 检查是否有有效的data字段
        if ('data' in sourceResult) {
          const data = sourceResult.data
          // data必须存在且不能是空字符串或空对象
          if (!data) return false
          if (typeof data === 'string' && (data === '{}' || data.trim() === '')) return false
          if (typeof data === 'object' && Object.keys(data).length === 0) return false
          return true
        }

        // 非标准格式也需要有实际内容
        if (typeof sourceResult === 'string' && (sourceResult === '{}' || sourceResult.trim() === '')) return false
        if (typeof sourceResult === 'object' && Object.keys(sourceResult).length === 0) return false

        return true
      })

    if (hasValidDataSource) {
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

      console.log(`🔥 [useCard2Props] displayData 返回数据源结果 ${componentId}:`, dataSourceResults)
      return dataSourceResults
    }

    // 🔥 核心修复：没有数据源结果时，直接使用统一配置的组件配置
    // 移除对初始config的依赖，确保完全响应unifiedConfig.component的变化
    const result = {
      ...unifiedConfig.value.component  // 🔥 关键：只使用统一配置，移除初始config的干扰
    }

    // 🎯 用户要求的打印这几个字 - 阶段4.5：useCard2Props无数据源时使用配置
    console.log(`🎯 用户要求的打印这几个字 - 阶段4.5：useCard2Props无数据源时使用配置`, {
      componentId,
      使用统一配置: result,
      无数据源执行结果: true,
      currentData的内容: currentData,
      unifiedConfigComponent: unifiedConfig.value.component
    })

    console.log(`🔥 [useCard2Props] displayData 返回统一配置结果 ${componentId}:`, result)
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
   * 🔥 自动配置同步：监听外部配置更新事件
   */
  const handleExternalConfigUpdate = (event: CustomEvent) => {
    const { componentId: eventComponentId, layer, config } = event.detail
    if (eventComponentId === componentId && layer === 'component') {
      console.log(`🔥 [useCard2Props] 接收到外部配置更新事件:`, config)

      // 获取旧的配置值，用于触发属性变化监听器
      const oldConfig = { ...unifiedConfig.value.component }

      // 自动同步到内部统一配置
      updateUnifiedConfig({ component: config })

      // 🔥 关键修复：对于跨组件交互，需要手动触发属性变化监听器
      if (config && typeof config === 'object') {
        Object.keys(config).forEach(propertyName => {
          const oldValue = oldConfig[propertyName]
          const newValue = config[propertyName]

          if (oldValue !== newValue) {
            console.log(`🔥 [useCard2Props] 检测到属性变化: ${propertyName}`, {
              oldValue,
              newValue,
              componentId
            })

            // 🔥 触发属性监听器 - 这是交互系统需要的
            const watchers = propertyWatchers.value[propertyName]
            if (watchers && watchers.length > 0) {
              console.log(`🔥 [useCard2Props] 触发 ${watchers.length} 个属性监听器: ${propertyName}`)
              watchers.forEach(callback => {
                try {
                  callback(newValue, oldValue)
                  console.log(`✅ [useCard2Props] 属性监听器执行成功: ${propertyName}`)
                } catch (error) {
                  console.error(`❌ [useCard2Props] 属性监听器执行失败 ${componentId}.${propertyName}:`, error)
                }
              })
            } else {
              console.log(`🔥 [useCard2Props] 属性 ${propertyName} 没有监听器`)
            }

            // 🔥 发送属性变化事件给交互系统
            window.dispatchEvent(new CustomEvent('property-change', {
              detail: {
                componentId,
                propertyName,
                oldValue,
                newValue,
                source: 'cross-component-interaction'
              }
            }))
            console.log(`🔥 [useCard2Props] 发送 property-change 事件: ${componentId}.${propertyName}`)
          }
        })
      }
    }
  }

  /**
   * 🔥 增强的配置更新：自动同步到配置管理器
   */
  const updateUnifiedConfigWithSync = (partialConfig: Partial<UnifiedCard2Configuration>) => {
    console.log(`🔥 [useCard2Props] 增强配置更新开始:`, partialConfig)

    // 1. 更新本地统一配置
    updateUnifiedConfig(partialConfig)

    // 2. 自动同步到配置管理器（如果有组件配置更新）
    if (partialConfig.component && componentId) {
      import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
        .then(({ configurationIntegrationBridge }) => {
          configurationIntegrationBridge.updateConfiguration(
            componentId,
            'component',
            partialConfig.component,
            'auto-sync'
          )
          console.log(`✅ [useCard2Props] 配置已自动同步到配置管理器`)
        })
        .catch(error => {
          console.error(`❌ [useCard2Props] 自动同步配置失败:`, error)
        })
    }
  }

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

  /**
   * 🔥 核心新功能：自动属性暴露 - 把所有配置属性都自动暴露
   */
  const autoExposeAllProperties = () => {
    if (!unifiedConfig.value.component) return

    const componentConfig = unifiedConfig.value.component
    const autoExposedProperties = { ...componentConfig }

    // 添加一些通用的计算属性
    if (componentConfig.title !== undefined) {
      autoExposedProperties.hasTitle = Boolean(componentConfig.title)
    }
    if (componentConfig.amount !== undefined) {
      autoExposedProperties.isActive = Number(componentConfig.amount) > 0
      autoExposedProperties.status = Number(componentConfig.amount) > 0 ? 'active' : 'inactive'
    }

    // 统一时间戳
    autoExposedProperties.lastUpdated = new Date().toISOString()
    autoExposedProperties.componentId = componentId

    // 批量暴露所有属性
    exposeProperties(autoExposedProperties)

    console.log(`🔥 [useCard2Props] 自动暴露所有属性 ${componentId}:`, {
      总属性数: Object.keys(autoExposedProperties).length,
      属性列表: Object.keys(autoExposedProperties),
      属性值: autoExposedProperties
    })
  }

  /**
   * 🔥 生命周期管理：自动监听和清理
   */
  const setupAutoSync = () => {
    if (typeof window !== 'undefined') {
      // 自动监听配置更新事件
      window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
      console.log(`🔥 [useCard2Props] 已自动设置配置同步监听 ${componentId}`)
    }

    // 返回清理函数
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
        console.log(`🔥 [useCard2Props] 已清理配置同步监听 ${componentId}`)
      }
    }
  }

  // 🔥 自动设置同步和属性暴露
  const cleanupAutoSync = setupAutoSync()

  // 🔥 监听统一配置变化，自动重新暴露属性
  watch(
    () => unifiedConfig.value.component,
    () => {
      autoExposeAllProperties()
    },
    { deep: true, immediate: true }
  )

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
    watchProperty,

    // 🔥 增强功能：自动同步配置管理
    updateUnifiedConfigWithSync,  // 增强版配置更新，自动同步到配置管理器
    autoExposeAllProperties,      // 手动触发全属性暴露（通常自动处理）
    cleanupAutoSync               // 清理函数，用于组件卸载时调用
  }
}