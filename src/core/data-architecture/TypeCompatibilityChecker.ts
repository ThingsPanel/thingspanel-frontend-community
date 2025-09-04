/**
 * 类型兼容性检查机制
 * 用于验证不同组件和配置之间的类型兼容性，确保系统集成的正确性
 */

import type {
  HttpConfig,
  HttpParameter,
  PathParameter,
  ComponentDataRequirement,
  DataSourceRequirement,
  FieldRequirement,
  StaticParamRequirement,
  ValidationResult,
  DataType,
  ParamType,
  ValueMode,
  FieldType
} from './types/unified-types'

/**
 * 兼容性检查结果
 */
export interface CompatibilityCheckResult extends ValidationResult {
  /** 兼容性级别 */
  level: 'compatible' | 'warning' | 'incompatible'
  /** 检查类型 */
  checkType: string
  /** 影响的组件/字段 */
  affectedItems: string[]
  /** 建议的修复方案 */
  suggestions: string[]
  /** 检查时间戳 */
  timestamp: number
}

/**
 * 类型映射兼容性
 */
interface TypeMappingCompatibility {
  /** 源类型 */
  sourceType: string
  /** 目标类型 */
  targetType: string
  /** 是否兼容 */
  isCompatible: boolean
  /** 是否需要转换 */
  needsConversion: boolean
  /** 转换函数名 */
  conversionFunction?: string
}

/**
 * 组件接口兼容性
 */
interface ComponentInterfaceCompatibility {
  /** 组件类型 */
  componentType: string
  /** 期望的接口签名 */
  expectedInterface: Record<string, any>
  /** 实际的接口签名 */
  actualInterface: Record<string, any>
  /** 缺失的字段 */
  missingFields: string[]
  /** 额外的字段 */
  extraFields: string[]
  /** 类型不匹配的字段 */
  mismatchedFields: Array<{
    field: string
    expected: string
    actual: string
  }>
}

/**
 * 类型兼容性检查器
 */
export class TypeCompatibilityChecker {
  private static instance: TypeCompatibilityChecker | null = null

  /** 类型映射表 */
  private typeMappingTable = new Map<string, TypeMappingCompatibility[]>()

  /** 组件接口缓存 */
  private componentInterfaceCache = new Map<string, ComponentInterfaceCompatibility>()

  /** 检查历史记录 */
  private checkHistory: CompatibilityCheckResult[] = []

  private constructor() {
    this.initializeTypeMappingTable()
  }

  public static getInstance(): TypeCompatibilityChecker {
    if (!this.instance) {
      this.instance = new TypeCompatibilityChecker()
    }
    return this.instance
  }

  /**
   * 初始化类型映射表
   */
  private initializeTypeMappingTable(): void {
    // 基础类型兼容性映射
    const basicTypeMappings: TypeMappingCompatibility[] = [
      // string类型映射
      { sourceType: 'string', targetType: 'string', isCompatible: true, needsConversion: false },
      {
        sourceType: 'string',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'stringToNumber'
      },
      {
        sourceType: 'string',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'stringToBoolean'
      },

      // number类型映射
      { sourceType: 'number', targetType: 'number', isCompatible: true, needsConversion: false },
      {
        sourceType: 'number',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'numberToString'
      },
      {
        sourceType: 'number',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'numberToBoolean'
      },

      // boolean类型映射
      { sourceType: 'boolean', targetType: 'boolean', isCompatible: true, needsConversion: false },
      {
        sourceType: 'boolean',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'booleanToString'
      },
      {
        sourceType: 'boolean',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'booleanToNumber'
      },

      // json类型映射
      { sourceType: 'json', targetType: 'json', isCompatible: true, needsConversion: false },
      { sourceType: 'json', targetType: 'object', isCompatible: true, needsConversion: false },
      { sourceType: 'object', targetType: 'json', isCompatible: true, needsConversion: false },

      // any类型映射（兼容所有类型）
      {
        sourceType: 'any',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToString'
      },
      {
        sourceType: 'any',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToNumber'
      },
      {
        sourceType: 'any',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToBoolean'
      },
      { sourceType: 'any', targetType: 'object', isCompatible: true, needsConversion: false },
      { sourceType: 'any', targetType: 'array', isCompatible: true, needsConversion: false }
    ]

    this.typeMappingTable.set('basic', basicTypeMappings)

    // HTTP参数类型映射
    const httpParameterMappings: TypeMappingCompatibility[] = [
      { sourceType: 'path', targetType: 'query', isCompatible: false, needsConversion: false },
      {
        sourceType: 'query',
        targetType: 'header',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'queryToHeader'
      },
      {
        sourceType: 'header',
        targetType: 'query',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'headerToQuery'
      }
    ]

    this.typeMappingTable.set('httpParameter', httpParameterMappings)
  }

