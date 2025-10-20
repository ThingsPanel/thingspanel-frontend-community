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
import { DataSourceMapper } from '@/card2.1/core2/data-source'
import type { MetricItem } from '@/card2.1/core2'

// 🔥 关键优化：属性绑定检查缓存，避免重复的配置获取和检查
const propertyBindingCache = new Map<string, {
  hasBinding: boolean
  lastCheck: number
  configHash: string
}>()

// 缓存有效期：2秒（避免配置变更后的延迟）
const BINDING_CACHE_TTL = 2000

/**
 * 🔥 高效的属性绑定检查函数
 * 使用缓存避免重复的配置查询和HTTP配置解析
 */
async function checkPropertyBinding(componentId: string, propertyPath: string): Promise<boolean> {
  const cacheKey = `${componentId}:${propertyPath}`
  const now = Date.now()

  // 检查缓存
  const cached = propertyBindingCache.get(cacheKey)
  if (cached && (now - cached.lastCheck) < BINDING_CACHE_TTL) {
    return cached.hasBinding
  }

  try {
    // 获取当前组件的数据源配置
    const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
    const config = configurationIntegrationBridge.getConfiguration(componentId)

    if (!config?.dataSource) {
      // 缓存"无绑定"结果
      propertyBindingCache.set(cacheKey, {
        hasBinding: false,
        lastCheck: now,
        configHash: 'no-datasource'
      })
      return false
    }

    // 生成配置哈希以检测变更
    const configHash = JSON.stringify(config.dataSource).substring(0, 100)

    // 如果配置未变更且缓存有效，直接返回缓存结果
    if (cached && cached.configHash === configHash) {
      return cached.hasBinding
    }

    // 执行绑定检查
    let hasBinding = false
    const dataSource = config.dataSource

    // 🔥 关键优化：统一的HTTP配置查找逻辑
    const httpConfigs = []

    // 1. 检查新格式：dataSources数组中的HTTP配置
    if (dataSource?.dataSources && Array.isArray(dataSource.dataSources)) {
      for (const ds of dataSource.dataSources) {
        if (ds.dataItems && Array.isArray(ds.dataItems)) {
          for (const item of ds.dataItems) {
            if (item.item?.type === 'http' && item.item?.config?.params) {
              httpConfigs.push(item.item.config)
            }
          }
        }
      }
    }

    // 2. 检查旧格式：直接的HTTP配置
    if (dataSource?.type === 'http' && dataSource?.config?.params) {
      httpConfigs.push(dataSource.config)
    }

    // 3. 检查rawDataList格式
    if (dataSource?.rawDataList && Array.isArray(dataSource.rawDataList)) {
      for (const item of dataSource.rawDataList) {
        if (item.type === 'http' && item.config?.params) {
          httpConfigs.push(item.config)
        }
      }
    }

    // 🔥 关键优化：在所有找到的HTTP配置中检查参数绑定
    for (const httpConfig of httpConfigs) {
      if (httpConfig.params && Array.isArray(httpConfig.params)) {
        for (const param of httpConfig.params) {
          if (param.enabled !== false && param.value === propertyPath) {
            hasBinding = true
            break
          }
        }
      }
      if (hasBinding) break
    }

    // 缓存检查结果
    propertyBindingCache.set(cacheKey, {
      hasBinding,
      lastCheck: now,
      configHash
    })


    return hasBinding
  } catch (error) {
    console.error(`❌ [checkPropertyBinding] 检查失败:`, {
      componentId,
      propertyPath,
      error: error instanceof Error ? error.message : error
    })
    return false
  }
}

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

  // 🔥 配置变更回调函数
  let configChangeCallback: ((config: UnifiedCard2Configuration) => void) | null = null

  /**
   * 🔥 按层级更新配置 - 核心配置管理函数
   */
  const updateConfig = (layer: keyof UnifiedCard2Configuration, newConfig: any) => {

    // 🔥 强制响应式更新 - 深度合并并触发响应
    const updatedLayer = { ...unifiedConfig.value[layer], ...newConfig }

    // 🔥 关键修复：使用完全新的对象引用，确保响应式更新
    const newUnifiedConfig = {
      ...unifiedConfig.value,
      [layer]: updatedLayer
    }


    // 🔥 直接赋值新对象，确保触发响应式更新
    unifiedConfig.value = newUnifiedConfig


    // 同步到编辑器
    syncToEditor()

    // 🚀 关键修复：同步到配置管理器，确保VisualEditorBridge能获取到最新值
    syncToConfigurationManager()

    // 🔥 关键修复：当配置更新时清理绑定缓存，确保下次检查使用最新配置
    if (componentId && (layer === 'dataSource' || layer === 'component')) {
      clearPropertyBindingCache(componentId)
    }

    // 触发配置变更事件
    emitConfigChange()
  }

  /**
   * 🔥 批量更新配置
   */
  const updateUnifiedConfig = (partialConfig: Partial<UnifiedCard2Configuration>) => {
    
    unifiedConfig.value = {
      ...unifiedConfig.value,
      ...partialConfig
    }
    
    syncToEditor()
    emitConfigChange()
  }

  /**
   * 🚀 关键修复：同步配置到配置管理器
   * 确保 VisualEditorBridge 能获取到最新的属性值
   */
  const syncToConfigurationManager = () => {
    if (!componentId) {
      return
    }

    try {

      // 动态导入配置管理器
      import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
        .then(({ configurationIntegrationBridge }) => {
          // 获取当前配置
          const currentConfig = configurationIntegrationBridge.getConfiguration(componentId)

          // 创建更新后的配置
          const updatedConfig = {
            ...currentConfig,
            component: unifiedConfig.value.component,
            base: unifiedConfig.value.base,
            dataSource: unifiedConfig.value.dataSource || currentConfig?.dataSource,
            interaction: unifiedConfig.value.interaction || currentConfig?.interaction
          }


          // 🚀 关键：直接更新配置管理器的状态，不触发事件
          // 使用内部方法确保配置同步但不产生额外的事件循环
          const configurationStateManager = (configurationIntegrationBridge as any).configurationStateManager
          if (configurationStateManager) {
            // 直接设置配置状态，绕过事件发送
            configurationStateManager.updateConfigurationSection(
              componentId,
              'component',
              updatedConfig.component,
              'sync', // 标记为同步更新
              false   // 不强制更新
            )
          } else {
            // 降级方案：使用正常的更新方法
            configurationIntegrationBridge.updateConfiguration(
              componentId,
              'component',
              updatedConfig.component,
              'card2-sync'
            )
          }

        })
        .catch(error => {
          console.error(`❌ [useCard2Props] 配置管理器同步失败:`, error)
        })
    } catch (error) {
      console.error(`❌ [useCard2Props] syncToConfigurationManager 失败:`, error)
    }
  }

  /**
   * 🔥 同步配置到编辑器
   */
  const syncToEditor = () => {

    if (!editorContext?.updateNode || !componentId) {
      return
    }

    const currentNode = editorContext.getNodeById(componentId)
    if (!currentNode) {
      return
    }

    // 防止循环更新
    const currentUnifiedConfig = currentNode.metadata?.unifiedConfig
    if (JSON.stringify(currentUnifiedConfig) === JSON.stringify(unifiedConfig.value)) {
      return
    }


    // 🚨 创建一个没有 interaction 配置的版本，避免保存僵尸交互配置
    const configWithoutInteraction = {
      ...unifiedConfig.value,
      interaction: {} // 🔥 清空 interaction，避免僵尸配置
    }


    editorContext.updateNode(componentId, {
      properties: unifiedConfig.value.component || {},
      metadata: {
        ...currentNode.metadata,
        unifiedConfig: configWithoutInteraction, // 🔥 保存时移除 interaction
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
   * 🔥 修复：显示数据计算 - 确保完全响应统一配置变化
   */
  const displayData = computed(() => {
    // 🔥 关键修复：先直接访问data以建立响应式依赖
    // 无论data是什么类型，都先访问一次，让Vue追踪到依赖关系
    const rawData = data

    // 🔥 关键修复：正确获取data值，无论它是响应式引用还是普通值
    let currentData: Record<string, unknown>

    if (isRef(rawData)) {
      // 如果是 ref，直接获取 .value
      currentData = rawData.value as Record<string, unknown>
    } else if (typeof rawData === 'object' && rawData !== null && 'value' in rawData) {
      // 如果是计算属性对象，获取 .value
      currentData = (rawData as any).value as Record<string, unknown>
    } else if (typeof rawData === 'function') {
      // 如果是函数（某些情况下计算属性可能表现为函数），调用它获取值
      try {
        currentData = (rawData as any)() as Record<string, unknown>
      } catch (error) {
        console.warn(`🔥 [useCard2Props] 函数调用失败，使用空对象:`, error)
        currentData = {}
      }
    } else {
      // 普通对象或值
      currentData = (rawData as Record<string, unknown>) || {}
    }

    // 🔥 修复逻辑：检查是否有有效的数据源执行结果
    const hasValidDataSource = currentData &&
      typeof currentData === 'object' &&
      Object.keys(currentData).length > 0

    // 🔥 关键修复：检查数据是否来自DataWarehouse且包含组件需要的字段
    // 支持嵌套结构（如 { main: { data: { value, ... } } }）
    const isDataFromWarehouse = hasValidDataSource && (() => {
      const dataKeys = Object.keys(currentData)

      // 检查顶层是否包含组件需要的基本字段
      const hasDirectFields = dataKeys.some(key =>
        ['value', 'unit', 'metricsName', 'data', 'title', 'amount', 'description', 'timestamp'].includes(key)
      )

      if (hasDirectFields) return true

      // 🔥 关键修复：检查是否是数据源嵌套结构（如 { main: { data: {...} }, secondary: {...} }）
      const hasNestedData = dataKeys.some(key => {
        const value = currentData[key]
        return value && typeof value === 'object' && ('data' in value || 'type' in value)
      })

      return hasNestedData
    })()

    if (isDataFromWarehouse) {
      // 🔥 直接返回DataWarehouse的数据，这已经是组件需要的格式
      return currentData
    }

    // 🔥 核心修复：没有数据源结果时，直接使用统一配置的组件配置
    // 移除对初始config的依赖，确保完全响应unifiedConfig.component的变化
    const result = {
      ...unifiedConfig.value.component  // 🔥 关键：只使用统一配置，移除初始config的干扰
    }

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
   * 🔒 安全暴露属性值 - 经过白名单验证的属性暴露
   */
  const exposeProperty = (propertyName: string, value: any) => {
    console.warn(`⚠️ [useCard2Props] exposeProperty 已废弃，请使用 exposeWhitelistedProperties()`)
    console.warn(`⚠️ 尝试暴露属性: ${componentId}.${propertyName} = ${value}`)

    // 🔒 不再直接暴露属性，转而调用白名单机制
    // 这是为了防止组件绕过白名单直接暴露属性
    exposeWhitelistedProperties()
  }

  /**
   * 🔒 安全批量暴露属性 - 只有白名单验证通过的属性才会被暴露
   */
  const exposeProperties = (properties: Record<string, any>) => {
    console.warn(`⚠️ [useCard2Props] exposeProperties 已废弃，请使用 exposeWhitelistedProperties()`)
    console.warn(`⚠️ 尝试批量暴露属性: ${componentId}:`, Object.keys(properties))

    // 🔒 不再直接暴露属性，转而调用白名单机制
    // 这是为了防止组件绕过白名单直接暴露属性
    exposeWhitelistedProperties()
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

            // 🔥 触发属性监听器 - 这是交互系统需要的
            const watchers = propertyWatchers.value[propertyName]
            if (watchers && watchers.length > 0) {
              watchers.forEach(callback => {
                try {
                  callback(newValue, oldValue)
                } catch (error) {
                  console.error(`❌ [useCard2Props] 属性监听器执行失败 ${componentId}.${propertyName}:`, error)
                }
              })
            } else {
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
          }
        })
      }
    }
  }

  /**
   * 🔥 增强的配置更新：自动同步到配置管理器
   */
  const updateUnifiedConfigWithSync = (partialConfig: Partial<UnifiedCard2Configuration>) => {

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
   * 🔒 废弃：暴露属性值并触发监听器（已被白名单机制替代）
   */
  const exposePropertyWithWatch = (propertyName: string, newValue: any) => {
    console.warn(`⚠️ [useCard2Props] exposePropertyWithWatch 已废弃，请使用 exposeWhitelistedProperties()`)
    console.warn(`⚠️ 尝试暴露并监听属性: ${componentId}.${propertyName} = ${newValue}`)

    // 🔒 触发白名单机制来重新暴露所有安全属性
    exposeWhitelistedProperties()

    // 保留监听器功能，因为这是合法的内部机制
    const oldValue = exposedProperties.value[propertyName]
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
  }

  /**
   * 🔒 安全的基于白名单的属性暴露
   * 只暴露组件定义中明确声明的属性
   */
  const exposeWhitelistedProperties = async () => {
    if (!unifiedConfig.value.component || !componentId) return

    try {
      // 🔒 导入属性暴露管理器
      const { propertyExposureManager } = await import('@/card2.1/core2/property')

      // 获取组件类型（从注入的上下文或其他方式获取）
      const componentType = getComponentType()
      if (!componentType) {
        console.warn(`⚠️ [useCard2Props] 无法确定组件类型，跳过属性暴露: ${componentId}`)
        return
      }

      // 获取白名单属性配置
      const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(
        componentType,
        'public',
        { source: 'system' }
      )

      if (Object.keys(whitelistedProperties).length === 0) {
        return
      }

      // 🔒 安全暴露白名单中的属性
      const safeExposedProperties: Record<string, any> = {}
      const componentConfig = unifiedConfig.value.component

      for (const [propertyName, config] of Object.entries(whitelistedProperties)) {
        const actualPropertyName = Object.keys(componentConfig).find(key => key === propertyName)

        if (actualPropertyName && componentConfig[actualPropertyName] !== undefined) {
          const accessResult = propertyExposureManager.exposeProperty(
            componentType,
            componentId,
            propertyName,
            componentConfig[actualPropertyName],
            {
              accessType: 'read',
              timestamp: Date.now(),
              source: 'system'
            }
          )

          if (accessResult.allowed) {
            const exposedName = config.alias || propertyName
            safeExposedProperties[exposedName] = accessResult.value
          }
        }
      }

      // 添加安全的元数据
      safeExposedProperties.lastUpdated = new Date().toISOString()
      safeExposedProperties.componentId = componentId

      // 🔒 直接设置经过白名单过滤的属性，绕过旧的暴露函数
      exposedProperties.value = { ...safeExposedProperties }

      // 🔒 注释掉编辑器节点更新，避免循环依赖
      // 编辑器节点的 metadata 更新应该由编辑器自身管理，而不是在这里触发
      // if (editorContext?.updateNode && componentId) {
      //   const currentNode = editorContext.getNodeById(componentId)
      //   if (currentNode) {
      //     editorContext.updateNode(componentId, {
      //       metadata: {
      //         ...currentNode.metadata,
      //         exposedProperties: { ...exposedProperties.value },
      //         lastPropertyUpdate: Date.now()
      //       }
      //     })
      //   }
      // }

    } catch (error) {
      console.error(`❌ [useCard2Props] 属性白名单暴露失败 ${componentId}:`, error)
    }
  }

  /**
   * 🔍 获取组件类型
   * 尝试从多个来源获取组件类型信息
   */
  const getComponentType = (): string | null => {
    // 1. 从编辑器上下文获取
    if (editorContext?.getNodeById && componentId) {
      const node = editorContext.getNodeById(componentId)
      if (node?.type) {
        return node.type
      }
    }

    // 2. 从DOM属性获取
    if (typeof window !== 'undefined' && componentId) {
      const element = document.querySelector(`[data-component-id="${componentId}"]`)
      const componentType = element?.getAttribute('data-component-type')
      if (componentType) {
        return componentType
      }
    }

    // 3. 从初始配置获取（如果有的话）
    if (initialUnifiedConfig?.componentType) {
      return initialUnifiedConfig.componentType as string
    }

    return null
  }

  /**
   * 🔥 生命周期管理：自动监听和清理
   */
  const setupAutoSync = () => {
    if (typeof window !== 'undefined') {
      // 自动监听配置更新事件
      window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
    }

    // 返回增强的清理函数
    return () => {
      // 清理防抖定时器
      if (exposePropertiesTimer) {
        clearTimeout(exposePropertiesTimer)
        exposePropertiesTimer = null
      }
      
      // 清理事件监听器
      if (typeof window !== 'undefined') {
        window.removeEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
      }
    }
  }

  // 🔥 自动设置同步和属性暴露
  const cleanupAutoSync = setupAutoSync()

  // 🔒 防抖机制：避免无限循环调用
  let exposePropertiesTimer: NodeJS.Timeout | null = null
  const debouncedExposeProperties = () => {
    if (exposePropertiesTimer) {
      clearTimeout(exposePropertiesTimer)
    }
    exposePropertiesTimer = setTimeout(() => {
      exposeWhitelistedProperties()
    }, 100) // 100ms 防抖延迟
  }

  // 🔒 监听统一配置变化，安全地重新暴露白名单属性，并触发数据源更新
  watch(
    () => unifiedConfig.value.component,
    (newComponent, oldComponent) => {
      // 🔒 使用防抖机制重新暴露白名单属性，避免无限循环
      debouncedExposeProperties()

      // 🔥 新增：检查属性变化并触发数据源更新
      if (componentId && newComponent && oldComponent) {
        Object.keys(newComponent).forEach(async propertyName => {
          const newValue = newComponent[propertyName]
          const oldValue = oldComponent?.[propertyName]

          if (newValue !== oldValue) {

            // 🔥 关键修复：触发内部属性监听器（这个总是需要的）
            const watchers = propertyWatchers.value[propertyName]
            if (watchers && watchers.length > 0) {
              watchers.forEach(callback => {
                try {
                  callback(newValue, oldValue)
                } catch (error) {
                  console.error(`❌ [useCard2Props] 属性监听器执行失败 ${componentId}.${propertyName}:`, error)
                }
              })
            }

            // 🚀 关键修复：只有当属性真正被绑定到数据源时，才触发数据源重新执行

            try {
              // 🔥 关键优化：提前构造属性绑定路径
              const propertyPath = `${componentId}.component.${propertyName}`

              // 🔥 第一步优化：使用缓存的绑定检查函数，避免重复获取配置
              const hasBinding = await checkPropertyBinding(componentId, propertyPath)


              if (hasBinding) {

                // 只有真正绑定的属性才调用交互管理器
                const { interactionManager } = await import('@/card2.1/core2/interaction')
                interactionManager.notifyPropertyUpdate(componentId, propertyPath, newValue, oldValue)

                // 发送全局属性变化事件（只对绑定的属性）
                window.dispatchEvent(new CustomEvent('property-change', {
                  detail: {
                    componentId,
                    propertyName,
                    propertyPath,
                    oldValue,
                    newValue,
                    source: 'bound-property-change',
                    hasBinding: true,
                    timestamp: Date.now()
                  }
                }))
              } else {

                // 发送全局属性变化事件（标记为未绑定）
                window.dispatchEvent(new CustomEvent('property-change', {
                  detail: {
                    componentId,
                    propertyName,
                    propertyPath,
                    oldValue,
                    newValue,
                    source: 'unbound-property-change',
                    hasBinding: false,
                    timestamp: Date.now()
                  }
                }))
              }
            } catch (error) {
              console.error(`❌ [useCard2Props] 检查属性绑定失败:`, {
                componentId,
                propertyName,
                error: error instanceof Error ? error.message : error
              })
            }
          }
        })
      }
    },
    { deep: true, immediate: true }
  )

  /**
   * 🔥 清理属性绑定缓存
   * 当配置更新时需要清理相关缓存，确保绑定检查的准确性
   */
  const clearPropertyBindingCache = (componentId?: string) => {
    if (componentId) {
      // 清理特定组件的缓存
      const keysToDelete = []
      for (const [key] of propertyBindingCache) {
        if (key.startsWith(`${componentId}:`)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => propertyBindingCache.delete(key))
    } else {
      // 清理所有缓存
      const cacheSize = propertyBindingCache.size
      propertyBindingCache.clear()
    }
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
    watchProperty,

    // 🔥 增强功能：自动同步配置管理
    updateUnifiedConfigWithSync,  // 增强版配置更新，自动同步到配置管理器
    exposeWhitelistedProperties,  // 🔒 安全的白名单属性暴露（替换自动全量暴露）
    cleanupAutoSync,              // 清理函数，用于组件卸载时调用
    clearPropertyBindingCache     // 🔥 新增：清理绑定缓存函数
  }
}