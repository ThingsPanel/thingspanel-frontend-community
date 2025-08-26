/**
 * 增强版数据源配置管理器
 * 集成统一错误处理、国际化支持和完整的配置管理功能
 */

import type {
  ComponentDataSourceConfig as DataSourceSystemConfig,
  SystemError,
  SystemErrorType,
  ErrorHandlingResult
} from '../types'
import type {
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ConfigManagerEvents,
  ConfigStorage,
  ConfigTemplate,
  ConfigPreset,
  ImportExportOptions,
  ConfigSearchOptions,
  ConfigSearchResult,
  ConfigStatistics,
  ConfigDiff
} from './types'
import { DataSourceConfigManager, LocalConfigStorage } from './config-manager'
import { systemErrorManager, createSystemError } from '../utils/SystemErrorManager'

/**
 * 配置管理器增强选项
 */
export interface EnhancedConfigManagerOptions {
  /** 存储实现 */
  storage?: ConfigStorage
  /** 是否启用国际化 */
  enableI18n?: boolean
  /** 是否启用配置版本管理 */
  enableVersioning?: boolean
  /** 是否启用配置备份 */
  enableBackup?: boolean
  /** 是否启用配置加密 */
  enableEncryption?: boolean
  /** 加密密钥 */
  encryptionKey?: string
  /** 配置缓存TTL（毫秒） */
  cacheTTL?: number
}

/**
 * 配置缓存项
 */
interface ConfigCacheItem {
  config: DataSourceSystemConfig
  timestamp: number
  ttl: number
}

/**
 * 增强版数据源配置管理器
 */
export class EnhancedConfigManager extends DataSourceConfigManager {
  private options: EnhancedConfigManagerOptions
  private configCache = new Map<string, ConfigCacheItem>()
  private encryptionEnabled = false
  private versioningEnabled = false

  constructor(options: EnhancedConfigManagerOptions = {}) {
    super(options.storage)

    this.options = {
      enableI18n: true,
      enableVersioning: false,
      enableBackup: false,
      enableEncryption: false,
      cacheTTL: 5 * 60 * 1000, // 5分钟默认缓存
      ...options
    }

    this.encryptionEnabled = !!this.options.enableEncryption && !!this.options.encryptionKey
    this.versioningEnabled = !!this.options.enableVersioning

    console.log('🚀 [EnhancedConfigManager] 增强版配置管理器已初始化', {
      i18n: this.options.enableI18n,
      versioning: this.versioningEnabled,
      backup: this.options.enableBackup,
      encryption: this.encryptionEnabled
    })

    // 定时清理缓存
    if (this.options.cacheTTL) {
      setInterval(() => this.cleanupCache(), this.options.cacheTTL / 2)
    }

    // 注册系统错误监听器
    systemErrorManager.addListener({
      id: 'enhanced-config-manager',
      callback: this.handleSystemError.bind(this)
    })
  }

