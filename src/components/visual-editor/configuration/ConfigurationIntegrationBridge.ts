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

import { configurationStateManager, type ConfigurationUpdateEvent } from './ConfigurationStateManager'
import { editorDataSourceManager } from '../core/EditorDataSourceManager'
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

    console.log('🌉 [ConfigIntegrationBridge] 初始化配置集成桥接器...')

    // 初始化配置状态管理器
    console.log('🔍 [ConfigIntegrationBridge] 初始化ConfigurationStateManager...')

    // 设置与EditorDataSourceManager的集成
    await this.setupEditorDataSourceIntegration()

    this.initialized = true
    console.log('✅ [ConfigIntegrationBridge] 桥接器初始化完成')
  }

  /**
   * 获取组件配置
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null {
    return configurationStateManager.getConfiguration(widgetId)
  }

  /**
   * 设置组件配置
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void {
    const updated = configurationStateManager.setConfiguration(widgetId, config, 'user')

    if (updated) {
      // 🔥 关键修复：配置更新时清理缓存，确保数据一致性
      simpleDataBridge.clearComponentCache(widgetId)

      // 🔥 修复：发出配置变更事件，使用正确的事件格式
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: 'unknown', // TODO: 可以传入组件类型
        section: 'dataSource', // 配置全量更新时使用 dataSource
        oldConfig: null, // 可以改进为保存之前的配置
        newConfig: config,
        timestamp: Date.now(),
        source: 'user'
      }
      configEventBus.emitConfigChange(changeEvent)

      console.log(`✅ [ConfigIntegrationBridge] 配置已设置且缓存已清理: ${widgetId}`)
    } else {
      console.log(`⏭️ [ConfigIntegrationBridge] 配置内容未变化，跳过: ${widgetId}`)
    }
  }

  /**
   * 更新配置的某个部分 - 关键方法
   */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K]
  ): void {
    console.log(`🔄 [ConfigIntegrationBridge] 更新配置部分: ${widgetId}.${section}`)

    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'user')

    if (updated) {
      // 🔥 关键修复：配置部分更新时清理缓存，特别是 dataSource 更新
      if (section === 'dataSource' || section === 'component') {
        simpleDataBridge.clearComponentCache(widgetId)
        console.log(`🧡 [ConfigIntegrationBridge] ${section} 更新，缓存已清理: ${widgetId}`)
      }

      // 🔥 修复：发出配置部分更新事件，使用正确的 API
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: 'unknown', // TODO: 可以传入组件类型
        section: section as 'base' | 'component' | 'dataSource' | 'interaction',
        oldConfig: null,
        newConfig: config,
        timestamp: Date.now(),
        source: 'user'
      }
      configEventBus.emitConfigChange(changeEvent)

      console.log(`✅ [ConfigIntegrationBridge] 配置部分已更新: ${widgetId}.${section}`)
    } else {
      console.log(`⏭️ [ConfigIntegrationBridge] 配置部分内容未变化或被锁定，跳过: ${widgetId}.${section}`)
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
    console.log(`🔄 [ConfigIntegrationBridge] 配置已重置且缓存已清理: ${widgetId}`)
  }

  /**
   * 初始化组件配置
   */
  initializeConfiguration(widgetId: string, customDefaults?: Partial<WidgetConfiguration>): void {
    console.log(`🆕 [ConfigIntegrationBridge] 初始化配置: ${widgetId}`)

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
      console.log(`🗑️ [ConfigIntegrationBridge] 配置和缓存已删除: ${widgetId}`)
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
   */
  importConfiguration(widgetId: string, configData: string): boolean {
    try {
      const config = JSON.parse(configData) as WidgetConfiguration

      // 简单验证
      const validationResult = this.validateConfiguration(config)
      if (!validationResult.valid) {
        console.error(`[ConfigIntegrationBridge] 导入的配置无效:`, validationResult.errors)
        return false
      }

      configurationStateManager.setConfiguration(widgetId, config, 'import')
      console.log(`[ConfigIntegrationBridge] 配置导入成功: ${widgetId}`)
      return true
    } catch (error) {
      console.error(`[ConfigIntegrationBridge] 配置导入失败:`, error)
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

    console.log(`🔄 [ConfigIntegrationBridge] 批量更新开始，共 ${updates.length} 项配置`)

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

    console.log(`✅ [ConfigIntegrationBridge] 批量更新完成`)
  }

  // ========== 私有方法 ==========

  /**
   * 设置与EditorDataSourceManager的集成
   */
  private async setupEditorDataSourceIntegration(): Promise<void> {
    console.log('🔗 [ConfigIntegrationBridge] 设置与EditorDataSourceManager的集成...')

    try {
      // 确保EditorDataSourceManager已初始化
      if (!editorDataSourceManager.isInitialized()) {
        console.log('🚀 [ConfigIntegrationBridge] 初始化EditorDataSourceManager...')
        await editorDataSourceManager.initialize()
      }

      console.log('✅ [ConfigIntegrationBridge] EditorDataSourceManager集成完成')
    } catch (error) {
      console.error('❌ [ConfigIntegrationBridge] EditorDataSourceManager集成失败:', error)
    }
  }

  /**
   * 为特定组件设置数据源执行集成
   */
  setupComponentDataSourceIntegration(componentId: string): void {
    console.log(`🔗 [ConfigIntegrationBridge] 设置组件数据源集成: ${componentId}`)

    // 订阅该组件的配置更新 - 新的无循环架构
    configurationStateManager.onConfigurationUpdate(componentId, async (event: ConfigurationUpdateEvent) => {
      console.log(
        `🔗 [ConfigIntegrationBridge] 新配置系统事件: ${event.componentId}.${event.section} v${event.newVersion.version}`
      )

      // 只有数据源配置变更且shouldExecute为true时才触发执行
      if (event.section === 'dataSource' && event.shouldExecute) {
        console.log(`⚡ [ConfigIntegrationBridge] 新系统触发数据源执行: ${componentId} (v${event.newVersion.version})`)

        try {
          // 确保EditorDataSourceManager已初始化
          if (!editorDataSourceManager.isInitialized()) {
            console.log('🚀 [ConfigIntegrationBridge] 初始化EditorDataSourceManager...')
            await editorDataSourceManager.initialize()
          }

          // 触发数据更新 - 新的无循环架构
          await editorDataSourceManager.triggerDataUpdate(componentId)
          console.log(
            `✅ [ConfigIntegrationBridge] 新系统数据源执行完成: ${componentId} (v${event.newVersion.version})`
          )
        } catch (error) {
          console.error(`❌ [ConfigIntegrationBridge] 新系统数据源执行失败: ${componentId}`, error)
        }
      } else {
        console.log(
          `⏸️ [ConfigIntegrationBridge] 新系统跳过数据源执行: ${componentId} (section: ${event.section}, shouldExecute: ${event.shouldExecute})`
        )
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

console.log('🌉 [ConfigIntegrationBridge] 配置集成桥接器已加载')
