/**
 * 数据源配置管理器
 * 提供配置的CRUD操作、验证、导入导出等功能
 */

import type { DataSourceSystemConfig } from '../executor/types'
import type {
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ConfigManagerEvents,
  ConfigStorage,
  LocalStorageConfig,
  ConfigTemplate,
  ImportExportOptions,
  ConfigSearchOptions,
  ConfigSearchResult,
  ConfigStatistics,
  ConfigPreset,
  ConfigDiff
} from './types'

/**
 * 本地存储实现
 */
export class LocalConfigStorage implements ConfigStorage {
  private storageKey: string
  private configs = new Map<string, DataSourceSystemConfig>()

  constructor(config: LocalStorageConfig = { key: 'data-source-configs' }) {
    this.storageKey = config.key
    this.loadFromStorage()
  }

  async getAll(): Promise<DataSourceSystemConfig[]> {
    return Array.from(this.configs.values())
  }

  async get(id: string): Promise<DataSourceSystemConfig | null> {
    return this.configs.get(id) || null
  }

  async save(config: DataSourceSystemConfig): Promise<void> {
    this.configs.set(config.id, { ...config })
    await this.saveToStorage()
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.configs.delete(id)
    if (deleted) {
      await this.saveToStorage()
    }
    return deleted
  }

  async saveBatch(configs: DataSourceSystemConfig[]): Promise<void> {
    configs.forEach(config => {
      this.configs.set(config.id, { ...config })
    })
    await this.saveToStorage()
  }

  async clear(): Promise<void> {
    this.configs.clear()
    await this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const configs: DataSourceSystemConfig[] = JSON.parse(stored)
        configs.forEach(config => {
          this.configs.set(config.id, config)
        })
        console.log(`📂 [LocalConfigStorage] 从本地存储加载了 ${configs.length} 个配置`)
      }
    } catch (error) {
      console.error('❌ [LocalConfigStorage] 加载配置失败:', error)
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const configs = Array.from(this.configs.values())
      localStorage.setItem(this.storageKey, JSON.stringify(configs))
      console.log(`💾 [LocalConfigStorage] 保存了 ${configs.length} 个配置到本地存储`)
    } catch (error) {
      console.error('❌ [LocalConfigStorage] 保存配置失败:', error)
      throw error
    }
  }
}

/**
 * 数据源配置管理器
 */
export class DataSourceConfigManager {
  private storage: ConfigStorage
  private eventListeners = new Map<keyof ConfigManagerEvents, Set<Function>>()
  private templates = new Map<string, ConfigTemplate>()
  private presets = new Map<string, ConfigPreset>()

  constructor(storage?: ConfigStorage) {
    this.storage = storage || new LocalConfigStorage()
    this.initializeBuiltinTemplates()
    this.initializeBuiltinPresets()
    console.log('🚀 [DataSourceConfigManager] 配置管理器已初始化')
  }

  /**
   * 创建新配置
   */
  async createConfig(config: Omit<DataSourceSystemConfig, 'id' | 'metadata'>): Promise<DataSourceSystemConfig> {
    const newConfig: DataSourceSystemConfig = {
      ...config,
      id: this.generateId(),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }
    }

    // 验证配置
    const validation = this.validateConfig(newConfig)
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    await this.storage.save(newConfig)
    this.emit('config:created', { config: newConfig })