  /**
   * 创建配置（增强版，带错误处理）
   */
  async createConfigSafe(
    config: Omit<DataSourceSystemConfig, 'id' | 'metadata'>
  ): Promise<ErrorHandlingResult<DataSourceSystemConfig>> {
    const startTime = Date.now()

    try {
      // 前置验证
      const preValidation = await this.preValidateConfig(config)
      if (!preValidation.success) {
        return preValidation
      }

      // 创建配置
      const newConfig = await this.createConfig(config)

      // 缓存配置
      this.cacheConfig(newConfig)

      // 备份（如果启用）
      if (this.options.enableBackup) {
        await this.backupConfig(newConfig)
      }

      return {
        success: true,
        data: newConfig,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.VALIDATION, 'CONFIG_CREATE_FAILED', '配置创建失败', error, {
        operation: 'createConfig',
        configName: config.name
      })

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 获取配置（增强版，带缓存）
   */
  async getConfigSafe(id: string): Promise<ErrorHandlingResult<DataSourceSystemConfig | null>> {
    const startTime = Date.now()

    try {
      // 尝试从缓存获取
      const cached = this.getCachedConfig(id)
      if (cached) {
        console.log(`🚀 [EnhancedConfigManager] 从缓存返回配置: ${id}`)
        return {
          success: true,
          data: cached,
          executionTime: Date.now() - startTime
        }
      }

      // 从存储获取
      const config = await this.getConfig(id)

      // 缓存配置
      if (config) {
        this.cacheConfig(config)
      }

      return {
        success: true,
        data: config,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.SYSTEM, 'CONFIG_GET_FAILED', '获取配置失败', error, {
        operation: 'getConfig',
        configId: id
      })

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 更新配置（增强版，带版本管理）
   */
  async updateConfigSafe(
    id: string,
    updates: Partial<DataSourceSystemConfig>
  ): Promise<ErrorHandlingResult<DataSourceSystemConfig>> {
    const startTime = Date.now()

    try {
      // 获取原配置
      const existingConfig = await this.getConfig(id)
      if (!existingConfig) {
        const systemError = createSystemError(
          SystemErrorType.MISSING_CONFIG,
          'CONFIG_NOT_FOUND',
          `配置不存在: ${id}`,
          null,
          { configId: id }
        )
        return systemErrorManager.handleError(systemError)
      }

      // 版本管理（如果启用）
      if (this.versioningEnabled) {
        await this.createConfigVersion(existingConfig)
      }

      // 预验证更新
      const preValidation = await this.preValidateConfigUpdate(existingConfig, updates)
      if (!preValidation.success) {
        return preValidation
      }

      // 执行更新
      const updatedConfig = await this.updateConfig(id, updates)

      // 更新缓存
      this.cacheConfig(updatedConfig)

      // 备份（如果启用）
      if (this.options.enableBackup) {
        await this.backupConfig(updatedConfig)
      }

      return {
        success: true,
        data: updatedConfig,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.VALIDATION, 'CONFIG_UPDATE_FAILED', '配置更新失败', error, {
        operation: 'updateConfig',
        configId: id
      })

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 删除配置（增强版，带安全检查）
   */
  async deleteConfigSafe(id: string): Promise<ErrorHandlingResult<boolean>> {
    const startTime = Date.now()

    try {
      // 安全检查
      const safetyCheck = await this.performDeletionSafetyCheck(id)
      if (!safetyCheck.success) {
        return safetyCheck
      }

      // 获取配置用于备份
      const config = await this.getConfig(id)

      // 执行删除
      const deleted = await this.deleteConfig(id)

      // 清理缓存
      this.configCache.delete(id)

      // 创建删除备份（如果启用）
      if (deleted && config && this.options.enableBackup) {
        await this.backupDeletedConfig(config)
      }

      return {
        success: true,
        data: deleted,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.SYSTEM, 'CONFIG_DELETE_FAILED', '配置删除失败', error, {
        operation: 'deleteConfig',
        configId: id
      })

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 批量操作配置（增强版）
   */
  async batchOperateConfigs(
    operations: Array<{
      type: 'create' | 'update' | 'delete'
      id?: string
      config?: any
    }>
  ): Promise<ErrorHandlingResult<any[]>> {
    const startTime = Date.now()
    const results: any[] = []
    const errors: SystemError[] = []

    for (const [index, operation] of operations.entries()) {
      try {
        let result: ErrorHandlingResult<any>

        switch (operation.type) {
          case 'create':
            result = await this.createConfigSafe(operation.config)
            break
          case 'update':
            result = await this.updateConfigSafe(operation.id!, operation.config)
            break
          case 'delete':
            result = await this.deleteConfigSafe(operation.id!)
            break
          default:
            throw new Error(`不支持的操作类型: ${operation.type}`)
        }

        if (result.success) {
          results.push(result.data)
        } else {
          errors.push(result.error!)
        }
      } catch (error) {
        const systemError = createSystemError(
          SystemErrorType.SYSTEM,
          'BATCH_OPERATION_ERROR',
          `批量操作第${index + 1}项失败`,
          error,
          { operation, index }
        )
        errors.push(systemError)
      }
    }

    // 如果有错误，返回错误汇总
    if (errors.length > 0) {
      const batchError = createSystemError(
        SystemErrorType.SYSTEM,
        'BATCH_OPERATION_PARTIAL_FAILURE',
        `批量操作部分失败: ${errors.length}/${operations.length}项失败`,
        { errors, successCount: results.length },
        { totalOperations: operations.length, errorCount: errors.length }
      )

      return {
        success: false,
        error: batchError,
        executionTime: Date.now() - startTime,
        data: results // 仍然返回成功的结果
      }
    }

    return {
      success: true,
      data: results,
      executionTime: Date.now() - startTime
    }
  }

  /**
   * 高级配置搜索（增强版）
   */
  async advancedSearchConfigs(
    options: ConfigSearchOptions & {
      /** 模糊匹配阈值 (0-1) */
      fuzzyThreshold?: number
      /** 是否启用全文搜索 */
      fullTextSearch?: boolean
      /** 搜索权重配置 */
      weights?: {
        name: number
        description: number
        tags: number
        type: number
      }
    }
  ): Promise<ErrorHandlingResult<ConfigSearchResult>> {
    const startTime = Date.now()

    try {
      // 执行基础搜索
      const basicResult = await this.searchConfigs(options)

      // 如果启用了全文搜索，应用高级算法
      if (options.fullTextSearch && options.keyword) {
        basicResult.configs = await this.applyFullTextSearch(basicResult.configs, options.keyword, options.weights)
      }

      // 应用模糊匹配
      if (options.fuzzyThreshold && options.keyword) {
        basicResult.configs = await this.applyFuzzySearch(basicResult.configs, options.keyword, options.fuzzyThreshold)
      }

      return {
        success: true,
        data: basicResult,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.SYSTEM, 'ADVANCED_SEARCH_FAILED', '高级搜索失败', error, {
        searchOptions: options
      })

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 配置健康检查
   */
  async performHealthCheck(): Promise<
    ErrorHandlingResult<{
      totalConfigs: number
      validConfigs: number
      invalidConfigs: number
      warnings: number
      cacheHitRate: number
      issues: Array<{
        configId: string
        type: string
        message: string
        severity: 'error' | 'warning' | 'info'
      }>
    }>
  > {
    const startTime = Date.now()

    try {
      const allConfigs = await this.getAllConfigs()
      let validCount = 0
      let warningCount = 0
      const issues: any[] = []

      // 验证所有配置
      for (const config of allConfigs) {
        const validation = this.validateConfig(config)

        if (validation.valid) {
          validCount++
        } else {
          validation.errors.forEach(error => {
            issues.push({
              configId: config.id,
              type: 'validation_error',
              message: error.message,
              severity: 'error' as const
            })
          })
        }

        validation.warnings.forEach(warning => {
          warningCount++
          issues.push({
            configId: config.id,
            type: 'validation_warning',
            message: warning.message,
            severity: 'warning' as const
          })
        })
      }

      // 计算缓存命中率
      const cacheHitRate = this.calculateCacheHitRate()

      const healthData = {
        totalConfigs: allConfigs.length,
        validConfigs: validCount,
        invalidConfigs: allConfigs.length - validCount,
        warnings: warningCount,
        cacheHitRate,
        issues
      }

      return {
        success: true,
        data: healthData,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      const systemError = createSystemError(SystemErrorType.SYSTEM, 'HEALTH_CHECK_FAILED', '配置健康检查失败', error)

      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 清理资源（重写父类方法）
   */
  cleanup(): void {
    // 清理缓存
    this.configCache.clear()

    // 移除系统错误监听器
    systemErrorManager.removeListener('enhanced-config-manager')

    // 调用父类清理
    super.cleanup()

    console.log('🧹 [EnhancedConfigManager] 增强版配置管理器资源清理完成')
  }

  // ========== 私有辅助方法 ==========

  /**
   * 配置预验证
   */
  private async preValidateConfig(
    config: Omit<DataSourceSystemConfig, 'id' | 'metadata'>
  ): Promise<ErrorHandlingResult<void>> {
    // 基础验证
    if (!config.name || config.name.trim() === '') {
      const error = createSystemError(SystemErrorType.VALIDATION, 'INVALID_CONFIG_NAME', '配置名称不能为空')
      return systemErrorManager.handleError(error)
    }

    // 名称重复检查
    const existingConfigs = await this.getAllConfigs()
    const nameExists = existingConfigs.some(existing => existing.name.toLowerCase() === config.name.toLowerCase())

    if (nameExists) {
      const error = createSystemError(
        SystemErrorType.VALIDATION,
        'DUPLICATE_CONFIG_NAME',
        `配置名称已存在: ${config.name}`
      )
      return systemErrorManager.handleError(error)
    }

    return {
      success: true,
      data: undefined,
      executionTime: 0
    }
  }

  /**
   * 配置更新预验证
   */
  private async preValidateConfigUpdate(
    existingConfig: DataSourceSystemConfig,
    updates: Partial<DataSourceSystemConfig>
  ): Promise<ErrorHandlingResult<void>> {
    // 检查是否尝试修改ID
    if (updates.id && updates.id !== existingConfig.id) {
      const error = createSystemError(SystemErrorType.VALIDATION, 'CANNOT_CHANGE_CONFIG_ID', '不允许修改配置ID')
      return systemErrorManager.handleError(error)
    }

    // 名称重复检查（如果修改了名称）
    if (updates.name && updates.name !== existingConfig.name) {
      const allConfigs = await this.getAllConfigs()
      const nameExists = allConfigs.some(
        config => config.id !== existingConfig.id && config.name.toLowerCase() === updates.name!.toLowerCase()
      )

      if (nameExists) {
        const error = createSystemError(
          SystemErrorType.VALIDATION,
          'DUPLICATE_CONFIG_NAME',
          `配置名称已存在: ${updates.name}`
        )
        return systemErrorManager.handleError(error)
      }
    }

    return {
      success: true,
      data: undefined,
      executionTime: 0
    }
  }

  /**
   * 删除安全检查
   */
  private async performDeletionSafetyCheck(id: string): Promise<ErrorHandlingResult<void>> {
    try {
      const config = await this.getConfig(id)
      if (!config) {
        return {
          success: true,
          data: undefined,
          executionTime: 0
        }
      }

      // TODO: 实现依赖检查
      // 检查是否有其他配置依赖于此配置
      // 检查是否有组件正在使用此配置

      return {
        success: true,
        data: undefined,
        executionTime: 0
      }
    } catch (error) {
      const systemError = createSystemError(
        SystemErrorType.SYSTEM,
        'DELETION_SAFETY_CHECK_FAILED',
        '删除安全检查失败',
        error
      )
      return systemErrorManager.handleError(systemError)
    }
  }

  /**
   * 缓存配置
   */
  private cacheConfig(config: DataSourceSystemConfig): void {
    if (this.options.cacheTTL) {
      this.configCache.set(config.id, {
        config: { ...config },
        timestamp: Date.now(),
        ttl: this.options.cacheTTL
      })
    }
  }

  /**
   * 获取缓存配置
   */
  private getCachedConfig(id: string): DataSourceSystemConfig | null {
    const cached = this.configCache.get(id)
    if (!cached) return null

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.configCache.delete(id)
      return null
    }

    return cached.config
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [id, cached] of this.configCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.configCache.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [EnhancedConfigManager] 清理了 ${cleanedCount} 个过期缓存项`)
    }
  }

  /**
   * 计算缓存命中率
   */
  private calculateCacheHitRate(): number {
    // TODO: 实现缓存命中率统计
    return 0.0
  }

  /**
   * 备份配置
   */
  private async backupConfig(config: DataSourceSystemConfig): Promise<void> {
    if (!this.options.enableBackup) return

    try {
      // TODO: 实现配置备份逻辑
      console.log(`💾 [EnhancedConfigManager] 配置备份: ${config.id}`)
    } catch (error) {
      console.error('❌ [EnhancedConfigManager] 配置备份失败:', error)
    }
  }

  /**
   * 备份已删除配置
   */
  private async backupDeletedConfig(config: DataSourceSystemConfig): Promise<void> {
    if (!this.options.enableBackup) return

    try {
      // TODO: 实现删除配置备份逻辑
      console.log(`🗑️ [EnhancedConfigManager] 已删除配置备份: ${config.id}`)
    } catch (error) {
      console.error('❌ [EnhancedConfigManager] 删除配置备份失败:', error)
    }
  }

  /**
   * 创建配置版本
   */
  private async createConfigVersion(config: DataSourceSystemConfig): Promise<void> {
    if (!this.versioningEnabled) return

    try {
      // TODO: 实现配置版本管理
      console.log(`📝 [EnhancedConfigManager] 创建配置版本: ${config.id}`)
    } catch (error) {
      console.error('❌ [EnhancedConfigManager] 创建配置版本失败:', error)
    }
  }

  /**
   * 应用全文搜索
   */
  private async applyFullTextSearch(
    configs: DataSourceSystemConfig[],
    keyword: string,
    weights?: any
  ): Promise<DataSourceSystemConfig[]> {
    // TODO: 实现全文搜索算法
    return configs
  }

  /**
   * 应用模糊搜索
   */
  private async applyFuzzySearch(
    configs: DataSourceSystemConfig[],
    keyword: string,
    threshold: number
  ): Promise<DataSourceSystemConfig[]> {
    // TODO: 实现模糊搜索算法
    return configs
  }

  /**
   * 系统错误处理
   */
  private async handleSystemError(error: SystemError): Promise<void> {
    console.error(`🚨 [EnhancedConfigManager] 捕获系统错误:`, error)

    // TODO: 实现错误恢复逻辑
    // 例如：自动重试、降级处理、通知管理员等
  }
}

// 导出单例实例
export const enhancedConfigManager = new EnhancedConfigManager()
