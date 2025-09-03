/**
 * 统一配置服务类
 * 替代原有的ConfigurationManager，提供清晰的配置管理API
 */

import { useUnifiedEditorStore } from './unified-editor'
import type {
  WidgetConfiguration,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './unified-editor'

/**
 * 配置变更事件类型
 */
export interface ConfigurationChangeEvent {
  widgetId: string
  section: keyof WidgetConfiguration
  oldValue: any
  newValue: any
  timestamp: Date
}

/**
 * 配置验证结果
 */
export interface ConfigurationValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 配置迁移信息
 */
export interface ConfigurationMigration {
  fromVersion: string
  toVersion: string
  migrate: (config: any) => any
}

/**
 * 统一配置服务类
 * 🔥 这是配置管理的唯一入口，替代所有分散的配置管理逻辑
 */
export class ConfigurationService {
  private store = useUnifiedEditorStore()
  private eventBus = new EventTarget()
  private migrations: ConfigurationMigration[] = []

  // ==================== 核心配置操作 ====================

  /**
   * 获取完整的组件配置
   * 🔥 唯一的配置获取入口
   */
  getConfiguration(widgetId: string): WidgetConfiguration {
    return this.store.getFullConfiguration(widgetId)
  }

  /**
   * 获取特定部分的配置
   */
  getConfigurationSection<T extends keyof WidgetConfiguration>(widgetId: string, section: T): WidgetConfiguration[T] {
    const fullConfig = this.getConfiguration(widgetId)
    return fullConfig[section]
  }

  /**
   * 设置完整的组件配置
   */
  setConfiguration(widgetId: string, configuration: WidgetConfiguration): void {
    // 验证配置
    const validation = this.validateConfiguration(configuration)
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
    }

    // 获取旧配置用于事件
    const oldConfig = this.getConfiguration(widgetId)

    // 分别设置各个部分
    if (configuration.base) {
      this.store.setBaseConfiguration(widgetId, configuration.base)
    }
    if (configuration.component) {
      this.store.setComponentConfiguration(widgetId, configuration.component)
    }
    if (configuration.dataSource) {
      this.store.setDataSourceConfiguration(widgetId, configuration.dataSource)
    }
    if (configuration.interaction) {
      this.store.setInteractionConfiguration(widgetId, configuration.interaction)
    }

    // 触发全局配置变更事件
    this.emitConfigurationChange(widgetId, 'full', oldConfig, configuration)
  }

  /**
   * 更新特定部分的配置
   * 🔥 类型安全的配置更新
   */
  updateConfigurationSection<T extends keyof WidgetConfiguration>(
    widgetId: string,
    section: T,
    data: WidgetConfiguration[T]
  ): void {
    // 获取旧值用于事件
    const oldValue = this.getConfigurationSection(widgetId, section)

    // 根据section类型分别处理
    switch (section) {
      case 'base':
        this.store.setBaseConfiguration(widgetId, data as BaseConfiguration)
        break
      case 'component':
        this.store.setComponentConfiguration(widgetId, data as ComponentConfiguration)
        break
      case 'dataSource':
        this.store.setDataSourceConfiguration(widgetId, data as DataSourceConfiguration)
        break
      case 'interaction':
        this.store.setInteractionConfiguration(widgetId, data as InteractionConfiguration)
        break
      default:
        return
    }

    // 触发配置变更事件
    this.emitConfigurationChange(widgetId, section, oldValue, data)
  }

  /**
   * 批量更新配置
   */
  batchUpdateConfiguration(
    updates: Array<{
      widgetId: string
      section: keyof WidgetConfiguration
      data: any
    }>
  ): void {
    updates.forEach(update => {
      this.updateConfigurationSection(update.widgetId, update.section, update.data)
    })
  }

  // ==================== 数据源管理 ====================

  /**
   * 专门的数据源配置管理
   * 🔥 解决数据源配置混乱问题
   */
  setDataSourceConfig(widgetId: string, config: DataSourceConfiguration): void {
    // 验证数据源配置
    const validation = this.validateDataSourceConfig(config)
    if (!validation.valid) {
      throw new Error(`数据源配置验证失败: ${validation.errors.join(', ')}`)
    }

    // 更新配置
    this.updateConfigurationSection(widgetId, 'dataSource', config)

    // 处理数据源相关的副作用
    this.handleDataSourceSideEffects(widgetId, config)
  }

  /**
   * 更新数据源绑定
   */
  updateDataSourceBindings(widgetId: string, bindings: Record<string, any>): void {
    const currentConfig = this.getConfigurationSection(widgetId, 'dataSource')
    if (!currentConfig) {
      throw new Error(`组件 ${widgetId} 没有数据源配置`)
    }

    const updatedConfig: DataSourceConfiguration = {
      ...currentConfig,
      bindings: { ...currentConfig.bindings, ...bindings }
    }

    this.setDataSourceConfig(widgetId, updatedConfig)
  }

  /**
   * 设置运行时数据
   */
  setRuntimeData(widgetId: string, data: any): void {

    this.store.setRuntimeData(widgetId, data)

    // 触发运行时数据变更事件
    this.emitRuntimeDataChange(widgetId, data)
  }

  /**
   * 获取运行时数据
   */
  getRuntimeData(widgetId: string): any {
    return this.store.getRuntimeData(widgetId)
  }

  // ==================== 配置持久化 ====================

  /**
   * 保存配置到本地存储
   */
  async saveConfiguration(widgetId: string): Promise<void> {
    const config = this.getConfiguration(widgetId)

    try {
      // 保存到localStorage（后续可以扩展到服务器）
      const storageKey = `widget_config_${widgetId}`
      localStorage.setItem(storageKey, JSON.stringify(config))
    } catch (error) {
      throw error
    }
  }

  /**
   * 从本地存储加载配置
   */
  async loadConfiguration(widgetId: string): Promise<WidgetConfiguration | null> {
    try {
      const storageKey = `widget_config_${widgetId}`
      const savedData = localStorage.getItem(storageKey)

      if (!savedData) {
        return null
      }

      const config = JSON.parse(savedData)

      // 配置迁移处理
      const migratedConfig = this.migrateConfiguration(config)

      // 验证加载的配置
      const validation = this.validateConfiguration(migratedConfig)
      if (!validation.valid) {
        return null
      }
      return migratedConfig
    } catch (error) {
      return null
    }
  }

  /**
   * 批量保存所有配置
   */
  async saveAllConfigurations(): Promise<void> {
    const nodeIds = this.store.nodes.map(node => node.id)

    await Promise.all(nodeIds.map(id => this.saveConfiguration(id)))

    this.store.markSaved()
  }

  // ==================== 配置验证 ====================

  /**
   * 验证完整配置
   */
  private validateConfiguration(config: WidgetConfiguration): ConfigurationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础配置验证
    if (config.base) {
      if (typeof config.base.opacity !== 'undefined' && (config.base.opacity < 0 || config.base.opacity > 1)) {
        errors.push('透明度必须在0-1之间')
      }
    }

    // 数据源配置验证
    if (config.dataSource) {
      const dsValidation = this.validateDataSourceConfig(config.dataSource)
      errors.push(...dsValidation.errors)
      warnings.push(...dsValidation.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证数据源配置
   */
  private validateDataSourceConfig(config: DataSourceConfiguration): ConfigurationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查数据源类型
    const validTypes = ['static', 'api', 'websocket', 'device', 'script']
    if (!validTypes.includes(config.type)) {
      errors.push(`无效的数据源类型: ${config.type}`)
    }

    // 类型特定验证
    switch (config.type) {
      case 'api':
        if (!config.config.url) {
          errors.push('API数据源必须提供URL')
        }
        break
      case 'websocket':
        if (!config.config.url) {
          errors.push('WebSocket数据源必须提供URL')
        }
        break
      case 'device':
        if (!config.config.deviceId) {
          errors.push('设备数据源必须提供设备ID')
        }
        break
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  // ==================== 配置迁移 ====================

  /**
   * 注册配置迁移
   */
  registerMigration(migration: ConfigurationMigration): void {
    this.migrations.push(migration)
  }

  /**
   * 执行配置迁移
   */
  private migrateConfiguration(config: any): WidgetConfiguration {
    let migratedConfig = { ...config }

    for (const migration of this.migrations) {
      if (config.metadata?.version === migration.fromVersion) {
        migratedConfig = migration.migrate(migratedConfig)
      }
    }

    return migratedConfig
  }

  // ==================== 事件系统 ====================

  /**
   * 监听配置变更事件
   */
  onConfigurationChange(callback: (event: ConfigurationChangeEvent) => void): () => void {
    const handler = (event: CustomEvent<ConfigurationChangeEvent>) => {
      callback(event.detail)
    }

    this.eventBus.addEventListener('configuration-change', handler as EventListener)

    // 返回取消监听函数
    return () => {
      this.eventBus.removeEventListener('configuration-change', handler as EventListener)
    }
  }

  /**
   * 触发配置变更事件
   */
  private emitConfigurationChange(
    widgetId: string,
    section: keyof WidgetConfiguration | 'full',
    oldValue: any,
    newValue: any
  ): void {
    const event: ConfigurationChangeEvent = {
      widgetId,
      section: section as keyof WidgetConfiguration,
      oldValue,
      newValue,
      timestamp: new Date()
    }

    this.eventBus.dispatchEvent(new CustomEvent('configuration-change', { detail: event }))
  }

  /**
   * 触发运行时数据变更事件
   */
  private emitRuntimeDataChange(widgetId: string, data: any): void {
    this.eventBus.dispatchEvent(
      new CustomEvent('runtime-data-change', {
        detail: { widgetId, data, timestamp: new Date() }
      })
    )
  }

  // ==================== 数据源副作用处理 ====================

  /**
   * 处理数据源配置的副作用
   */
  private handleDataSourceSideEffects(widgetId: string, config: DataSourceConfiguration): void {

    // 如果是Card2.1组件，触发数据绑定更新
    if (this.store.card2Components.has(widgetId)) {
      this.store.updateDataBinding(widgetId)
    }

    // 清理旧的运行时数据
    this.store.setRuntimeData(widgetId, null)

    // 根据数据源类型触发相应的数据获取逻辑
    switch (config.type) {
      case 'static':
        this.handleStaticDataSource(widgetId, config)
        break
      case 'api':
        this.handleApiDataSource(widgetId, config)
        break
      // 其他类型的处理...
    }
  }

  /**
   * 处理静态数据源
   */
  private handleStaticDataSource(widgetId: string, config: DataSourceConfiguration): void {
    if (config.config.data) {
      this.setRuntimeData(widgetId, config.config.data)
    }
  }

  /**
   * 处理API数据源
   */
  private handleApiDataSource(widgetId: string, config: DataSourceConfiguration): void {
    // TODO: 实现API数据获取逻辑
  }
}

// ==================== 单例模式 ====================

let configurationServiceInstance: ConfigurationService | null = null

/**
 * 获取配置服务实例（单例）
 */
export function useConfigurationService(): ConfigurationService {
  if (!configurationServiceInstance) {
    configurationServiceInstance = new ConfigurationService()
  }

  return configurationServiceInstance
}

/**
 * 重置配置服务实例（测试用）
 */
export function resetConfigurationService(): void {
  configurationServiceInstance = null
}
