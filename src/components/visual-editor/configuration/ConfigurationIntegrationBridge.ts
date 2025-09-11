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
import { editorDataSourceManager } from '@/components/visual-editor/core/EditorDataSourceManager'
// 🔥 导入数据缓存清理功能，确保配置变更时数据一致性
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 修复：导入配置事件总线，确保配置变更时发出事件
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
   * 🔥 新增：自动迁移组件级设备配置到基础配置
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null {
    const config = configurationStateManager.getConfiguration(widgetId)
    if (!config) return null

    // 🚀 执行配置迁移检查和处理
    return this.migrateConfigurationIfNeeded(widgetId, config)
  }

  /**
   * 设置组件配置
   * 🔥 新增：设置时自动迁移旧格式配置
   * @param widgetId 组件ID
   * @param config 配置对象
   * @param componentType 组件类型，用于更精确的事件追踪
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration, componentType?: string): void {
    // 🚀 在设置前执行迁移检查，确保配置结构正确
    const migratedConfig = this.performDeviceConfigurationMigrationForSet(widgetId, config)

    const updated = configurationStateManager.setConfiguration(widgetId, migratedConfig, 'user')

    if (updated) {
      // 🔥 关键修复：配置更新时清理缓存，确保数据一致性
      simpleDataBridge.clearComponentCache(widgetId)

      // 🔥 修复：发出配置变更事件，使用正确的事件格式
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // 使用传入的组件类型或默认为 'widget'
        section: 'dataSource', // 配置全量更新时使用 dataSource
        oldConfig: null, // 可以改进为保存之前的配置
        newConfig: migratedConfig,
        timestamp: Date.now(),
        source: 'user'
      }
      configEventBus.emitConfigChange(changeEvent)
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
    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'user')

    if (updated) {
      // 🔥 关键修复：配置部分更新时清理缓存，特别是 dataSource 更新
      if (section === 'dataSource' || section === 'component') {
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 修复：发出配置部分更新事件，使用正确的 API
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // 使用传入的组件类型或默认为 'widget'
        section: section as 'base' | 'component' | 'dataSource' | 'interaction',
        oldConfig: null,
        newConfig: config,
        timestamp: Date.now(),
        source: 'user'
      }
      configEventBus.emitConfigChange(changeEvent)
    }
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
        console.warn(`❌ [ConfigurationMigration] 导入的配置验证失败: ${widgetId}`)
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
   * 设置与EditorDataSourceManager的集成
   */
  private async setupEditorDataSourceIntegration(): Promise<void> {
    try {
      // 确保EditorDataSourceManager已初始化
      if (!editorDataSourceManager.isInitialized()) {
        await editorDataSourceManager.initialize()
      }
    } catch (error) {}
  }

  /**
   * 为特定组件设置数据源执行集成
   */
  setupComponentDataSourceIntegration(componentId: string): void {
    // 订阅该组件的配置更新 - 新的无循环架构
    configurationStateManager.onConfigurationUpdate(componentId, async (event: ConfigurationUpdateEvent) => {
      // 只有数据源配置变更且shouldExecute为true时才触发执行
      if (event.section === 'dataSource' && event.shouldExecute) {
        try {
          // 确保EditorDataSourceManager已初始化
          if (!editorDataSourceManager.isInitialized()) {
            await editorDataSourceManager.initialize()
          }

          // 触发数据更新 - 新的无循环架构
          await editorDataSourceManager.triggerDataUpdate(componentId)
        } catch (error) {}
      }
    })
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
