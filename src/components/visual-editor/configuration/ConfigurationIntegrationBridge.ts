/**
 * 配置集成桥接器
 * 在新的ConfigurationStateManager和现有系统之间提供兼容层
 *
 * 职责：
 * 1. 适配现有的ConfigurationManager接口
 * 2. 集成EditorDataSourceManager的事件处理
 * 3. 提供平滑的迁移路径
 * 4. 维持向后兼容性
 */

import { configurationStateManager, type ConfigurationUpdateEvent } from '@/components/visual-editor/configuration/ConfigurationStateManager'
// 导入数据缓存清理功能，确保配置变更时数据一致性
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 修复：导入配置事件总线，确保配置变更时发出事件
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
import type {
  IConfigurationManager,
  WidgetConfiguration,
  ValidationResult,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './types'

/**
 * 配置集成桥接器类
 * 提供与现有ConfigurationManager兼容的接口，内部使用新的ConfigurationStateManager
 */
export class ConfigurationIntegrationBridge implements IConfigurationManager {
  private initialized = false

  // 🔥 新增：配置变更去重缓存，防止重复触发
  private configChangeCache = new Map<string, {
    lastConfigHash: string
    lastUpdateTime: number
    pendingEventTimeout?: NodeJS.Timeout
  }>()

  // 配置变更去重的时间窗口（毫秒）
  private readonly CONFIG_CHANGE_DEBOUNCE_TIME = 300

  /**
   * 初始化桥接器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    // 初始化配置状态管理器
    // 设置与EditorDataSourceManager的集成
    await this.setupEditorDataSourceIntegration()

    this.initialized = true
  }

  /**
   * 获取组件配置
   * 新增：自动迁移组件级设备配置到基础配置
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null {
    const config = configurationStateManager.getConfiguration(widgetId)
    if (!config) return null

    // 🚀 执行配置迁移检查和处理
    return this.migrateConfigurationIfNeeded(widgetId, config)
  }

  /**
   * 设置组件配置
   * 新增：设置时自动迁移旧格式配置
   * @param widgetId 组件ID
   * @param config 配置对象
   * @param componentType 组件类型，用于更精确的事件追踪
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration, componentType?: string): void {
    console.log(`🎯 用户要求的打印这几个字 - 阶段D3：ConfigurationIntegrationBridge.setConfiguration被调用`, {
      组件ID: widgetId,
      组件类型: componentType,
      配置内容: config
    })

    // 🚀 在设置前执行迁移检查，确保配置结构正确
    const migratedConfig = this.performDeviceConfigurationMigrationForSet(widgetId, config)

    const updated = configurationStateManager.setConfiguration(widgetId, migratedConfig, 'user')
    console.log(`🎯 用户要求的打印这几个字 - 阶段D4：ConfigurationIntegrationBridge.setConfiguration更新结果`, {
      更新成功: updated,
      将触发事件链: !!updated
    })

    if (updated) {
      // 关键修复：配置更新时清理缓存，确保数据一致性
      simpleDataBridge.clearComponentCache(widgetId)

      // 🔥 检查数据源配置内容
      console.log(`🔥 [setConfiguration] 准备发送事件，检查数据源配置:`, {
        组件ID: widgetId,
        有数据源配置: !!migratedConfig.dataSource,
        数据源配置内容: migratedConfig.dataSource,
        数据源类型: typeof migratedConfig.dataSource
      })

      const shouldTrigger = this.shouldTriggerDataExecution('dataSource', migratedConfig.dataSource)
      console.log(`🔥 [setConfiguration] shouldTriggerDataExecution 返回值: ${shouldTrigger}`)

      // 修复：发出配置变更事件，使用正确的事件格式
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // 使用传入的组件类型或默认为 'widget'
        section: 'dataSource', // 配置全量更新时使用 dataSource
        oldConfig: null, // 可以改进为保存之前的配置
        newConfig: migratedConfig,
        timestamp: Date.now(),
        source: 'user',
        context: {
          // 🔥 关键修复：setConfiguration 时也需要设置触发标记
          shouldTriggerExecution: shouldTrigger
        }
      }
      console.log(`🎯 用户要求的打印这几个字 - 阶段F1：ConfigurationIntegrationBridge准备发送configEventBus.emitConfigChange事件`, {
        事件详情: changeEvent,
        组件ID: widgetId,
        配置节: 'dataSource'
      })
      configEventBus.emitConfigChange(changeEvent)
      console.log(`🎯 用户要求的打印这几个字 - 阶段F2：ConfigurationIntegrationBridge已发送configEventBus.emitConfigChange事件`)
    }
  }

  /**
   * 新增：跨组件交互专用配置更新 - 强制触发事件
   * @param widgetId 组件ID
   * @param section 配置节
   * @param config 配置数据
   * @param componentType 组件类型
   */
  updateConfigurationForInteraction<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K],
    componentType?: string
  ): boolean {
    // 关键：使用强制更新，确保即使配置相同也触发事件
    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'interaction', true)

    if (updated) {
      // 🔥 关键修复：配置部分更新时清理缓存，特别是 dataSource 更新
      if (section === 'dataSource' || section === 'component') {
        console.log(`🔥 [ConfigurationIntegrationBridge] 清理 simpleDataBridge 缓存:`, { widgetId, section })
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 新增：对于 base 层配置更新（deviceId、metricsList等），也需要触发数据源重新执行
      if (section === 'base') {
        console.log(`🔥 [ConfigurationIntegrationBridge] 基础配置更新，清理缓存:`, { widgetId, config })
        simpleDataBridge.clearComponentCache(widgetId)

        // 🔥 修复：不再手动触发数据源重新执行，让正常的事件流程处理
        // 避免多重执行导致的请求竞争和参数混乱
        console.log(`🔥 [ConfigurationIntegrationBridge] base层配置更新，依赖正常事件流程触发数据源`)
      }

      // 🔥 修复：发出配置部分更新事件，使用正确的 API
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // 使用传入的组件类型或默认为 'widget'
        section: section as 'base' | 'component' | 'dataSource' | 'interaction',
        oldConfig: null,
        newConfig: config,
        timestamp: Date.now(),
        source: 'interaction',  // 🔥 标记为交互触发
        context: {
          // 🔥 关键修复：交互触发时也需要设置触发标记
          shouldTriggerExecution: this.shouldTriggerDataExecution(section, config)
        }
      }

      console.log(`🔥 [ConfigurationIntegrationBridge] 即将发送跨组件交互事件:`, changeEvent)
      configEventBus.emitConfigChange(changeEvent)
      console.log(`🔥 [ConfigurationIntegrationBridge] 跨组件交互事件已发送`)

      // 🔥 关键修复：发送 card2-config-update 事件，让组件能接收到配置更新
      console.log(`🔥 [ConfigurationIntegrationBridge] 发送跨组件 card2-config-update 事件:`, {
        componentId: widgetId,
        layer: section,
        config: config
      })

      window.dispatchEvent(new CustomEvent('card2-config-update', {
        detail: {
          componentId: widgetId,
          layer: section,
          config: config
        }
      }))

      // 跨组件配置更新事件已发送
      return true  // 🔥 返回成功状态
    } else {
      console.error(`❌ [ConfigurationIntegrationBridge] 跨组件交互配置更新失败，事件不会触发`)
      return false  // 🔥 返回失败状态
    }
  }

  /**
   * 更新配置的某个部分 - 关键方法
   * @param widgetId 组件ID
   * @param section 配置节
   * @param config 配置数据
   * @param componentType 组件类型，用于更精确的事件追踪
   */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K],
    componentType?: string
  ): void {
    // 🔥 关键修复：检查是否为真实的配置变更，避免无意义的重复触发
    if (!this.isRealConfigChange(widgetId, section, config)) {
      console.log(`⏭️ [ConfigurationIntegrationBridge] 跳过重复配置更新:`, {
        组件ID: widgetId,
        配置节: section,
        原因: '配置内容未发生实际变化'
      })
      return // 提前返回，避免无意义的更新和事件触发
    }

    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'user')

    if (updated) {
      // 关键修复：配置部分更新时清理缓存，特别是 dataSource 更新
      if (section === 'dataSource' || section === 'component') {
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 对于base层配置更新（deviceId、metricsList等），触发数据源重新执行
      if (section === 'base') {
        console.log(`🔥 [ConfigurationIntegrationBridge] base层配置更新，清理缓存:`, { widgetId, config })
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 使用防抖机制发送配置变更事件，避免短时间内的重复事件
      this.debounceConfigEvent(() => {
        const changeEvent: ConfigChangeEvent = {
          componentId: widgetId,
          componentType: componentType || 'widget',
          section: section as 'base' | 'component' | 'dataSource' | 'interaction',
          oldConfig: null,
          newConfig: config,
          timestamp: Date.now(),
          source: 'user',
          context: {
            // 🔥 智能判断是否需要触发数据源执行
            // 只有真正影响数据获取的配置变更才触发
            shouldTriggerExecution: this.shouldTriggerDataExecution(section, config)
          }
        }

        console.log(`📤 [ConfigurationIntegrationBridge] 发送防抖配置变更事件:`, {
          组件ID: widgetId,
          配置节: section,
          是否触发数据执行: changeEvent.context?.shouldTriggerExecution
        })

        configEventBus.emitConfigChange(changeEvent)

        // 发送 card2-config-update 事件，让组件能接收到配置更新
        window.dispatchEvent(new CustomEvent('card2-config-update', {
          detail: {
            componentId: widgetId,
            layer: section,
            config: config
          }
        }))
      }, widgetId, section)
    }
  }

  /**
   * 🔥 新增：智能判断配置变更是否需要触发数据源执行
   * @param section 配置节
   * @param config 配置内容
   * @returns 是否需要触发数据执行
   */
  private shouldTriggerDataExecution(section: keyof WidgetConfiguration, config: any): boolean {
    console.log(`🔥 [ConfigurationIntegrationBridge] shouldTriggerDataExecution 判断:`, {
      section,
      config,
      configType: typeof config,
      hasConfig: !!config
    })

    // base 层的 deviceId、metricsList 等字段变更需要触发
    if (section === 'base') {
      const criticalBaseFields = ['deviceId', 'metricsList']
      const shouldTrigger = criticalBaseFields.some(field => config.hasOwnProperty(field))
      console.log(`🔥 [shouldTriggerDataExecution] base层判断结果: ${shouldTrigger}`, {
        criticalBaseFields,
        configFields: Object.keys(config || {})
      })
      return shouldTrigger
    }

    // dataSource 层的变更通常需要触发
    if (section === 'dataSource') {
      console.log(`🔥 [shouldTriggerDataExecution] dataSource层，直接返回 true`)
      return true
    }

    // component 层需要检查是否包含动态参数绑定
    if (section === 'component') {
      // 这里可以添加更复杂的逻辑来检测是否有属性绑定变更
      console.log(`🔥 [shouldTriggerDataExecution] component层，返回 false`)
      return false // 暂时不触发，避免过度执行
    }

    // interaction 层通常不需要触发数据执行
    console.log(`🔥 [shouldTriggerDataExecution] ${section}层，返回 false`)
    return false
  }

  /**
   * 重置配置到默认值
   */
  resetConfiguration(widgetId: string): void {
    // 创建默认配置
    const defaultConfig: WidgetConfiguration = {
      base: {},
      component: {},
      dataSource: {},
      interaction: {},
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: 'Reset to default'
      }
    }

    configurationStateManager.setConfiguration(widgetId, defaultConfig, 'system')
    // 🔥 重置时也需要清理缓存
    simpleDataBridge.clearComponentCache(widgetId)
  }

  /**
   * 初始化组件配置
   */
  initializeConfiguration(widgetId: string, customDefaults?: Partial<WidgetConfiguration>): void {
    // 先初始化默认配置
    configurationStateManager.initializeConfiguration(widgetId)

    // 如果有自定义默认值，应用它们
    if (customDefaults) {
      const currentConfig = configurationStateManager.getConfiguration(widgetId)
      if (currentConfig) {
        const mergedConfig = this.deepMerge(currentConfig, customDefaults)
        configurationStateManager.setConfiguration(widgetId, mergedConfig, 'system')
      }
    }
  }

  /**
   * 删除组件配置
   */
  removeConfiguration(widgetId: string): boolean {
    const result = configurationStateManager.removeConfiguration(widgetId)

    if (result) {
      // 🔥 删除配置时清理相关缓存
      simpleDataBridge.clearComponentCache(widgetId)
    }

    return result
  }

  /**
   * 验证配置
   */
  validateConfiguration(config: WidgetConfiguration): ValidationResult {
    // 这里可以复用原来的验证逻辑
    // 为了简化，先返回总是验证成功
    return {
      valid: true,
      warnings: []
    }
  }

  /**
   * 导出配置
   */
  exportConfiguration(widgetId: string): string {
    const config = configurationStateManager.getConfiguration(widgetId)
    if (!config) {
      throw new Error(`配置不存在: ${widgetId}`)
    }

    try {
      return JSON.stringify(config, null, 2)
    } catch (error) {
      throw new Error(`配置导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导入配置
   * 🔥 新增：导入时自动迁移旧格式配置
   */
  importConfiguration(widgetId: string, configData: string): boolean {
    try {
      const config = JSON.parse(configData) as WidgetConfiguration

      // 🚀 先迁移再验证，确保导入的配置结构正确
      const migratedConfig = this.migrateConfigurationIfNeeded(widgetId, config)

      // 简单验证
      const validationResult = this.validateConfiguration(migratedConfig)
      if (!validationResult.valid) {
        console.error(`❌ [ConfigurationMigration] 导入的配置验证失败: ${widgetId}`)
        return false
      }

      // 保存迁移后的配置
      configurationStateManager.setConfiguration(widgetId, migratedConfig, 'import')

      if (process.env.NODE_ENV === 'development') {
      }
      return true
    } catch (error) {
      console.error(`❌ [ConfigurationMigration] 配置导入失败: ${widgetId}`, error)
      return false
    }
  }

  /**
   * 监听配置变化 - 兼容原接口
   */
  onConfigurationChange(widgetId: string, callback: (config: WidgetConfiguration) => void): () => void {
    return configurationStateManager.onConfigurationUpdate(widgetId, (event: ConfigurationUpdateEvent) => {
      // 获取最新的完整配置并传递给回调
      const fullConfig = configurationStateManager.getConfiguration(widgetId)
      if (fullConfig) {
        callback(fullConfig)
      }
    })
  }

  /**
   * 获取所有配置
   */
  getAllConfigurations(): Map<string, WidgetConfiguration> {
    const allStates = configurationStateManager.getAllConfigurationStates()
    const result = new Map<string, WidgetConfiguration>()

    for (const [componentId, state] of allStates) {
      result.set(componentId, state.configuration)
    }

    return result
  }

  /**
   * 批量更新配置
   */
  batchUpdateConfigurations(updates: Array<{ widgetId: string; config: Partial<WidgetConfiguration> }>): void {
    const timestamp = Date.now()

    for (const { widgetId, config } of updates) {
      const currentConfig = configurationStateManager.getConfiguration(widgetId)
      if (currentConfig) {
        const updatedConfig = {
          ...this.deepMerge(currentConfig, config),
          metadata: {
            ...currentConfig.metadata,
            updatedAt: timestamp
          }
        }
        configurationStateManager.setConfiguration(widgetId, updatedConfig, 'system')
      }
    }
  }

  // ========== 私有方法 ==========

  /**
   * 🔥 新增：计算配置对象的哈希值，用于检测真实变更
   * @param config 配置对象
   * @returns 配置哈希值
   */
  private calculateConfigHash(config: any): string {
    try {
      // 使用 JSON.stringify 并排序键来生成一致的哈希
      const sortedConfig = this.sortObjectKeys(config)
      const configString = JSON.stringify(sortedConfig)
      return this.simpleHash(configString)
    } catch (error) {
      // 如果JSON序列化失败，使用对象字符串表示
      return this.simpleHash(String(config))
    }
  }

  /**
   * 🔥 新增：递归排序对象键，确保哈希一致性
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }

    const sortedObj: any = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    }

    return sortedObj
  }

  /**
   * 🔥 新增：简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * 🔥 新增：检查配置变更是否为真实变更（避免重复事件）
   * @param widgetId 组件ID
   * @param section 配置节
   * @param newConfig 新配置
   * @returns 是否为真实变更
   */
  private isRealConfigChange(widgetId: string, section: keyof WidgetConfiguration, newConfig: any): boolean {
    const cacheKey = `${widgetId}.${section}`
    const configHash = this.calculateConfigHash(newConfig)
    const now = Date.now()

    const cached = this.configChangeCache.get(cacheKey)

    if (cached) {
      // 检查是否是相同的配置
      if (cached.lastConfigHash === configHash) {
        // 配置相同，检查时间间隔
        const timeDiff = now - cached.lastUpdateTime
        if (timeDiff < this.CONFIG_CHANGE_DEBOUNCE_TIME) {
          console.log(`🔄 [ConfigurationIntegrationBridge] 检测到重复配置变更，跳过事件:`, {
            组件ID: widgetId,
            配置节: section,
            时间间隔: timeDiff,
            配置哈希: configHash
          })
          return false // 不是真实变更
        }
      }

      // 清理之前的待处理事件
      if (cached.pendingEventTimeout) {
        clearTimeout(cached.pendingEventTimeout)
      }
    }

    // 更新缓存
    this.configChangeCache.set(cacheKey, {
      lastConfigHash: configHash,
      lastUpdateTime: now
    })

    console.log(`✅ [ConfigurationIntegrationBridge] 检测到真实配置变更:`, {
      组件ID: widgetId,
      配置节: section,
      配置哈希: configHash,
      是否首次: !cached
    })

    return true // 是真实变更
  }

  /**
   * 🔥 新增：防抖事件发送，避免短时间内的重复事件
   * @param eventCallback 事件回调函数
   * @param widgetId 组件ID
   * @param section 配置节
   */
  private debounceConfigEvent(
    eventCallback: () => void,
    widgetId: string,
    section: keyof WidgetConfiguration
  ): void {
    const cacheKey = `${widgetId}.${section}`
    const cached = this.configChangeCache.get(cacheKey)

    if (cached?.pendingEventTimeout) {
      clearTimeout(cached.pendingEventTimeout)
    }

    const timeout = setTimeout(() => {
      eventCallback()

      // 清理超时引用
      const currentCached = this.configChangeCache.get(cacheKey)
      if (currentCached) {
        delete currentCached.pendingEventTimeout
      }
    }, 50) // 50ms 防抖延迟

    if (cached) {
      cached.pendingEventTimeout = timeout
    } else {
      this.configChangeCache.set(cacheKey, {
        lastConfigHash: '',
        lastUpdateTime: Date.now(),
        pendingEventTimeout: timeout
      })
    }
  }

  /**
   * 🔥 新增：配置迁移核心逻辑
   * 检查并迁移组件级设备配置到基础配置层
   * @param widgetId 组件ID
   * @param config 原始配置
   * @returns 迁移后的配置
   */
  private migrateConfigurationIfNeeded(widgetId: string, config: WidgetConfiguration): WidgetConfiguration {
    // 检查组件配置中是否包含设备字段
    const componentConfig = config.component || {}
    const hasDeviceFields = this.hasComponentLevelDeviceFields(componentConfig)

    if (!hasDeviceFields) {
      // 无需迁移，直接返回原配置
      return config
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // 执行迁移
    const migrationResult = this.performDeviceConfigurationMigration(config)

    // 🚀 只有实际迁移了才保存配置
    if (migrationResult.migrated) {
      configurationStateManager.setConfiguration(widgetId, migrationResult.config, 'migration')
      if (process.env.NODE_ENV === 'development') {
      }
    }

    return migrationResult.config
  }

  /**
   * 检查组件配置是否包含设备字段
   * @param componentConfig 组件配置对象
   * @returns 是否包含设备字段
   */
  private hasComponentLevelDeviceFields(componentConfig: any): boolean {
    if (!componentConfig || typeof componentConfig !== 'object') {
      return false
    }

    // 检查直接设备字段
    const hasDirectDeviceFields = !!(componentConfig.deviceId || componentConfig.metricsList)

    // 检查嵌套在customize中的设备字段（兼容某些组件结构）
    const hasNestedDeviceFields = !!(componentConfig.customize?.deviceId || componentConfig.customize?.metricsList)

    return hasDirectDeviceFields || hasNestedDeviceFields
  }

  /**
   * 执行设备配置迁移
   * 将组件级设备字段迁移到基础配置层
   * @param config 原始配置
   * @returns 迁移后的配置
   */
  private performDeviceConfigurationMigration(config: WidgetConfiguration): {
    config: WidgetConfiguration
    migrated: boolean
  } {
    const result = this.deepClone(config)
    let hasMigrated = false

    // 确保基础配置存在
    if (!result.base) {
      result.base = {}
    }

    const componentConfig = result.component || {}

    // 🚀 迁移设备ID
    if (componentConfig.deviceId && !result.base.deviceId) {
      result.base.deviceId = componentConfig.deviceId
      delete componentConfig.deviceId
      if (process.env.NODE_ENV === 'development') {
      }
      hasMigrated = true
    }

    // 🚀 迁移指标列表
    if (componentConfig.metricsList && !result.base.metricsList) {
      result.base.metricsList = Array.isArray(componentConfig.metricsList) ? componentConfig.metricsList : []
      delete componentConfig.metricsList
      if (process.env.NODE_ENV === 'development') {
      }
      hasMigrated = true
    }

    // 🚀 处理嵌套在customize中的设备字段
    if (componentConfig.customize) {
      if (componentConfig.customize.deviceId && !result.base.deviceId) {
        result.base.deviceId = componentConfig.customize.deviceId
        delete componentConfig.customize.deviceId
        if (process.env.NODE_ENV === 'development') {
        }
        hasMigrated = true
      }

      if (componentConfig.customize.metricsList && !result.base.metricsList) {
        result.base.metricsList = Array.isArray(componentConfig.customize.metricsList)
          ? componentConfig.customize.metricsList
          : []
        delete componentConfig.customize.metricsList
        if (process.env.NODE_ENV === 'development') {
        }
        hasMigrated = true
      }
    }

    // 🔥 修复：只对实际执行了迁移的配置更新元数据
    if (hasMigrated) {
      if (!result.metadata) {
        result.metadata = {}
      }
      result.metadata.migrationVersion = '2.0'
      result.metadata.migratedAt = Date.now()
      result.metadata.updatedAt = Date.now()
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
    }

    return { config: result, migrated: hasMigrated }
  }

  /**
   * 🔥 新增：为setConfiguration专门设计的迁移逻辑
   * 与migrateConfigurationIfNeeded类似，但不自动保存，避免循环调用
   * @param widgetId 组件ID
   * @param config 待设置的配置
   * @returns 迁移后的配置
   */
  private performDeviceConfigurationMigrationForSet(
    widgetId: string,
    config: WidgetConfiguration
  ): WidgetConfiguration {
    // 检查是否需要迁移
    const componentConfig = config.component || {}
    const hasDeviceFields = this.hasComponentLevelDeviceFields(componentConfig)

    if (!hasDeviceFields) {
      // 无需迁移，直接返回原配置
      return config
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // 执行迁移但不自动保存（避免循环调用setConfiguration）
    const migrationResult = this.performDeviceConfigurationMigration(config)

    if (migrationResult.migrated) {
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
    }

    return migrationResult.config
  }

  /**
   * 设置数据源集成 (已迁移到核心数据架构系统)
   */
  private async setupEditorDataSourceIntegration(): Promise<void> {
    try {
      // 🔥 已迁移：数据源管理现在通过核心数据架构系统处理
      // VisualEditorBridge 和 DataWarehouse 提供统一的数据源服务
      console.log('🔥 [ConfigurationIntegrationBridge] 数据源集成已迁移到核心架构系统')
    } catch (error) {}
  }

  /**
   * 为特定组件设置数据源执行集成 (已迁移到核心数据架构系统)
   */
  setupComponentDataSourceIntegration(componentId: string): void {
    // 🔥 已迁移：数据源执行集成现在通过 ConfigEventBus 和 VisualEditorBridge 处理
    // 配置变更事件会自动触发 VisualEditorBridge 更新组件执行器
    console.log(`🔥 [ConfigurationIntegrationBridge] 组件数据源集成已迁移到核心架构系统: ${componentId}`)

    // 核心架构系统会自动处理配置变更和数据源执行
    // 通过 ConfigEventBus 事件和 EditorDataSourceManager 的事件监听器
  }

  /**
   * 🔥 新增：触发数据源重新执行
   * 当base层配置（如deviceId、metricsList等动态参数）变更时调用
   * @param componentId 组件ID
   * @param componentType 组件类型
   */
  private async triggerDataSourceReExecution(componentId: string, componentType: string): Promise<void> {
    try {
      console.log(`🔥 [ConfigurationIntegrationBridge] 触发数据源重新执行:`, {
        componentId,
        componentType,
        reason: 'base层动态参数变更'
      })

      // 获取当前组件的数据源配置
      const currentConfig = configurationStateManager.getConfiguration(componentId)
      const dataSourceConfig = currentConfig?.dataSource

      if (!dataSourceConfig || !dataSourceConfig.dataSources || dataSourceConfig.dataSources.length === 0) {
        console.log(`🔥 [ConfigurationIntegrationBridge] 组件 ${componentId} 没有数据源配置，跳过重新执行`)
        return
      }

      console.log(`🔥 [ConfigurationIntegrationBridge] 组件 ${componentId} 有数据源配置，开始重新执行:`, {
        dataSourcesCount: dataSourceConfig.dataSources.length,
        dataSourceTypes: dataSourceConfig.dataSources.map(ds => ds.type)
      })

      // 🔥 关键：清理缓存确保获取最新数据
      simpleDataBridge.clearComponentCache(componentId)

      // 🔥 使用 VisualEditorBridge 重新执行数据源
      const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
      const visualEditorBridge = getVisualEditorBridge()

      // 🔥 关键修复：传入完整的配置对象，而不是仅仅数据源配置
      // VisualEditorBridge需要完整配置来正确注入base层属性到数据源参数中
      const fullConfig = {
        base: currentConfig?.base || {},
        dataSource: dataSourceConfig,
        component: currentConfig?.component || {},
        interaction: currentConfig?.interaction || {}
      }

      console.log(`🔥 [ConfigurationIntegrationBridge] 传递完整配置给VisualEditorBridge:`, {
        componentId,
        hasBase: !!fullConfig.base,
        baseConfig: fullConfig.base,
        hasDataSource: !!fullConfig.dataSource,
        dataSourceKeys: Object.keys(fullConfig.dataSource || {})
      })

      // 重新执行数据源，传入完整的配置对象
      const result = await visualEditorBridge.updateComponentExecutor(
        componentId,
        componentType,
        fullConfig // 传递完整配置，确保base层属性能被正确注入
      )

      // 数据源重新执行完成

      // 重要：发出数据源执行完成事件，通知其他系统组件
      configEventBus.emitConfigChange({
        componentId,
        componentType,
        section: 'dataSource',
        oldConfig: null,
        newConfig: dataSourceConfig,
        timestamp: Date.now(),
        source: 'dynamic-parameter-update'
      })

    } catch (error) {
      console.error(`❌ [ConfigurationIntegrationBridge] 数据源重新执行失败 ${componentId}:`, error)
      // 不抛出错误，避免影响其他流程
    }
  }

  /**
   * 深度合并对象
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target)

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (sourceValue !== undefined) {
          if (
            typeof sourceValue === 'object' &&
            sourceValue !== null &&
            typeof targetValue === 'object' &&
            targetValue !== null &&
            !Array.isArray(sourceValue) &&
            !Array.isArray(targetValue)
          ) {
            result[key] = this.deepMerge(targetValue, sourceValue as any)
          } else {
            result[key] = this.deepClone(sourceValue) as any
          }
        }
      }
    }

    return result
  }

  /**
   * 深克隆对象
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }
}

// 创建全局桥接器实例
export const configurationIntegrationBridge = new ConfigurationIntegrationBridge()

// 向后兼容的导出
export const configurationManager = configurationIntegrationBridge
