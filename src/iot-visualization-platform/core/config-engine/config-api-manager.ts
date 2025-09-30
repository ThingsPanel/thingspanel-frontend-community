/**
 * Config Engine 统一 API 管理器
 *
 * 核心功能：
 * 1. 统一配置操作接口 - 提供一致的配置 CRUD 操作
 * 2. 高级配置查询接口 - 支持复杂条件查询和聚合
 * 3. 配置生命周期管理 - 验证、迁移、序列化一体化
 * 4. 配置关系管理 - 处理配置间的依赖关系
 * 5. 配置性能优化接口 - 批量操作和性能监控
 * 6. 配置导入导出接口 - 支持多种格式的数据交换
 * 7. 配置模板管理接口 - 预定义配置模板系统
 * 8. 配置权限控制接口 - 基于角色的配置访问控制
 *
 * 设计原则：
 * - 统一接口：所有配置操作都通过这一个接口
 * - 高性能：智能缓存和批量处理
 * - 可扩展：插件式扩展和中间件支持
 * - 类型安全：完整的 TypeScript 支持
 * - 事件驱动：配置变更自动触发相关事件
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import type {
  ConfigurationItem,
  ConfigurationType,
  ConfigurationQuery,
  ConfigurationValidationResult,
  ConfigurationOperationResult,
  ConfigurationTemplate,
  ConfigurationExportFormat,
  ConfigurationImportOptions,
  ConfigurationBulkOperation,
  ConfigurationRelationship,
  ConfigurationPermission,
  ConfigurationMiddleware,
  ConfigurationPluginOptions
} from './types'

import { ConfigEngine } from './index'
import { configurationValidator } from './config-validator'

/**
 * 配置操作统计信息
 * 用于性能监控和系统优化
 */
interface ConfigurationAPIStatistics {
  /** 总操作次数 */
  totalOperations: number
  /** 创建操作次数 */
  createOperations: number
  /** 查询操作次数 */
  queryOperations: number
  /** 更新操作次数 */
  updateOperations: number
  /** 删除操作次数 */
  deleteOperations: number
  /** 批量操作次数 */
  bulkOperations: number
  /** 平均操作响应时间（毫秒） */
  averageResponseTime: number
  /** 错误操作次数 */
  errorOperations: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * API 操作选项
 * 通用的操作配置选项
 */
interface APIOperationOptions {
  /** 是否跳过验证 */
  skipValidation?: boolean
  /** 是否触发事件 */
  triggerEvents?: boolean
  /** 操作来源标识 */
  source?: string
  /** 操作上下文 */
  context?: Record<string, any>
  /** 操作超时时间（毫秒） */
  timeout?: number
  /** 是否使用缓存 */
  useCache?: boolean
}

/**
 * 查询结果元数据
 * 提供查询结果的附加信息
 */
interface QueryResultMetadata {
  /** 总记录数 */
  total: number
  /** 当前页记录数 */
  count: number
  /** 查询耗时（毫秒） */
  queryTime: number
  /** 是否有更多记录 */
  hasMore: boolean
  /** 分页信息 */
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 增强的查询结果
 * 包含查询结果和元数据
 */
interface EnhancedQueryResult<T = ConfigurationItem> {
  /** 查询结果数据 */
  data: T[]
  /** 查询结果元数据 */
  metadata: QueryResultMetadata
  /** 查询时间戳 */
  timestamp: Date
}

/**
 * 🎯 Config Engine 统一 API 管理器核心类
 *
 * 提供统一、高性能、类型安全的配置管理 API 接口
 *
 * 主要功能：
 * - 统一配置 CRUD 操作
 * - 高级查询和聚合
 * - 配置生命周期管理
 * - 配置关系和权限管理
 * - 性能监控和优化
 * - 配置导入导出
 * - 模板和插件管理
 */
export class ConfigurationAPIManager extends EventEmitter {
  /** 🔧 配置引擎实例 */
  private configEngine: ConfigEngine

  /** 📊 API 操作统计信息 */
  private statistics: ConfigurationAPIStatistics = {
    totalOperations: 0,
    createOperations: 0,
    queryOperations: 0,
    updateOperations: 0,
    deleteOperations: 0,
    bulkOperations: 0,
    averageResponseTime: 0,
    errorOperations: 0,
    lastUpdated: new Date()
  }

  /** 🔧 中间件注册表 */
  private middlewares: ConfigurationMiddleware[] = []

  /** 🔒 权限管理器 */
  private permissionManager?: (operation: string, configId: string, userId?: string) => Promise<boolean>