    console.log(`✅ [DataSourceConfigManager] 配置已创建: ${newConfig.id}`)
    return newConfig
  }

  /**
   * 获取配置
   */
  async getConfig(id: string): Promise<DataSourceSystemConfig | null> {
    return await this.storage.get(id)
  }

  /**
   * 获取所有配置
   */
  async getAllConfigs(): Promise<DataSourceSystemConfig[]> {
    return await this.storage.getAll()
  }

  /**
   * 更新配置
   */
  async updateConfig(id: string, updates: Partial<DataSourceSystemConfig>): Promise<DataSourceSystemConfig> {
    const existingConfig = await this.storage.get(id)
    if (!existingConfig) {
      throw new Error(`配置不存在: ${id}`)
    }

    const updatedConfig: DataSourceSystemConfig = {
      ...existingConfig,
      ...updates,
      id, // 确保ID不被覆盖
      metadata: {
        ...existingConfig.metadata,
        ...updates.metadata,
        updatedAt: Date.now()
      }
    }

    // 验证更新后的配置
    const validation = this.validateConfig(updatedConfig)
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    await this.storage.save(updatedConfig)
    this.emit('config:updated', { id, oldConfig: existingConfig, newConfig: updatedConfig })

    console.log(`✅ [DataSourceConfigManager] 配置已更新: ${id}`)
    return updatedConfig
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<boolean> {
    const existingConfig = await this.storage.get(id)
    if (!existingConfig) {
      return false
    }

    const deleted = await this.storage.delete(id)
    if (deleted) {
      this.emit('config:deleted', { id, config: existingConfig })
      console.log(`🗑️ [DataSourceConfigManager] 配置已删除: ${id}`)
    }

    return deleted
  }

  /**
   * 验证配置
   */
  validateConfig(config: DataSourceSystemConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: ConfigValidationWarning[] = []

    // 基础字段验证
    if (!config.id) {
      errors.push({
        field: 'id',
        code: 'REQUIRED',
        message: 'ID不能为空',
        value: config.id
      })
    }

    if (!config.name || config.name.trim() === '') {
      errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: '名称不能为空',
        value: config.name
      })
    }

    if (!config.type) {
      errors.push({
        field: 'type',
        code: 'REQUIRED',
        message: '数据源类型不能为空',
        value: config.type
      })
    }

    // 数据源类型验证
    const validTypes = ['static', 'api', 'websocket', 'script']
    if (config.type && !validTypes.includes(config.type)) {
      errors.push({
        field: 'type',
        code: 'INVALID_VALUE',
        message: `无效的数据源类型: ${config.type}`,
        value: config.type
      })
    }

    // 数据源配置验证
    if (!config.sourceConfig) {
      errors.push({
        field: 'sourceConfig',
        code: 'REQUIRED',
        message: '数据源配置不能为空',
        value: config.sourceConfig
      })
    } else {
      // 按类型验证数据源配置
      this.validateSourceConfig(config.type, config.sourceConfig, errors, warnings)
    }

    // 触发器配置验证
    if (config.triggers && config.triggers.length > 0) {
      config.triggers.forEach((trigger, index) => {
        this.validateTriggerConfig(trigger, index, errors, warnings)
      })
    }

    // 处理器配置验证
    if (config.processors && config.processors.length > 0) {
      config.processors.forEach((processor, index) => {
        this.validateProcessorConfig(processor, index, errors, warnings)
      })
    }

    const result: ConfigValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    this.emit('config:validated', { id: config.id, result })
    return result
  }

  /**
   * 搜索配置
   */
  async searchConfigs(options: ConfigSearchOptions): Promise<ConfigSearchResult> {
    const startTime = Date.now()
    const allConfigs = await this.storage.getAll()

    let filteredConfigs = allConfigs

    // 关键词搜索
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase()
      const fields = options.fields || ['name', 'description']

      filteredConfigs = filteredConfigs.filter(config => {
        return fields.some(field => {
          const value = config[field as keyof DataSourceSystemConfig]
          return typeof value === 'string' && value.toLowerCase().includes(keyword)
        })
      })
    }

    // 类型过滤
    if (options.types && options.types.length > 0) {
      filteredConfigs = filteredConfigs.filter(config => options.types!.includes(config.type))
    }

    // 标签过滤
    if (options.tags && options.tags.length > 0) {
      filteredConfigs = filteredConfigs.filter(config =>
        config.metadata?.tags?.some(tag => options.tags!.includes(tag))
      )
    }

    // 日期范围过滤
    if (options.dateRange) {
      const { start, end } = options.dateRange
      filteredConfigs = filteredConfigs.filter(config => {
        const createdAt = config.metadata?.createdAt || 0
        return createdAt >= start && createdAt <= end
      })
    }

    // 排序
    if (options.sortBy) {
      filteredConfigs.sort((a, b) => {
        let aValue: any, bValue: any

        switch (options.sortBy) {
          case 'name':
            aValue = a.name
            bValue = b.name
            break
          case 'type':
            aValue = a.type
            bValue = b.type
            break
          case 'createdAt':
            aValue = a.metadata?.createdAt || 0
            bValue = b.metadata?.createdAt || 0
            break
          case 'updatedAt':
            aValue = a.metadata?.updatedAt || 0
            bValue = b.metadata?.updatedAt || 0
            break
          default:
            return 0
        }

        if (aValue < bValue) return options.sortOrder === 'desc' ? 1 : -1
        if (aValue > bValue) return options.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }

    // 分页
    const total = filteredConfigs.length
    let paginatedConfigs = filteredConfigs

    if (options.pagination) {
      const { page, pageSize } = options.pagination
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      paginatedConfigs = filteredConfigs.slice(startIndex, endIndex)
    }

    const searchTime = Date.now() - startTime

    return {
      configs: paginatedConfigs,
      total,
      page: options.pagination?.page || 1,
      pageSize: options.pagination?.pageSize || total,
      totalPages: options.pagination ? Math.ceil(total / options.pagination.pageSize) : 1,
      searchTime
    }
  }

  /**
   * 获取配置统计信息
   */
  async getStatistics(): Promise<ConfigStatistics> {
    const allConfigs = await this.storage.getAll()

    const byType: Record<string, number> = {}
    const byDate: Record<string, number> = {}

    allConfigs.forEach(config => {
      // 按类型统计
      byType[config.type] = (byType[config.type] || 0) + 1

      // 按日期统计
      if (config.metadata?.createdAt) {
        const date = new Date(config.metadata.createdAt).toISOString().split('T')[0]
        byDate[date] = (byDate[date] || 0) + 1
      }
    })

    // 最近创建的配置
    const recentlyCreated = allConfigs
      .filter(config => config.metadata?.createdAt)
      .sort((a, b) => b.metadata!.createdAt - a.metadata!.createdAt)
      .slice(0, 5)

    // 最近更新的配置
    const recentlyUpdated = allConfigs
      .filter(config => config.metadata?.updatedAt)
      .sort((a, b) => b.metadata!.updatedAt - a.metadata!.updatedAt)
      .slice(0, 5)

    return {
      total: allConfigs.length,
      byType,
      byDate,
      recentlyCreated,
      recentlyUpdated,
      mostUsed: [] // TODO: 实现使用统计
    }
  }

  /**
   * 导出配置
   */
  async exportConfigs(configIds?: string[], options: ImportExportOptions = {}): Promise<string> {
    let configs: DataSourceSystemConfig[]

    if (configIds && configIds.length > 0) {
      configs = []
      for (const id of configIds) {
        const config = await this.storage.get(id)
        if (config) {
          configs.push(config)
        }
      }
    } else {
      configs = await this.storage.getAll()
    }

    // 应用过滤条件
    if (options.filter) {
      configs = this.applyExportFilter(configs, options.filter)
    }

    // 处理元数据
    if (!options.includeMetadata) {
      configs = configs.map(config => {
        const { metadata, ...configWithoutMetadata } = config
        return configWithoutMetadata as DataSourceSystemConfig
      })
    }

    this.emit('config:exported', { configs })

    // 根据格式导出
    switch (options.format) {
      case 'yaml':
        // TODO: 实现YAML导出
        return JSON.stringify(configs, null, 2)
      case 'xml':
        // TODO: 实现XML导出
        return JSON.stringify(configs, null, 2)
      default:
        return JSON.stringify(configs, null, 2)
    }
  }

  /**
   * 导入配置
   */
  async importConfigs(data: string, options: ImportExportOptions = {}): Promise<DataSourceSystemConfig[]> {
    try {
      let configs: DataSourceSystemConfig[]

      // 根据格式解析
      switch (options.format) {
        case 'yaml':
          // TODO: 实现YAML解析
          configs = JSON.parse(data)
          break
        case 'xml':
          // TODO: 实现XML解析
          configs = JSON.parse(data)
          break
        default:
          configs = JSON.parse(data)
      }

      if (!Array.isArray(configs)) {
        throw new Error('导入数据格式不正确，应为配置数组')
      }

      // 验证每个配置
      const validConfigs: DataSourceSystemConfig[] = []
      const errors: string[] = []

      for (const config of configs) {
        // 生成新ID避免冲突
        const newConfig = {
          ...config,
          id: this.generateId(),
          metadata: {
            ...config.metadata,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }

        const validation = this.validateConfig(newConfig)
        if (validation.valid) {
          validConfigs.push(newConfig)
        } else {
          errors.push(`配置 ${config.name || 'unknown'}: ${validation.errors.map(e => e.message).join(', ')}`)
        }
      }

      if (errors.length > 0) {
        console.warn('⚠️ [DataSourceConfigManager] 导入时发现错误:', errors)
      }

      // 保存有效配置
      await this.storage.saveBatch(validConfigs)
      this.emit('config:imported', { configs: validConfigs })

      console.log(`✅ [DataSourceConfigManager] 成功导入 ${validConfigs.length} 个配置`)
      return validConfigs
    } catch (error) {
      console.error('❌ [DataSourceConfigManager] 导入配置失败:', error)
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 比较配置差异
   */
  compareConfigs(config1: DataSourceSystemConfig, config2: DataSourceSystemConfig): ConfigDiff[] {
    const diffs: ConfigDiff[] = []

    // TODO: 实现深度配置对比
    console.log('🔍 [DataSourceConfigManager] 配置对比功能待实现')

    return diffs
  }

  /**
   * 事件监听
   */
  on<K extends keyof ConfigManagerEvents>(event: K, listener: (data: ConfigManagerEvents[K]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)!.add(listener)

    return () => {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.eventListeners.clear()
    console.log('🧹 [DataSourceConfigManager] 资源清理完成')
  }

  // 私有方法

  private emit<K extends keyof ConfigManagerEvents>(event: K, data: ConfigManagerEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ [DataSourceConfigManager] 事件监听器执行失败: ${event}`, error)
        }
      })
    }
  }

  private generateId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private validateSourceConfig(
    type: string,
    config: any,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    switch (type) {
      case 'static':
        if (config.data === undefined) {
          errors.push({
            field: 'sourceConfig.data',
            code: 'REQUIRED',
            message: '静态数据源必须包含data字段',
            value: config.data
          })
        }
        break

      case 'api':
        if (!config.url) {
          errors.push({
            field: 'sourceConfig.url',
            code: 'REQUIRED',
            message: 'API数据源必须包含url字段',
            value: config.url
          })
        } else {
          try {
            new URL(config.url)
          } catch {
            errors.push({
              field: 'sourceConfig.url',
              code: 'INVALID_FORMAT',
              message: 'API数据源url格式不正确',
              value: config.url
            })
          }
        }
        break

      case 'websocket':
        if (!config.url) {
          errors.push({
            field: 'sourceConfig.url',
            code: 'REQUIRED',
            message: 'WebSocket数据源必须包含url字段',
            value: config.url
          })
        } else if (!config.url.startsWith('ws://') && !config.url.startsWith('wss://')) {
          errors.push({
            field: 'sourceConfig.url',
            code: 'INVALID_FORMAT',
            message: 'WebSocket数据源url必须以ws://或wss://开头',
            value: config.url
          })
        }
        break

      case 'script':
        if (!config.script) {
          errors.push({
            field: 'sourceConfig.script',
            code: 'REQUIRED',
            message: '脚本数据源必须包含script字段',
            value: config.script
          })
        }
        break
    }
  }

  private validateTriggerConfig(
    trigger: any,
    index: number,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    const fieldPrefix = `triggers[${index}]`

    if (!trigger.type) {
      errors.push({
        field: `${fieldPrefix}.type`,
        code: 'REQUIRED',
        message: '触发器类型不能为空',
        value: trigger.type
      })
    }

    const validTriggerTypes = ['timer', 'websocket', 'event', 'manual']
    if (trigger.type && !validTriggerTypes.includes(trigger.type)) {
      errors.push({
        field: `${fieldPrefix}.type`,
        code: 'INVALID_VALUE',
        message: `无效的触发器类型: ${trigger.type}`,
        value: trigger.type
      })
    }
  }

  private validateProcessorConfig(
    processor: any,
    index: number,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    const fieldPrefix = `processors[${index}]`

    if (!processor.type) {
      errors.push({
        field: `${fieldPrefix}.type`,
        code: 'REQUIRED',
        message: '处理器类型不能为空',
        value: processor.type
      })
    }

    const validProcessorTypes = ['script', 'format', 'filter', 'transform', 'validate']
    if (processor.type && !validProcessorTypes.includes(processor.type)) {
      errors.push({
        field: `${fieldPrefix}.type`,
        code: 'INVALID_VALUE',
        message: `无效的处理器类型: ${processor.type}`,
        value: processor.type
      })
    }
  }

  private applyExportFilter(configs: DataSourceSystemConfig[], filter: any): DataSourceSystemConfig[] {
    let filtered = configs

    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(config => filter.types.includes(config.type))
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(config => config.metadata?.tags?.some(tag => filter.tags.includes(tag)))
    }

    if (filter.dateRange) {
      const { start, end } = filter.dateRange
      filtered = filtered.filter(config => {
        const createdAt = config.metadata?.createdAt || 0
        return createdAt >= start && createdAt <= end
      })
    }

    return filtered
  }

  private initializeBuiltinTemplates(): void {
    // TODO: 初始化内置模板
    console.log('📋 [DataSourceConfigManager] 内置模板初始化待实现')
  }

  private initializeBuiltinPresets(): void {
    // TODO: 初始化内置预设
    console.log('⚙️ [DataSourceConfigManager] 内置预设初始化待实现')
  }
}