  /**
   * 检查HTTP配置兼容性
   */
  public checkHttpConfigCompatibility(config: HttpConfig): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    try {
      // 1. 检查URL格式兼容性
      const urlCheck = this.checkUrlFormat(config.url)
      if (!urlCheck.isValid) {
        errors.push(`URL格式错误: ${urlCheck.error}`)
        affectedItems.push('url')
        suggestions.push('请使用标准的HTTP URL格式')
      }

      // 2. 检查HTTP方法兼容性
      const methodCheck = this.checkHttpMethod(config.method)
      if (!methodCheck.isValid) {
        errors.push(`HTTP方法不支持: ${config.method}`)
        affectedItems.push('method')
        suggestions.push('请使用标准的HTTP方法: GET, POST, PUT, DELETE, PATCH')
      }

      // 3. 检查参数类型兼容性
      if (config.params) {
        const paramsCheck = this.checkHttpParametersCompatibility(config.params, 'query')
        errors.push(...paramsCheck.errors)
        warnings.push(...paramsCheck.warnings)
        affectedItems.push(...paramsCheck.affectedItems)
        suggestions.push(...paramsCheck.suggestions)
      }

      // 4. 检查请求头兼容性
      if (config.headers) {
        const headersCheck = this.checkHttpParametersCompatibility(config.headers, 'header')
        errors.push(...headersCheck.errors)
        warnings.push(...headersCheck.warnings)
        affectedItems.push(...headersCheck.affectedItems)
        suggestions.push(...headersCheck.suggestions)
      }

      // 5. 检查路径参数兼容性
      if (config.pathParameter) {
        const pathParamCheck = this.checkPathParameterCompatibility(config.pathParameter, config.url)
        if (!pathParamCheck.isValid) {
          errors.push(...pathParamCheck.errors)
          warnings.push(...pathParamCheck.warnings)
          affectedItems.push('pathParameter')
          suggestions.push(...pathParamCheck.suggestions)
        }
      }

      // 6. 检查超时值合理性
      if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
        warnings.push(`超时时间设置可能不合理: ${config.timeout}ms`)
        affectedItems.push('timeout')
        suggestions.push('建议超时时间设置在1秒到5分钟之间')
      }