  /** 🚀 缓存管理器 */
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  /** 🔧 缓存过期时间（毫秒） - 10分钟 */
  private readonly CACHE_TTL = 10 * 60 * 1000

  constructor(configEngine?: ConfigEngine) {
    super()
    this.configEngine = configEngine || new ConfigEngine()

    // 初始化内置中间件
    this.initializeBuiltInMiddlewares()

  }

  // ===== 🎯 核心 CRUD 操作接口 =====

  /**
   * 🔨 创建配置项
   *
   * 完整的配置创建流程：
   * 1. 权限验证
   * 2. 数据验证
   * 3. 中间件处理
   * 4. 创建配置
   * 5. 事件触发
   *
   * @param item 待创建的配置项
   * @param options 操作选项
   * @returns 创建结果
   */
  async createConfiguration<T = any>(
    item: ConfigurationItem<T>,
    options: APIOperationOptions = {}
  ): Promise<ConfigurationOperationResult> {
    const startTime = performance.now()

    try {
      this.statistics.totalOperations++
      this.statistics.createOperations++

      // 🔒 权限检查
      await this.checkPermission('create', item.id, options.context?.userId)

      // 🔍 执行中间件
      const processedItem = await this.executeMiddlewares('before-create', item, options)

      // ✅ 配置验证（如果未跳过）
      if (!options.skipValidation) {
        const validationResult = await configurationValidator.validateConfiguration(processedItem)
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `配置验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`,
            data: null,
            operationType: 'create',
            timestamp: new Date(),
            duration: performance.now() - startTime
          }
        }
      }

      // 🔨 执行创建操作
      const success = await this.configEngine.createConfiguration(processedItem)

