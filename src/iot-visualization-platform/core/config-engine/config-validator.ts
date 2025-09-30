/**
 * Config Engine 配置验证系统
 *
 * 核心功能：
 * 1. JSON Schema 验证 - 结构化配置数据的强制验证
 * 2. 自定义验证规则引擎 - 业务逻辑层面的验证扩展
 * 3. 内置验证规则库 - 常见配置类型的预定义验证
 * 4. 批量验证支持 - 高效处理大量配置验证
 * 5. 验证结果缓存 - 避免重复验证提升性能
 * 6. 上下文相关验证 - 基于运行环境的动态验证
 *
 * 设计原则：
 * - 高性能：智能缓存和批量处理
 * - 可扩展：插件式验证规则系统
 * - 类型安全：完整的 TypeScript 支持
 * - 向后兼容：支持现有配置格式
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import type {
  ConfigurationItem,
  ConfigurationType,
  ConfigurationValidationResult,
  ValidationRule,
  ValidationContext,
  JsonSchemaValidator,
  ValidationCacheEntry
} from './types'

/**
 * 验证错误详情接口
 * 提供详细的错误信息和修复建议
 */
interface ValidationError {
  /** 错误代码 - 便于程序化处理 */
  code: string
  /** 错误消息 - 用户友好的错误描述 */
  message: string
  /** 错误路径 - 指向具体的配置字段 */
  path: string
  /** 期望值 - 用于修复建议 */
  expected?: any
  /** 实际值 - 导致错误的当前值 */
  actual?: any
  /** 修复建议 - 自动生成的修复方案 */
  suggestion?: string
  /** 严重程度 - error（阻断）、warning（警告）、info（信息） */
  severity: 'error' | 'warning' | 'info'
}

/**
 * 验证统计信息
 * 用于性能监控和优化分析
 */
interface ValidationStatistics {
  /** 总验证次数 */
  totalValidations: number
  /** 缓存命中次数 */
  cacheHits: number
  /** 验证失败次数 */
  failedValidations: number
  /** 平均验证时间（毫秒） */
  averageValidationTime: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 内置验证规则枚举
 * 预定义的常用验证规则类型
 */
enum BuiltInValidationRule {
  /** 必填字段验证 */
  REQUIRED_FIELD = 'required-field',
  /** 数据类型验证 */
  DATA_TYPE = 'data-type',
  /** 范围值验证 */
  RANGE_VALIDATION = 'range-validation',
  /** 格式验证（邮箱、URL等） */
  FORMAT_VALIDATION = 'format-validation',
  /** 唯一性验证 */
  UNIQUENESS = 'uniqueness',
  /** 依赖关系验证 */
  DEPENDENCY = 'dependency',
  /** 业务规则验证 */
  BUSINESS_RULE = 'business-rule'
}

/**
 * 📋 配置验证器核心类
 *
 * 统一处理所有配置验证需求，提供高性能、可扩展的验证能力
 *
 * 主要功能：
 * - JSON Schema 结构验证
 * - 自定义业务规则验证
 * - 验证结果缓存管理
 * - 批量验证优化
 * - 验证统计和监控
 */
export class ConfigurationValidator {
  /** 🔧 自定义验证规则注册表 */
  private customValidationRules = new Map<string, ValidationRule>()

  /** 🔧 JSON Schema 验证器注册表 */
  private schemaValidators = new Map<ConfigurationType, JsonSchemaValidator>()

  /** 🚀 验证结果缓存 - 避免重复验证 */
  private validationCache = new Map<string, ValidationCacheEntry>()

  /** 📊 验证统计信息 */
  private statistics: ValidationStatistics = {
    totalValidations: 0,
    cacheHits: 0,
    failedValidations: 0,
    averageValidationTime: 0,
    lastUpdated: new Date()
  }

  /** 🔧 缓存过期时间（毫秒） - 5分钟 */
  private readonly CACHE_EXPIRY_TIME = 5 * 60 * 1000

  constructor() {
    // 初始化内置验证规则
    this.initializeBuiltInRules()

    // 初始化内置 JSON Schema 验证器
    this.initializeBuiltInSchemas()

  }