      const level = errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible'

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        level,
        checkType: 'HttpConfig',
        affectedItems,
        suggestions,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`HTTP配置兼容性检查失败: ${error.message}`],
        warnings: [],
        level: 'incompatible',
        checkType: 'HttpConfig',
        affectedItems: ['entire_config'],
        suggestions: ['请检查HTTP配置格式是否正确'],
        timestamp: Date.now()
      }
    }
  }

  /**
   * 检查组件数据需求兼容性
   */
  public checkComponentDataRequirementCompatibility(requirement: ComponentDataRequirement): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    try {
      // 1. 检查组件ID格式
      if (!requirement.componentId || typeof requirement.componentId !== 'string') {
        errors.push('组件ID无效或缺失')
        affectedItems.push('componentId')
        suggestions.push('请提供有效的组件ID字符串')
      }

      // 2. 检查静态参数兼容性
      if (requirement.staticParams) {
        for (let i = 0; i < requirement.staticParams.length; i++) {
          const param = requirement.staticParams[i]
          const paramCheck = this.checkStaticParamCompatibility(param, i)
          if (!paramCheck.valid) {
            errors.push(...paramCheck.errors)
            warnings.push(...paramCheck.warnings)
            affectedItems.push(`staticParams[${i}]`)
            suggestions.push(...paramCheck.suggestions)
          }
        }
      }

      // 3. 检查数据源需求兼容性
      if (requirement.dataSources && requirement.dataSources.length > 0) {
        for (let i = 0; i < requirement.dataSources.length; i++) {
          const dataSource = requirement.dataSources[i]
          const dataSourceCheck = this.checkDataSourceRequirementCompatibility(dataSource, i)
          if (!dataSourceCheck.valid) {
            errors.push(...dataSourceCheck.errors)
            warnings.push(...dataSourceCheck.warnings)
            affectedItems.push(`dataSources[${i}]`)
            suggestions.push(...dataSourceCheck.suggestions)
          }
        }
      } else {
        warnings.push('组件没有定义任何数据源需求')
        suggestions.push('考虑添加数据源需求以支持动态数据')
      }

      // 4. 检查字段命名冲突
      const fieldNames = new Set<string>()
      if (requirement.staticParams) {
        requirement.staticParams.forEach(param => {
          if (fieldNames.has(param.key)) {
            errors.push(`静态参数字段名重复: ${param.key}`)
            affectedItems.push(`staticParams.${param.key}`)
            suggestions.push(`请为字段 ${param.key} 使用唯一的名称`)
          }
          fieldNames.add(param.key)
        })
      }

      const level = errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible'

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        level,
        checkType: 'ComponentDataRequirement',
        affectedItems,
        suggestions,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`组件数据需求兼容性检查失败: ${error.message}`],
        warnings: [],
        level: 'incompatible',
        checkType: 'ComponentDataRequirement',
        affectedItems: ['entire_requirement'],
        suggestions: ['请检查组件数据需求格式是否正确'],
        timestamp: Date.now()
      }
    }
  }

  /**
   * 检查数据类型兼容性
   */
  public checkDataTypeCompatibility(
    sourceType: DataType | FieldType,
    targetType: DataType | FieldType
  ): CompatibilityCheckResult {
    const basicMappings = this.typeMappingTable.get('basic') || []
    const mapping = basicMappings.find(m => m.sourceType === sourceType && m.targetType === targetType)

    if (!mapping) {
      return {
        valid: false,
        errors: [`不支持从 ${sourceType} 到 ${targetType} 的类型转换`],
        warnings: [],
        level: 'incompatible',
        checkType: 'DataTypeCompatibility',
        affectedItems: [sourceType, targetType],
        suggestions: [`考虑使用兼容的数据类型或添加类型转换逻辑`],
        timestamp: Date.now()
      }
    }

    const warnings: string[] = []
    const suggestions: string[] = []

    if (mapping.needsConversion) {
      warnings.push(`需要进行类型转换: ${sourceType} -> ${targetType}`)
      suggestions.push(`使用转换函数: ${mapping.conversionFunction}`)
    }

    return {
      valid: mapping.isCompatible,
      errors: [],
      warnings,
      level: mapping.isCompatible ? (warnings.length > 0 ? 'warning' : 'compatible') : 'incompatible',
      checkType: 'DataTypeCompatibility',
      affectedItems: [sourceType, targetType],
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * 批量检查兼容性
   */
  public batchCompatibilityCheck(
    items: Array<{
      type: 'httpConfig' | 'componentRequirement' | 'dataType'
      data: any
      id: string
    }>
  ): CompatibilityCheckResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const allSuggestions: string[] = []
    const allAffectedItems: string[] = []

    for (const item of items) {
      let result: CompatibilityCheckResult

      switch (item.type) {
        case 'httpConfig':
          result = this.checkHttpConfigCompatibility(item.data)
          break
        case 'componentRequirement':
          result = this.checkComponentDataRequirementCompatibility(item.data)
          break
        case 'dataType':
          result = this.checkDataTypeCompatibility(item.data.sourceType, item.data.targetType)
          break
        default:
          continue
      }

      if (!result.valid) {
        allErrors.push(...result.errors.map(error => `[${item.id}] ${error}`))
      }
      allWarnings.push(...result.warnings.map(warning => `[${item.id}] ${warning}`))
      allSuggestions.push(...result.suggestions.map(suggestion => `[${item.id}] ${suggestion}`))
      allAffectedItems.push(...result.affectedItems.map(item => `${item.id}.${item}`))
    }

    const level = allErrors.length > 0 ? 'incompatible' : allWarnings.length > 0 ? 'warning' : 'compatible'

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      level,
      checkType: 'BatchCompatibilityCheck',
      affectedItems: allAffectedItems,
      suggestions: allSuggestions,
      timestamp: Date.now()
    }
  }

  /**
   * URL格式检查
   */
  private checkUrlFormat(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL不能为空' }
    }

    try {
      // 检查是否是相对路径（允许）
      if (url.startsWith('/')) {
        return { isValid: true }
      }

      // 检查是否是完整URL
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: '只支持HTTP和HTTPS协议' }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: 'URL格式不正确' }
    }
  }

  /**
   * HTTP方法检查
   */
  private checkHttpMethod(method: string): { isValid: boolean } {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    return { isValid: validMethods.includes(method.toUpperCase()) }
  }

  /**
   * HTTP参数兼容性检查
   */
  private checkHttpParametersCompatibility(
    parameters: HttpParameter[],
    paramType: ParamType
  ): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]

      // 检查必填字段
      if (!param.key) {
        errors.push(`参数[${i}]缺少key字段`)
        affectedItems.push(`params[${i}].key`)
        suggestions.push(`为参数[${i}]提供有效的key值`)
      }

      // 检查数据类型
      if (!['string', 'number', 'boolean', 'json'].includes(param.dataType)) {
        errors.push(`参数[${i}]数据类型无效: ${param.dataType}`)
        affectedItems.push(`params[${i}].dataType`)
        suggestions.push(`使用有效的数据类型: string, number, boolean, json`)
      }

      // 检查参数类型匹配
      if (param.paramType && param.paramType !== paramType) {
        warnings.push(`参数[${i}]类型不匹配，期望: ${paramType}, 实际: ${param.paramType}`)
        affectedItems.push(`params[${i}].paramType`)
        suggestions.push(`统一参数类型为: ${paramType}`)
      }

      // 检查动态参数的变量名
      if (param.isDynamic && !param.variableName) {
        errors.push(`动态参数[${i}]缺少variableName`)
        affectedItems.push(`params[${i}].variableName`)
        suggestions.push(`为动态参数[${i}]提供变量名`)
      }

      // 检查值模式兼容性
      if (param.valueMode && !['manual', 'dropdown', 'property', 'component'].includes(param.valueMode)) {
        errors.push(`参数[${i}]值模式无效: ${param.valueMode}`)
        affectedItems.push(`params[${i}].valueMode`)
        suggestions.push(`使用有效的值模式: manual, dropdown, property, component`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      level: errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      checkType: `HttpParameter_${paramType}`,
      affectedItems,
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * 路径参数兼容性检查
   */
  private checkPathParameterCompatibility(pathParam: PathParameter, url: string): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // 检查URL是否包含路径参数占位符
    if (pathParam.isDynamic && !url.includes('{') && !url.includes(':')) {
      warnings.push('URL中没有找到路径参数占位符，但参数被标记为动态')
      suggestions.push('请在URL中添加路径参数占位符，如: /api/device/{id}')
    }

    // 检查数据类型
    if (!['string', 'number', 'boolean', 'json'].includes(pathParam.dataType)) {
      errors.push(`路径参数数据类型无效: ${pathParam.dataType}`)
      suggestions.push('使用有效的数据类型: string, number, boolean, json')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      level: errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      checkType: 'PathParameter',
      affectedItems: ['pathParameter'],
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * 静态参数兼容性检查
   */
  private checkStaticParamCompatibility(param: StaticParamRequirement, index: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!param.key) {
      errors.push('静态参数缺少key字段')
      suggestions.push('提供唯一的参数键名')
    }

    if (!param.name) {
      errors.push('静态参数缺少name字段')
      suggestions.push('提供参数显示名称')
    }

    if (!['string', 'number', 'boolean', 'object', 'array'].includes(param.type)) {
      errors.push(`静态参数类型无效: ${param.type}`)
      suggestions.push('使用有效的类型: string, number, boolean, object, array')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 数据源需求兼容性检查
   */
  private checkDataSourceRequirementCompatibility(requirement: DataSourceRequirement, index: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!requirement.key) {
      errors.push('数据源需求缺少key字段')
      suggestions.push('提供唯一的数据源键名')
    }

    if (!requirement.supportedTypes || requirement.supportedTypes.length === 0) {
      errors.push('数据源需求没有定义支持的类型')
      suggestions.push('至少定义一种支持的数据源类型')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取检查历史
   */
  public getCheckHistory(): CompatibilityCheckResult[] {
    return [...this.checkHistory]
  }

  /**
   * 清除检查历史
   */
  public clearCheckHistory(): void {
    this.checkHistory = []
  }

  /**
   * 获取类型映射统计
   */
  public getTypeMappingStats() {
    const stats = new Map<string, number>()

    for (const [category, mappings] of this.typeMappingTable) {
      stats.set(category, mappings.length)
    }

    return {
      categories: Array.from(this.typeMappingTable.keys()),
      totalMappings: Array.from(stats.values()).reduce((sum, count) => sum + count, 0),
      categoryStats: Object.fromEntries(stats)
    }
  }
}

/**
 * 导出单例实例
 */
export const typeCompatibilityChecker = TypeCompatibilityChecker.getInstance()

/**
 * 便捷的兼容性检查方法
 */
export function checkHttpConfigCompatibility(config: HttpConfig): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkHttpConfigCompatibility(config)
}

export function checkComponentDataRequirementCompatibility(
  requirement: ComponentDataRequirement
): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkComponentDataRequirementCompatibility(requirement)
}

export function checkDataTypeCompatibility(
  sourceType: DataType | FieldType,
  targetType: DataType | FieldType
): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkDataTypeCompatibility(sourceType, targetType)
}

// 开发环境调试接口
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__TYPE_COMPATIBILITY_CHECKER__ = {
    checker: typeCompatibilityChecker,
    checkHttpConfig: checkHttpConfigCompatibility,
    checkComponentRequirement: checkComponentDataRequirementCompatibility,
    checkDataType: checkDataTypeCompatibility,
    getStats: () => typeCompatibilityChecker.getTypeMappingStats(),
    getHistory: () => typeCompatibilityChecker.getCheckHistory(),
    clearHistory: () => typeCompatibilityChecker.clearCheckHistory()
  }
}