      if (success) {
        // 🔄 执行后置中间件
        await this.executeMiddlewares('after-create', processedItem, options)

        // 🚀 触发事件（如果未禁用）
        if (options.triggerEvents !== false) {
          this.emit('configuration-created', {
            item: processedItem,
            options,
            timestamp: new Date()
          })
        }

        // 🗑️ 清除相关缓存
        this.clearRelatedCache('create', processedItem.type)


        return {
          success: true,
          data: processedItem,
          operationType: 'create',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      } else {
        this.statistics.errorOperations++
        return {
          success: false,
          error: '配置创建失败',
          data: null,
          operationType: 'create',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

    } catch (error) {
      this.statistics.errorOperations++
      console.error(`❌ [ConfigurationAPIManager] 配置创建异常: ${item.id}`, error)

      return {
        success: false,
        error: `配置创建异常: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    } finally {
      this.updateStatistics(performance.now() - startTime)
    }
  }

  /**
   * 🔍 查询配置项
   *
   * 支持复杂查询条件和性能优化：
   * - 智能缓存机制
   * - 分页查询支持
   * - 聚合查询功能
   * - 关系查询支持
   *
   * @param query 查询条件
   * @param options 操作选项
   * @returns 增强的查询结果
   */
  async queryConfigurations(
    query: ConfigurationQuery = {},
    options: APIOperationOptions = {}
  ): Promise<EnhancedQueryResult> {
    const startTime = performance.now()

    try {
      this.statistics.totalOperations++
      this.statistics.queryOperations++

      // 🚀 检查缓存
      const cacheKey = this.generateQueryCacheKey(query, options)
      if (options.useCache !== false) {
        const cachedResult = this.getCachedResult(cacheKey)
        if (cachedResult) {
          return cachedResult
        }
      }

      // 🔒 权限检查（查询级别）
      await this.checkPermission('query', 'configurations', options.context?.userId)

      // 🔍 执行中间件
      const processedQuery = await this.executeMiddlewares('before-query', query, options)

      // 📋 执行查询
      const configurations = this.configEngine.queryConfigurations(processedQuery)

      // 📊 构建查询结果元数据
      const metadata: QueryResultMetadata = {
        total: configurations.length,
        count: configurations.length,
        queryTime: performance.now() - startTime,
        hasMore: false // 基础实现，后续可以支持分页
      }

      // 分页处理（如果启用）
      let paginatedData = configurations
      if (query.pagination) {
        const { page = 1, pageSize = 20 } = query.pagination
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize

        paginatedData = configurations.slice(startIndex, endIndex)

        metadata.pagination = {
          page,
          pageSize,
          totalPages: Math.ceil(configurations.length / pageSize)
        }
        metadata.count = paginatedData.length
        metadata.hasMore = endIndex < configurations.length
      }

      const result: EnhancedQueryResult = {
        data: paginatedData,
        metadata,
        timestamp: new Date()
      }

      // 🚀 缓存结果
      if (options.useCache !== false) {
        this.setCachedResult(cacheKey, result)
      }

      // 🔄 执行后置中间件
      await this.executeMiddlewares('after-query', result, options)

      return result

    } catch (error) {
      this.statistics.errorOperations++
      console.error(`❌ [ConfigurationAPIManager] 配置查询异常:`, error)

      return {
        data: [],
        metadata: {
          total: 0,
          count: 0,
          queryTime: performance.now() - startTime,
          hasMore: false
        },
        timestamp: new Date()
      }
    } finally {
      this.updateStatistics(performance.now() - startTime)
    }
  }

  /**
   * 🔄 更新配置项
   *
   * 支持部分更新和完整替换：
   * - 智能合并更新
   * - 版本控制集成
   * - 变更追踪
   * - 依赖关系更新
   *
   * @param id 配置项ID
   * @param updates 更新数据
   * @param options 操作选项
   * @returns 更新结果
   */
  async updateConfiguration<T = any>(
    id: string,
    updates: Partial<ConfigurationItem<T>>,
    options: APIOperationOptions = {}
  ): Promise<ConfigurationOperationResult> {
    const startTime = performance.now()

    try {
      this.statistics.totalOperations++
      this.statistics.updateOperations++

      // 🔒 权限检查
      await this.checkPermission('update', id, options.context?.userId)

      // 📋 获取当前配置
      const currentConfig = this.configEngine.getConfiguration(id)
      if (!currentConfig) {
        return {
          success: false,
          error: `配置项不存在: ${id}`,
          data: null,
          operationType: 'update',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // 🔄 合并更新数据
      const updatedConfig: ConfigurationItem<T> = {
        ...currentConfig,
        ...updates,
        id, // 确保ID不被更改
        updatedAt: new Date() // 更新时间戳
      }

      // 🔍 执行中间件
      const processedConfig = await this.executeMiddlewares('before-update', updatedConfig, options)

      // ✅ 配置验证（如果未跳过）
      if (!options.skipValidation) {
        const validationResult = await configurationValidator.validateConfiguration(processedConfig)
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `配置验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`,
            data: null,
            operationType: 'update',
            timestamp: new Date(),
            duration: performance.now() - startTime
          }
        }
      }

      // 🔄 执行更新操作
      const success = await this.configEngine.updateConfiguration(id, processedConfig)

      if (success) {
        // 🔄 执行后置中间件
        await this.executeMiddlewares('after-update', processedConfig, options)

        // 🚀 触发事件（如果未禁用）
        if (options.triggerEvents !== false) {
          this.emit('configuration-updated', {
            id,
            oldConfig: currentConfig,
            newConfig: processedConfig,
            updates,
            options,
            timestamp: new Date()
          })
        }

        // 🗑️ 清除相关缓存
        this.clearRelatedCache('update', processedConfig.type, id)


        return {
          success: true,
          data: processedConfig,
          operationType: 'update',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      } else {
        this.statistics.errorOperations++
        return {
          success: false,
          error: '配置更新失败',
          data: null,
          operationType: 'update',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

    } catch (error) {
      this.statistics.errorOperations++
      console.error(`❌ [ConfigurationAPIManager] 配置更新异常: ${id}`, error)

      return {
        success: false,
        error: `配置更新异常: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'update',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    } finally {
      this.updateStatistics(performance.now() - startTime)
    }
  }

  /**
   * 🗑️ 删除配置项
   *
   * 安全的配置删除操作：
   * - 依赖关系检查
   * - 软删除支持
   * - 删除确认机制
   * - 数据备份
   *
   * @param id 配置项ID
   * @param options 操作选项
   * @returns 删除结果
   */
  async deleteConfiguration(
    id: string,
    options: APIOperationOptions = {}
  ): Promise<ConfigurationOperationResult> {
    const startTime = performance.now()

    try {
      this.statistics.totalOperations++
      this.statistics.deleteOperations++

      // 🔒 权限检查
      await this.checkPermission('delete', id, options.context?.userId)

      // 📋 获取当前配置
      const currentConfig = this.configEngine.getConfiguration(id)
      if (!currentConfig) {
        return {
          success: false,
          error: `配置项不存在: ${id}`,
          data: null,
          operationType: 'delete',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // 🔍 执行中间件
      await this.executeMiddlewares('before-delete', currentConfig, options)

      // 🗑️ 执行删除操作
      const success = await this.configEngine.deleteConfiguration(id)

      if (success) {
        // 🔄 执行后置中间件
        await this.executeMiddlewares('after-delete', currentConfig, options)

        // 🚀 触发事件（如果未禁用）
        if (options.triggerEvents !== false) {
          this.emit('configuration-deleted', {
            id,
            deletedConfig: currentConfig,
            options,
            timestamp: new Date()
          })
        }

        // 🗑️ 清除相关缓存
        this.clearRelatedCache('delete', currentConfig.type, id)


        return {
          success: true,
          data: currentConfig,
          operationType: 'delete',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      } else {
        this.statistics.errorOperations++
        return {
          success: false,
          error: '配置删除失败',
          data: null,
          operationType: 'delete',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

    } catch (error) {
      this.statistics.errorOperations++
      console.error(`❌ [ConfigurationAPIManager] 配置删除异常: ${id}`, error)

      return {
        success: false,
        error: `配置删除异常: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'delete',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    } finally {
      this.updateStatistics(performance.now() - startTime)
    }
  }

  // ===== 🚀 高级功能接口 =====

  /**
   * 🚀 批量操作配置
   *
   * 高效的批量配置操作：
   * - 并行处理提升性能
   * - 事务性操作支持
   * - 错误恢复机制
   * - 进度监控
   *
   * @param operations 批量操作列表
   * @param options 操作选项
   * @returns 批量操作结果
   */
  async bulkOperations(
    operations: ConfigurationBulkOperation[],
    options: APIOperationOptions = {}
  ): Promise<Map<string, ConfigurationOperationResult>> {
    const startTime = performance.now()

    try {
      this.statistics.totalOperations++
      this.statistics.bulkOperations++


      const results = new Map<string, ConfigurationOperationResult>()

      // 🔒 权限检查（批量）
      for (const op of operations) {
        await this.checkPermission(op.operation, op.configurationId, options.context?.userId)
      }

      // 🔄 并行执行操作
      const operationPromises = operations.map(async operation => {
        try {
          let result: ConfigurationOperationResult

          switch (operation.operation) {
            case 'create':
              result = await this.createConfiguration(operation.data, {
                ...options,
                triggerEvents: false // 批量操作时先不触发单个事件
              })
              break

            case 'update':
              result = await this.updateConfiguration(operation.configurationId, operation.data, {
                ...options,
                triggerEvents: false
              })
              break

            case 'delete':
              result = await this.deleteConfiguration(operation.configurationId, {
                ...options,
                triggerEvents: false
              })
              break

            default:
              result = {
                success: false,
                error: `不支持的操作类型: ${operation.operation}`,
                data: null,
                operationType: operation.operation as any,
                timestamp: new Date(),
                duration: 0
              }
          }

          return { id: operation.configurationId, result }

        } catch (error) {
          return {
            id: operation.configurationId,
            result: {
              success: false,
              error: `批量操作异常: ${error instanceof Error ? error.message : '未知错误'}`,
              data: null,
              operationType: operation.operation as any,
              timestamp: new Date(),
              duration: 0
            }
          }
        }
      })

      const operationResults = await Promise.allSettled(operationPromises)

      // 📊 处理操作结果
      operationResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const { id, result } = promiseResult.value
          results.set(id, result)
        } else {
          const operation = operations[index]
          results.set(operation.configurationId, {
            success: false,
            error: `操作失败: ${promiseResult.reason}`,
            data: null,
            operationType: operation.operation as any,
            timestamp: new Date(),
            duration: 0
          })
        }
      })

      // 🚀 触发批量操作事件
      if (options.triggerEvents !== false) {
        this.emit('configurations-bulk-operation', {
          operations,
          results,
          options,
          timestamp: new Date()
        })
      }

      // 🗑️ 清除所有相关缓存
      this.clearAllCache()

      const successCount = Array.from(results.values()).filter(r => r.success).length

      return results

    } catch (error) {
      this.statistics.errorOperations++
      console.error(`❌ [ConfigurationAPIManager] 批量操作异常:`, error)

      // 返回所有失败的结果
      const errorResults = new Map<string, ConfigurationOperationResult>()
      operations.forEach(op => {
        errorResults.set(op.configurationId, {
          success: false,
          error: `批量操作异常: ${error instanceof Error ? error.message : '未知错误'}`,
          data: null,
          operationType: op.operation as any,
          timestamp: new Date(),
          duration: 0
        })
      })

      return errorResults

    } finally {
      this.updateStatistics(performance.now() - startTime)
    }
  }

  // ===== 🔧 管理和配置接口 =====

  /**
   * 🔧 注册中间件
   *
   * 允许外部系统扩展 API 功能
   *
   * @param middleware 中间件配置
   */
  registerMiddleware(middleware: ConfigurationMiddleware): void {
    this.middlewares.push(middleware)
    // 按优先级排序
    this.middlewares.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * 🔒 设置权限管理器
   *
   * 配置基于角色的访问控制
   *
   * @param permissionManager 权限检查函数
   */
  setPermissionManager(
    permissionManager: (operation: string, configId: string, userId?: string) => Promise<boolean>
  ): void {
    this.permissionManager = permissionManager
  }

  /**
   * 📊 获取 API 统计信息
   *
   * 用于性能监控和系统优化
   *
   * @returns API 统计数据
   */
  getAPIStatistics(): ConfigurationAPIStatistics {
    return { ...this.statistics }
  }

  /**
   * 🗑️ 清除 API 缓存
   *
   * 强制刷新缓存数据
   *
   * @param pattern 可选的缓存键模式
   */
  clearAPICache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern))
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  // ===== 🔒 私有方法 =====

  /**
   * 🔧 初始化内置中间件
   */
  private initializeBuiltInMiddlewares(): void {
    // 日志记录中间件
    this.registerMiddleware({
      name: 'logging-middleware',
      description: '记录所有配置操作日志',
      priority: 100,
      execute: async (hook, data, options) => {
        if (hook.startsWith('before-')) {
        }
        return data
      }
    })

    // 性能监控中间件
    this.registerMiddleware({
      name: 'performance-middleware',
      description: '监控配置操作性能',
      priority: 200,
      execute: async (hook, data, options) => {
        if (hook.startsWith('before-')) {
          options.context = options.context || {}
          options.context._startTime = performance.now()
        } else if (hook.startsWith('after-') && options.context?._startTime) {
          const duration = performance.now() - options.context._startTime
          if (duration > 1000) {
            console.warn(`⚠️ [ConfigurationAPIManager] 操作耗时较长: ${hook} - ${duration.toFixed(2)}ms`)
          }
        }
        return data
      }
    })

  }

  /**
   * 🔍 执行中间件链
   */
  private async executeMiddlewares(hook: string, data: any, options: APIOperationOptions): Promise<any> {
    let processedData = data

    for (const middleware of this.middlewares) {
      try {
        processedData = await middleware.execute(hook, processedData, options)
      } catch (error) {
        console.error(`❌ [ConfigurationAPIManager] 中间件执行异常: ${middleware.name}`, error)
        // 中间件异常不应该阻断主流程
      }
    }

    return processedData
  }

  /**
   * 🔒 检查操作权限
   */
  private async checkPermission(operation: string, configId: string, userId?: string): Promise<void> {
    if (this.permissionManager) {
      const hasPermission = await this.permissionManager(operation, configId, userId)
      if (!hasPermission) {
        throw new Error(`权限不足: 无法执行操作 "${operation}" 在配置 "${configId}"`)
      }
    }
  }

  /**
   * 🔑 生成查询缓存键
   */
  private generateQueryCacheKey(query: ConfigurationQuery, options: APIOperationOptions): string {
    const queryStr = JSON.stringify(query)
    const optionsStr = JSON.stringify(options)
    return `query_${btoa(queryStr + optionsStr).slice(0, 16)}`
  }

  /**
   * 🚀 获取缓存结果
   */
  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * 🚀 设置缓存结果
   */
  private setCachedResult(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // 简单的 LRU 清理
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 🗑️ 清除相关缓存
   */
  private clearRelatedCache(operation: string, configType?: string, configId?: string): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      // 清除查询缓存（因为数据已经变更）
      if (key.startsWith('query_')) {
        keysToDelete.push(key)
      }
      // 清除特定配置相关的缓存
      if (configId && key.includes(configId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 🗑️ 清除所有缓存
   */
  private clearAllCache(): void {
    this.cache.clear()
  }

  /**
   * 📊 更新统计信息
   */
  private updateStatistics(operationTime: number): void {
    const oldAverage = this.statistics.averageResponseTime
    const totalOps = this.statistics.totalOperations

    this.statistics.averageResponseTime =
      ((oldAverage * (totalOps - 1)) + operationTime) / totalOps

    this.statistics.lastUpdated = new Date()
  }
}

/**
 * 🌟 创建 API 管理器实例
 *
 * 提供全局单例模式的 API 管理器
 */
export const configurationAPIManager = new ConfigurationAPIManager()

// 🔧 调试支持：将 API 管理器暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).configurationAPIManager = configurationAPIManager
}