  /**
   * 🎯 验证单个配置项
   *
   * 核心验证流程：
   * 1. 检查缓存
   * 2. JSON Schema 验证
   * 3. 自定义规则验证
   * 4. 缓存结果
   *
   * @param item 待验证的配置项
   * @param context 验证上下文环境
   * @returns 验证结果
   */
  async validateConfiguration(
    item: ConfigurationItem,
    context?: Partial<ValidationContext>
  ): Promise<ConfigurationValidationResult> {
    const startTime = performance.now()
    this.statistics.totalValidations++

    try {
      // 🚀 步骤1：检查缓存
      const cacheKey = this.generateCacheKey(item, context)
      const cachedResult = this.getCachedValidation(cacheKey)

      if (cachedResult) {
        this.statistics.cacheHits++
        return cachedResult
      }

      // 🔍 步骤2：执行验证
      const errors: ValidationError[] = []
      const warnings: ValidationError[] = []

      // JSON Schema 验证
      const schemaErrors = await this.validateWithSchema(item)
      errors.push(...schemaErrors.filter(e => e.severity === 'error'))
      warnings.push(...schemaErrors.filter(e => e.severity === 'warning'))

      // 自定义规则验证
      const customErrors = await this.validateWithCustomRules(item, context)
      errors.push(...customErrors.filter(e => e.severity === 'error'))
      warnings.push(...customErrors.filter(e => e.severity === 'warning'))

      // 🏁 步骤3：构建验证结果
      const result: ConfigurationValidationResult = {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        validatedAt: new Date(),
        validationDuration: performance.now() - startTime,
        context: context || {}
      }

      // 🚀 步骤4：缓存结果
      this.cacheValidationResult(cacheKey, result)

      // 📊 更新统计
      if (!result.isValid) {
        this.statistics.failedValidations++
      }

      this.updateStatistics(performance.now() - startTime)

      return result

    } catch (error) {
      console.error(`❌ [ConfigurationValidator] 验证异常 - ${item.id}:`, error)

      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: `验证过程发生异常: ${error instanceof Error ? error.message : '未知错误'}`,
          path: 'root',
          severity: 'error'
        }],
        warnings: [],
        validatedAt: new Date(),
        validationDuration: performance.now() - startTime,
        context: context || {}
      }
    }
  }

  /**
   * 🚀 批量验证配置项
   *
   * 优化策略：
   * - 并行验证提升性能
   * - 智能缓存减少重复计算
   * - 错误聚合便于问题定位
   *
   * @param items 待验证的配置项列表
   * @param context 共享的验证上下文
   * @returns 批量验证结果
   */
  async validateConfigurations(
    items: ConfigurationItem[],
    context?: Partial<ValidationContext>
  ): Promise<Map<string, ConfigurationValidationResult>> {

    const results = new Map<string, ConfigurationValidationResult>()

    // 并行验证所有配置项
    const validationPromises = items.map(async item => {
      const result = await this.validateConfiguration(item, context)
      return { id: item.id, result }
    })

    const validationResults = await Promise.allSettled(validationPromises)

    // 处理验证结果
    validationResults.forEach((promiseResult, index) => {
      if (promiseResult.status === 'fulfilled') {
        const { id, result } = promiseResult.value
        results.set(id, result)
      } else {
        // 处理验证失败的情况
        const item = items[index]
        results.set(item.id, {
          isValid: false,
          errors: [{
            code: 'BATCH_VALIDATION_FAILED',
            message: `批量验证失败: ${promiseResult.reason}`,
            path: 'root',
            severity: 'error'
          }],
          warnings: [],
          validatedAt: new Date(),
          validationDuration: 0,
          context: context || {}
        })
      }
    })

    const validCount = Array.from(results.values()).filter(r => r.isValid).length

    return results
  }

  /**
   * 🔧 注册自定义验证规则
   *
   * 允许外部系统扩展验证能力
   *
   * @param rule 自定义验证规则
   */
  registerValidationRule(rule: ValidationRule): void {
    this.customValidationRules.set(rule.name, rule)
  }

  /**
   * 🔧 注册 JSON Schema 验证器
   *
   * 为特定配置类型注册结构化验证
   *
   * @param type 配置类型
   * @param validator Schema 验证器
   */
  registerSchemaValidator(type: ConfigurationType, validator: JsonSchemaValidator): void {
    this.schemaValidators.set(type, validator)
  }

  /**
   * 🗑️ 清除验证缓存
   *
   * 用于配置更新后强制重新验证
   *
   * @param configurationId 可选的配置ID，如果不提供则清除所有缓存
   */
  clearValidationCache(configurationId?: string): void {
    if (configurationId) {
      // 清除特定配置的缓存
      const keysToDelete = Array.from(this.validationCache.keys())
        .filter(key => key.includes(configurationId))

      keysToDelete.forEach(key => this.validationCache.delete(key))
    } else {
      // 清除所有缓存
      this.validationCache.clear()
    }
  }

  /**
   * 📊 获取验证统计信息
   *
   * 用于性能监控和系统优化
   *
   * @returns 验证统计数据
   */
  getValidationStatistics(): ValidationStatistics {
    return { ...this.statistics }
  }

  // ===== 🔒 私有方法 =====

  /**
   * 🔧 初始化内置验证规则
   */
  private initializeBuiltInRules(): void {
    // 必填字段验证规则
    this.registerValidationRule({
      name: BuiltInValidationRule.REQUIRED_FIELD,
      description: '验证必填字段是否存在',
      validate: async (item: ConfigurationItem, context?: ValidationContext) => {
        const errors: ValidationError[] = []

        // 检查基础必填字段
        const requiredFields = ['id', 'name', 'type', 'data']

        for (const field of requiredFields) {
          if (!item[field as keyof ConfigurationItem]) {
            errors.push({
              code: 'MISSING_REQUIRED_FIELD',
              message: `缺少必填字段: ${field}`,
              path: field,
              expected: '非空值',
              actual: item[field as keyof ConfigurationItem],
              suggestion: `请为字段 ${field} 提供有效值`,
              severity: 'error'
            })
          }
        }

        return errors
      }
    })

    // 数据类型验证规则
    this.registerValidationRule({
      name: BuiltInValidationRule.DATA_TYPE,
      description: '验证配置数据的类型正确性',
      validate: async (item: ConfigurationItem, context?: ValidationContext) => {
        const errors: ValidationError[] = []

        // 验证 ID 必须是字符串
        if (typeof item.id !== 'string') {
          errors.push({
            code: 'INVALID_DATA_TYPE',
            message: '配置ID必须是字符串类型',
            path: 'id',
            expected: 'string',
            actual: typeof item.id,
            suggestion: '请确保ID是字符串格式',
            severity: 'error'
          })
        }

        // 验证名称必须是字符串
        if (typeof item.name !== 'string') {
          errors.push({
            code: 'INVALID_DATA_TYPE',
            message: '配置名称必须是字符串类型',
            path: 'name',
            expected: 'string',
            actual: typeof item.name,
            suggestion: '请确保名称是字符串格式',
            severity: 'error'
          })
        }

        return errors
      }
    })

    // 业务规则验证
    this.registerValidationRule({
      name: BuiltInValidationRule.BUSINESS_RULE,
      description: '验证 ThingsPanel 特定的业务规则',
      validate: async (item: ConfigurationItem, context?: ValidationContext) => {
        const errors: ValidationError[] = []

        // 验证配置ID命名规范（应该包含类型前缀）
        if (!item.id.includes(item.type)) {
          errors.push({
            code: 'BUSINESS_RULE_VIOLATION',
            message: '配置ID应该包含配置类型作为前缀',
            path: 'id',
            expected: `包含 "${item.type}" 的ID`,
            actual: item.id,
            suggestion: `建议使用格式: ${item.type}-${item.id}`,
            severity: 'warning'
          })
        }

        // 验证设备相关配置的特殊规则
        if (item.type === ConfigurationType.DEVICE_TEMPLATE && item.data) {
          const deviceData = item.data as any
          if (!deviceData.protocol) {
            errors.push({
              code: 'MISSING_DEVICE_PROTOCOL',
              message: '设备模板配置必须指定通信协议',
              path: 'data.protocol',
              expected: '有效的设备协议',
              actual: 'undefined',
              suggestion: '请在设备配置中添加 protocol 字段',
              severity: 'error'
            })
          }
        }

        return errors
      }
    })

  }

  /**
   * 🔧 初始化内置 JSON Schema 验证器
   */
  private initializeBuiltInSchemas(): void {
    // 这里可以根据需要添加各种配置类型的 JSON Schema
    // 暂时使用基础的验证逻辑，后续可以扩展为完整的 JSON Schema

  }

  /**
   * 🔍 使用 JSON Schema 验证配置
   */
  private async validateWithSchema(item: ConfigurationItem): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    const validator = this.schemaValidators.get(item.type)

    if (validator) {
      try {
        const isValid = await validator.validate(item.data)

        if (!isValid && validator.getErrors) {
          const schemaErrors = validator.getErrors()
          errors.push(...schemaErrors.map(error => ({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: `JSON Schema 验证失败: ${error.message || '未知错误'}`,
            path: error.instancePath || 'data',
            expected: error.schema,
            actual: error.data,
            suggestion: `请检查 ${error.instancePath || 'data'} 字段的数据格式`,
            severity: 'error' as const
          })))
        }
      } catch (error) {
        errors.push({
          code: 'SCHEMA_VALIDATION_EXCEPTION',
          message: `Schema 验证异常: ${error instanceof Error ? error.message : '未知错误'}`,
          path: 'data',
          severity: 'error'
        })
      }
    }

    return errors
  }

  /**
   * 🔍 使用自定义规则验证配置
   */
  private async validateWithCustomRules(
    item: ConfigurationItem,
    context?: Partial<ValidationContext>
  ): Promise<ValidationError[]> {
    const allErrors: ValidationError[] = []

    // 执行所有注册的自定义验证规则
    for (const [ruleName, rule] of this.customValidationRules) {
      try {
        const errors = await rule.validate(item, context)
        allErrors.push(...errors)
      } catch (error) {
        allErrors.push({
          code: 'CUSTOM_RULE_EXCEPTION',
          message: `自定义验证规则 "${ruleName}" 执行异常: ${error instanceof Error ? error.message : '未知错误'}`,
          path: 'root',
          severity: 'error'
        })
      }
    }

    return allErrors
  }

  /**
   * 🔑 生成缓存键
   */
  private generateCacheKey(item: ConfigurationItem, context?: Partial<ValidationContext>): string {
    // 基于配置内容和上下文生成唯一缓存键
    const itemHash = JSON.stringify({
      id: item.id,
      type: item.type,
      version: item.version,
      data: item.data
    })

    const contextHash = JSON.stringify(context || {})

    return `${item.id}_${btoa(itemHash + contextHash).slice(0, 16)}`
  }

  /**
   * 🚀 获取缓存的验证结果
   */
  private getCachedValidation(cacheKey: string): ConfigurationValidationResult | null {
    const cached = this.validationCache.get(cacheKey)

    if (!cached) {
      return null
    }

    // 检查缓存是否过期
    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_EXPIRY_TIME) {
      this.validationCache.delete(cacheKey)
      return null
    }

    return cached.result
  }

  /**
   * 🚀 缓存验证结果
   */
  private cacheValidationResult(cacheKey: string, result: ConfigurationValidationResult): void {
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    // 定期清理过期缓存（简单的LRU策略）
    if (this.validationCache.size > 1000) {
      const now = Date.now()
      for (const [key, entry] of this.validationCache) {
        if (now - entry.timestamp > this.CACHE_EXPIRY_TIME) {
          this.validationCache.delete(key)
        }
      }
    }
  }

  /**
   * 📊 更新验证统计信息
   */
  private updateStatistics(validationTime: number): void {
    const oldAverage = this.statistics.averageValidationTime
    const totalValidations = this.statistics.totalValidations

    // 计算新的平均验证时间
    this.statistics.averageValidationTime =
      ((oldAverage * (totalValidations - 1)) + validationTime) / totalValidations

    this.statistics.lastUpdated = new Date()
  }
}

/**
 * 🌟 创建配置验证器实例
 *
 * 提供全局单例模式的验证器实例
 */
export const configurationValidator = new ConfigurationValidator()

/**
 * 🚀 快捷验证函数
 *
 * 提供便捷的配置验证接口
 *
 * @param item 待验证的配置项
 * @param context 可选的验证上下文
 * @returns 验证结果
 */
export async function validateConfiguration(
  item: ConfigurationItem,
  context?: Partial<ValidationContext>
): Promise<ConfigurationValidationResult> {
  return configurationValidator.validateConfiguration(item, context)
}

/**
 * 🚀 快捷批量验证函数
 *
 * 提供便捷的批量配置验证接口
 *
 * @param items 待验证的配置项列表
 * @param context 可选的共享验证上下文
 * @returns 批量验证结果
 */
export async function validateConfigurations(
  items: ConfigurationItem[],
  context?: Partial<ValidationContext>
): Promise<Map<string, ConfigurationValidationResult>> {
  return configurationValidator.validateConfigurations(items, context)
}

// 🔧 调试支持：将验证器暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).configurationValidator = configurationValidator
  ;(window as any).validateConfiguration = validateConfiguration
  ;(window as any).validateConfigurations = validateConfigurations
}

