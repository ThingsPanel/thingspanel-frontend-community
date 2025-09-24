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
// 🔥 导入循环保护管理器
import { loopProtectionManager } from '@/utils/LoopProtectionManager'

// 🔥 关键优化：属性绑定检查缓存，避免重复的配置获取和检查
const propertyBindingCache = new Map<string, {
  hasBinding: boolean
  lastCheck: number
  configHash: string
}>()

// 🔥 性能优化：大数据量下的缓存策略
// 缓存有效期：10秒（减少频繁检查）
const BINDING_CACHE_TTL = 10000
// 全局防抖计时器，避免同时大量检查
let globalBindingCheckDebounce: NodeJS.Timeout | null = null

/**
 * 🔥 高效的属性绑定检查函数
 * 使用缓存避免重复的配置查询和HTTP配置解析
 */
async function checkPropertyBinding(componentId: string, propertyPath: string): Promise<boolean> {
  const cacheKey = `${componentId}:${propertyPath}`
  const now = Date.now()

  // 🔥 性能优化：全局防抖，避免同时大量检查
  if (globalBindingCheckDebounce) {
    clearTimeout(globalBindingCheckDebounce)
  }

  return new Promise((resolve) => {
    globalBindingCheckDebounce = setTimeout(async () => {
      // 检查缓存
      const cached = propertyBindingCache.get(cacheKey)
      if (cached && (now - cached.lastCheck) < BINDING_CACHE_TTL) {
        // 静默使用缓存，减少日志输出
        resolve(cached.hasBinding)
        return
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
            console.log(`✅ [checkPropertyBinding] 找到绑定参数:`, {
              componentId,
              propertyPath,
              参数键: param.key,
              参数值: param.value
            })
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

      // 🔥 性能优化：减少日志输出，只在调试模式下输出
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [checkPropertyBinding] 完成检查:`, {
          componentId,
          propertyPath,
          hasBinding,
          HTTP配置数量: httpConfigs.length,
          已缓存: true
        })
      }

      resolve(hasBinding)
    } catch (error) {
      console.error(`❌ [checkPropertyBinding] 检查失败:`, {
        componentId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
      resolve(false)
    }
    }, 50) // 50ms防抖延迟
  })
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
   * 🔥 关键修复：带循环保护的配置更新函数 - 核心配置管理函数
   */
  const updateConfig = (layer: keyof UnifiedCard2Configuration, newConfig: any) => {
    // 🔥 循环保护：检查是否应该允许这次调用
    const callId = loopProtectionManager.markCallStart(
      'useCard2Props.updateConfig',
      componentId,
      `updateConfig-${layer}`
    )

    if (!callId) {
      console.warn(`🚫 [useCard2Props] updateConfig 调用被循环保护阻止: ${componentId}:${layer}`)
      return
    }

    try {
      // 🔥 性能优化：只在真正有变化时处理
      const currentLayerConfig = unifiedConfig.value[layer]
      if (JSON.stringify(currentLayerConfig) === JSON.stringify(newConfig)) {
        console.log(`🔥 [useCard2Props] 配置无变化，跳过更新: ${componentId}:${layer}`)
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [TRACE-14] useCard2Props.updateConfig 被调用:`, {
          componentId,
          layer,
          newConfig,
          循环保护: true,
          callId
        })
      }

      // 🔥 强制响应式更新 - 深度合并并触发响应
      const updatedLayer = { ...unifiedConfig.value[layer], ...newConfig }

      // 🔥 关键修复：使用完全新的对象引用，确保响应式更新
      const newUnifiedConfig = {
        ...unifiedConfig.value,
        [layer]: updatedLayer
      }

      // 🔥 直接赋值新对象，确保触发响应式更新
      unifiedConfig.value = newUnifiedConfig

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [TRACE-17] 更新后配置:`, unifiedConfig.value[layer])
      }

      // 异步执行后续操作，避免阻塞
      setTimeout(() => {
        // 同步到编辑器
        syncToEditor()

        // 同步到配置管理器
        syncToConfigurationManager()

        // 🔥 关键修复：当配置更新时清理绑定缓存，确保下次检查使用最新配置
        if (componentId && (layer === 'dataSource' || layer === 'component')) {
          clearPropertyBindingCache(componentId)
        }

        // 触发配置变更事件
        emitConfigChange()
      }, 0)
    } finally {
      // 标记调用结束
      loopProtectionManager.markCallEnd(callId, 'useCard2Props.updateConfig', componentId)
    }
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
   * 🔥 关键修复：防循环的配置管理器同步机制
   * 确保 VisualEditorBridge 能获取到最新的属性值，但不触发循环更新
   */
  let syncDebounceTimer: NodeJS.Timeout | null = null
  let isSyncing = false // 防止并发同步

  const syncToConfigurationManager = () => {
    if (!componentId || isSyncing) {
      return // 跳过无ID或正在同步的情况
    }

    // 🔥 防抖处理，避免频繁同步
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer)
    }

    syncDebounceTimer = setTimeout(async () => {
      if (isSyncing) return

      isSyncing = true
      try {
        // 静默同步，减少日志输出
        const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')

        // 获取当前配置，避免覆盖其他层级的配置
        const currentConfig = configurationIntegrationBridge.getConfiguration(componentId)

        // 🔥 关键修复：检查是否真的需要更新，避免无效同步
        if (currentConfig &&
            JSON.stringify(currentConfig.component) === JSON.stringify(unifiedConfig.value.component)) {
          // 配置相同，跳过同步
          return
        }

        // 只更新component层配置，避免影响其他层级
        const configurationStateManager = (configurationIntegrationBridge as any).configurationStateManager
        if (configurationStateManager) {
          // 🔥 直接静默更新，不触发任何事件
          configurationStateManager.updateConfigurationSection(
            componentId,
            'component',
            unifiedConfig.value.component,
            'silent-sync', // 标记为静默同步
            false,         // 不强制更新
            true           // 跳过事件发送
          )
        }
      } catch (error) {
        // 静默处理错误，避免干扰正常流程
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ [useCard2Props] 配置同步失败:`, error)
        }
      } finally {
        isSyncing = false
        syncDebounceTimer = null
      }
    }, 200) // 200ms防抖延迟
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
   * 🔥 关键修复：防循环的显示数据计算 - 完全解决响应式死循环
   */
  let lastDisplayDataHash = ''
  let lastDisplayDataResult: any = {}

  const displayData = computed(() => {
    // 🔥 关键修复：移除所有循环触发的console.log，只在真正需要时输出

    // 🔥 关键修复：正确获取data值，无论它是响应式引用还是普通值
    const currentData = isRef(data) || (typeof data === 'object' && data !== null && '__v_isRef' in data)
      ? (data as ComputedRef<Record<string, unknown>>).value
      : data as Record<string, unknown>

    // 🔥 关键修复：防止无限循环计算 - 检查数据是否真的变化
    const currentDataHash = JSON.stringify(currentData) + JSON.stringify(unifiedConfig.value.component)
    if (currentDataHash === lastDisplayDataHash) {
      // 数据未变化，使用缓存结果（不输出日志避免循环）
      return lastDisplayDataResult
    }

    lastDisplayDataHash = currentDataHash

    // 🔥 完全移除开发模式日志，避免触发响应式更新
    // 计算属性必须是纯函数，不应该有任何副作用（包括异步日志）

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

      // 🔥 关键修复：缓存结果，移除所有日志避免响应式循环
      lastDisplayDataResult = dataSourceResults

      return dataSourceResults
    }

    // 🔥 核心修复：没有数据源结果时，直接使用统一配置的组件配置
    // 移除对初始config的依赖，确保完全响应unifiedConfig.component的变化
    const result = {
      ...unifiedConfig.value.component  // 🔥 关键：只使用统一配置，移除初始config的干扰
    }

    // 🔥 关键修复：缓存结果，完全移除日志避免响应式循环
    lastDisplayDataResult = result

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
      const { propertyExposureManager } = await import('@/card2.1/core/PropertyExposureManager')

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
        console.log(`🔒 [useCard2Props] 组件 ${componentId} 没有配置属性白名单`)
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

      // 🔒 同步到编辑器节点的metadata
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

      console.log(`🔒 [useCard2Props] 安全暴露白名单属性 ${componentId}:`, {
        白名单属性数: Object.keys(whitelistedProperties).length,
        实际暴露数: Object.keys(safeExposedProperties).length,
        暴露的属性: Object.keys(safeExposedProperties),
        白名单配置: whitelistedProperties
      })
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

  // 🔥 关键修复：性能优化的监听器 - 解决200+组件的循环触发问题
  let watchDebounceTimer: NodeJS.Timeout | null = null
  let isProcessingChange = false // 防止递归处理

  watch(
    () => unifiedConfig.value.component,
    (newComponent, oldComponent) => {
      // 🔥 关键修复1：防止递归处理
      if (isProcessingChange) {
        console.log(`🔥 [useCard2Props] 跳过递归处理 ${componentId}`)
        return
      }

      // 🔥 关键修复2：防抖处理，避免频繁触发
      if (watchDebounceTimer) {
        clearTimeout(watchDebounceTimer)
      }

      watchDebounceTimer = setTimeout(async () => {
        isProcessingChange = true
        try {
          console.log(`🔥 [useCard2Props] 防抖处理配置变化 ${componentId}`)

          // 重新暴露白名单属性（但不触发额外事件）
          await exposeWhitelistedProperties()

          // 🔥 关键修复3：只在真正有变化且非初始化时处理
          if (componentId && newComponent && oldComponent && JSON.stringify(newComponent) !== JSON.stringify(oldComponent)) {
            // 批量收集所有需要处理的属性变化
            const changedProperties = []

            Object.keys(newComponent).forEach(propertyName => {
              const newValue = newComponent[propertyName]
              const oldValue = oldComponent?.[propertyName]

              if (newValue !== oldValue) {
                changedProperties.push({ propertyName, newValue, oldValue })
              }
            })

            if (changedProperties.length > 0) {
              console.log(`🔥 [useCard2Props] 批量处理 ${changedProperties.length} 个属性变化:`, {
                componentId,
                properties: changedProperties.map(p => p.propertyName)
              })

              // 🔥 关键修复4：使用 requestIdleCallback 或 nextTick 异步处理，避免阻塞
              const processChanges = async () => {
                for (const { propertyName, newValue, oldValue } of changedProperties) {
                  // 触发内部属性监听器
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

                  // 🔥 关键修复5：大幅优化绑定检查 - 只对可能有绑定的属性进行检查
                  const propertyPath = `${componentId}.component.${propertyName}`

                  try {
                    // 使用优化的绑定检查（带缓存）
                    const hasBinding = await checkPropertyBinding(componentId, propertyPath)

                    if (hasBinding) {
                      console.log(`🔥 [useCard2Props] 属性 ${propertyName} 有绑定，异步触发数据源更新`)

                      // 异步触发，避免阻塞当前处理
                      setTimeout(async () => {
                        try {
                          const { interactionManager } = await import('@/card2.1/core/interaction-manager')
                          interactionManager.notifyPropertyUpdate(componentId, propertyPath, newValue, oldValue)
                        } catch (error) {
                          console.error(`❌ [useCard2Props] 异步数据源更新失败:`, error)
                        }
                      }, 50) // 50ms延迟，让当前更新完成
                    }

                    // 发送属性变化事件（但不立即触发更多处理）
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('property-change', {
                        detail: {
                          componentId,
                          propertyName,
                          propertyPath,
                          oldValue,
                          newValue,
                          source: hasBinding ? 'bound-property-change' : 'unbound-property-change',
                          hasBinding,
                          timestamp: Date.now(),
                          batchProcessed: true
                        }
                      }))
                    }, 100)
                  } catch (error) {
                    console.error(`❌ [useCard2Props] 属性绑定检查失败:`, {
                      componentId,
                      propertyName,
                      error: error instanceof Error ? error.message : error
                    })
                  }
                }
              }

              // 使用 requestIdleCallback 或 setTimeout 进行异步处理
              if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => processChanges())
              } else {
                setTimeout(() => processChanges(), 0)
              }
            }
          }
        } finally {
          isProcessingChange = false
          watchDebounceTimer = null
        }
      }, 150) // 防抖延迟150ms，减少频繁触发
    },
    {
      deep: true,
      immediate: false, // 🔥 关键修复：不立即执行，避免初始化时的大量触发
      flush: 'post' // 🔥 在DOM更新后执行，避免与响应式更新冲突
    }
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
      console.log(`🧹 [useCard2Props] 清理组件 ${componentId} 的绑定缓存，清理了 ${keysToDelete.length} 个条目`)
    } else {
      // 清理所有缓存
      const cacheSize = propertyBindingCache.size
      propertyBindingCache.clear()
      console.log(`🧹 [useCard2Props] 清理所有绑定缓存，清理了 ${cacheSize} 个条目`)
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