/**
 * 增强版数据架构类型定义
 * 基于现有架构扩展，保持向后兼容性
 *
 * 设计目标：
 * 1. 泛型化数据项配置，支持扩展
 * 2. 保持现有类型系统100%兼容
 * 3. 为动态参数系统预留接口
 * 4. 支持配置版本管理和自动适配
 */

// ==================== 基础类型导入 ====================
import type {
  DataItem as LegacyDataItem,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig,
  WebSocketDataItemConfig,
  ScriptDataItemConfig
} from '../executors/DataItemFetcher'

import type { ProcessingConfig } from '../executors/DataItemProcessor'

import type { MergeStrategy } from '../executors/DataSourceMerger'

import type {
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  ExecutionResult
} from '../executors/MultiLayerExecutorChain'

// ==================== 泛型化数据项配置 ====================

/**
 * 泛型化数据项配置基础接口
 * 支持任意类型的配置结构扩展
 */
export interface DataItemConfig<T = any> {
  /** 数据项类型标识 */
  type: string

  /** 数据项唯一标识符 */
  id: string

  /** 类型特定的配置参数 */
  config: T

  /** 数据处理配置（复用现有ProcessingConfig） */
  processing?: ProcessingConfig

  /** 数据项元数据 */
  metadata?: DataItemMetadata
}

/**
 * 数据项元数据接口
 * 用于存储额外的配置信息和状态
 */
export interface DataItemMetadata {
  /** 数据项显示名称 */
  displayName?: string

  /** 数据项描述 */
  description?: string

  /** 创建时间 */
  createdAt?: number

  /** 最后更新时间 */
  lastUpdated?: number

  /** 数据项启用状态 */
  enabled?: boolean

  /** 自定义标签 */
  tags?: string[]
}

// ==================== 具体数据项类型实现 ====================

/**
 * JSON数据项配置（增强版）
 * 保持与现有JsonDataItemConfig的兼容性
 */
export interface EnhancedJsonDataItemConfig {
  /** JSON数据内容 */
  jsonData: string

  /** 数据验证选项 */
  validation?: {
    /** 是否启用JSON格式验证 */
    enableFormat: boolean
    /** 是否启用数据结构验证 */
    enableStructure: boolean
    /** JSON Schema（可选） */
    schema?: any
  }

  /** 数据预处理选项 */
  preprocessing?: {
    /** 是否去除注释 */
    removeComments: boolean
    /** 是否格式化输出 */
    formatOutput: boolean
  }
}

/**
 * HTTP数据项配置（增强版）
 * 为动态参数系统预留扩展接口
 */
export interface EnhancedHttpDataItemConfig {
  /** 请求URL（支持模板语法 {{paramName}}） */
  url: string

  /** HTTP请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 请求头配置（数组格式，支持动态参数） */
  headers: HttpHeader[]

  /** URL参数配置（新增，支持动态参数） */
  params: HttpParam[]

  /** 请求体配置 */
  body?: HttpBody

  /** 请求超时时间（毫秒） */
  timeout?: number

  /** 请求前脚本（预留） */
  preRequestScript?: string

  /** 响应后脚本（预留） */
  responseScript?: string

  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number
    /** 重试间隔（毫秒） */
    retryDelay: number
  }
}

/**
 * HTTP头部配置
 * 支持静态值和动态参数两种模式
 */
export interface HttpHeader {
  /** 头部字段名 */
  key: string

  /** 头部字段值（静态时为实际值，动态时为示例值） */
  value: string

  /** 是否启用此头部 */
  enabled: boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 自动生成的变量名（格式：http_${key}） */
  variableName: string

  /** 参数说明（动态参数必填，静态参数可选） */
  description?: string
}

/**
 * HTTP参数配置
 * 支持静态值和动态参数两种模式
 */
export interface HttpParam {
  /** 参数名 */
  key: string

  /** 参数值（静态时为实际值，动态时为示例值） */
  value: string

  /** 是否启用此参数 */
  enabled: boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 自动生成的变量名（格式：http_${key}） */
  variableName: string

  /** 参数说明（动态参数必填，静态参数可选） */
  description?: string
}

/**
 * HTTP请求体配置
 */
export interface HttpBody {
  /** 请求体类型 */
  type: 'json' | 'form' | 'text' | 'binary'

  /** 请求体内容 */
  content: any

  /** 内容类型 */
  contentType?: string
}

// ==================== 动态参数系统与占位符解析 ====================

/**
 * 动态参数定义（预留接口）
 * 用于HTTP动态参数系统
 */
export interface DynamicParam {
  /** 参数名称 */
  name: string

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object'

  /** 当前参数值 */
  currentValue: any

  /** 示例值 */
  exampleValue?: any

  /** 参数描述 */
  description?: string

  /** 是否必填参数 */
  required?: boolean

  /** 参数验证规则 */
  validation?: {
    /** 最小值/最小长度 */
    min?: number
    /** 最大值/最大长度 */
    max?: number
    /** 正则表达式 */
    pattern?: string
    /** 枚举值 */
    enum?: any[]
  }
}

/**
 * 占位符配置接口
 * 用于{{variableName}}占位符系统
 */
export interface PlaceholderConfig {
  /** 占位符名称（不包含{{}}） */
  name: string

  /** 占位符当前值 */
  value: any

  /** 数据类型 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 是否为必填占位符 */
  required: boolean

  /** 占位符描述 */
  description?: string

  /** 默认值 */
  defaultValue?: any

  /** 验证规则 */
  validation?: PlaceholderValidationRule
}

/**
 * 占位符验证规则
 */
export interface PlaceholderValidationRule {
  /** 最小值/最小长度 */
  min?: number

  /** 最大值/最大长度 */
  max?: number

  /** 正则表达式（字符串类型时使用） */
  pattern?: string

  /** 枚举值列表 */
  enum?: any[]

  /** 自定义验证函数名称 */
  customValidator?: string
}

/**
 * 占位符依赖分析结果
 */
export interface PlaceholderDependencyAnalysis {
  /** 分析的配置对象标识 */
  configId: string

  /** 发现的所有占位符名称列表 */
  placeholders: string[]

  /** 占位符详细信息映射 */
  placeholderDetails: Map<string, PlaceholderDependencyDetail>

  /** 是否检测到循环依赖 */
  hasCircularDependency: boolean

  /** 循环依赖路径（如果存在） */
  circularDependencyPaths?: string[][]
}

/**
 * 单个占位符的依赖详情
 */
export interface PlaceholderDependencyDetail {
  /** 占位符名称 */
  name: string

  /** 在配置中出现的位置路径 */
  occurrences: PlaceholderOccurrence[]

  /** 依赖的其他占位符 */
  dependencies: string[]

  /** 被依赖的占位符 */
  dependents: string[]
}

/**
 * 占位符出现位置信息
 */
export interface PlaceholderOccurrence {
  /** 配置对象路径（如: "config.url", "config.headers[0].value"） */
  path: string

  /** 原始值（包含占位符的字符串） */
  originalValue: string

  /** 在该值中的占位符位置 */
  position: {
    start: number
    end: number
  }
}

// ==================== 组件映射系统 ====================

/**
 * 组件映射配置接口
 * 用于Card2.1组件属性与HTTP参数的映射
 */
export interface ComponentMappingConfig {
  /** 映射配置唯一标识 */
  id: string

  /** 映射名称 */
  name: string

  /** 源组件信息 */
  sourceComponent: ComponentMappingSource

  /** 目标HTTP配置信息 */
  targetHttpConfig: HttpConfigMappingTarget

  /** 映射关系列表 */
  mappings: PropertyToParameterMapping[]

  /** 映射状态 */
  status: 'active' | 'inactive' | 'error'

  /** 映射创建时间 */
  createdAt: number

  /** 最后更新时间 */
  lastUpdated: number

  /** 映射描述 */
  description?: string
}

/**
 * 组件映射源信息
 */
export interface ComponentMappingSource {
  /** 组件/卡片ID */
  componentId: string

  /** 组件类型 */
  componentType: string

  /** 组件显示名称 */
  displayName?: string

  /** 可映射的属性列表 */
  availableProperties: ComponentProperty[]
}

/**
 * HTTP配置映射目标信息
 */
export interface HttpConfigMappingTarget {
  /** HTTP配置标识 */
  configId: string

  /** HTTP配置名称 */
  configName?: string

  /** 可映射的参数列表 */
  availableParameters: HttpMappableParameter[]
}

/**
 * 组件属性定义
 */
export interface ComponentProperty {
  /** 属性名称 */
  name: string

  /** 属性显示名称 */
  displayName: string

  /** 属性数据类型 */
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array'

  /** 属性当前值 */
  currentValue?: any

  /** 属性描述 */
  description?: string

  /** 是否为只读属性 */
  readonly?: boolean

  /** 属性路径（用于嵌套对象） */
  path?: string
}

/**
 * HTTP可映射参数信息
 */
export interface HttpMappableParameter {
  /** 参数标识（对应variableName或占位符名称） */
  parameterId: string

  /** 参数显示名称 */
  displayName: string

  /** 参数类型（header/param/url/body） */
  parameterType: 'header' | 'param' | 'url' | 'body'

  /** 数据类型 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 参数描述 */
  description?: string

  /** 是否为必填参数 */
  required?: boolean

  /** 参数在配置中的路径 */
  configPath: string
}

/**
 * 属性到参数的映射关系
 */
export interface PropertyToParameterMapping {
  /** 映射关系唯一标识 */
  id: string

  /** 源组件属性 */
  sourceProperty: ComponentProperty

  /** 目标HTTP参数 */
  targetParameter: HttpMappableParameter

  /** 映射类型 */
  mappingType: 'direct' | 'transform' | 'conditional'

  /** 数据转换配置（mappingType为transform时使用） */
  transformation?: DataTransformationConfig

  /** 条件映射配置（mappingType为conditional时使用） */
  condition?: ConditionalMappingConfig

  /** 映射状态 */
  status: 'active' | 'inactive' | 'error'

  /** 最后同步时间 */
  lastSyncTime?: number
}

/**
 * 数据转换配置
 */
export interface DataTransformationConfig {
  /** 转换类型 */
  type: 'format' | 'calculate' | 'lookup' | 'script'

  /** 转换参数 */
  parameters: Record<string, any>

  /** 转换脚本（type为script时使用） */
  script?: string
}

/**
 * 条件映射配置
 */
export interface ConditionalMappingConfig {
  /** 条件表达式 */
  condition: string

  /** 条件成立时的值 */
  trueValue: any

  /** 条件不成立时的值 */
  falseValue: any

  /** 条件评估上下文 */
  context?: Record<string, any>
}

// ==================== 增强版配置系统 ====================

/**
 * EnhancedHttpConfig接口
 * 用于UnifiedDataConfig的HTTP配置部分，基于SUBTASK-008设计
 */
export interface EnhancedHttpConfig {
  /** 请求URL（支持{{占位符}}） */
  url: string

  /** HTTP请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 请求超时时间（毫秒，默认5000） */
  timeout?: number

  /** 请求头配置数组 */
  headers?: HttpHeader[]

  /** URL参数配置数组 */
  params?: HttpParam[]

  /** 请求体配置 */
  body?: HttpBody

  /** 请求前脚本（调整配置） */
  preRequestScript?: string

  /** 响应后脚本（修改响应结果） */
  postResponseScript?: string

  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number
    /** 重试间隔（毫秒） */
    retryDelay: number
  }

  /** 组件映射配置 */
  componentMappings?: ComponentMappingConfig[]
}

/**
 * ConfigurationManager扩展接口
 * 支持占位符解析和模板管理
 */
export interface EnhancedConfigurationManager {
  /**
   * 分析配置中的占位符依赖
   * @param config 配置对象
   * @returns 依赖分析结果
   */
  analyzePlaceholderDependencies(config: any): PlaceholderDependencyAnalysis

  /**
   * 提取配置中的所有占位符
   * @param config 配置对象
   * @returns 占位符名称列表
   */
  extractPlaceholders(config: any): string[]

  /**
   * 替换配置中的占位符值
   * @param config 配置对象
   * @param placeholderValues 占位符值映射
   * @returns 替换后的配置
   */
  replacePlaceholders(config: any, placeholderValues: Map<string, any>): any

  /**
   * 验证占位符配置
   * @param config 配置对象
   * @param placeholderConfigs 占位符配置映射
   * @returns 验证结果
   */
  validatePlaceholders(config: any, placeholderConfigs: Map<string, PlaceholderConfig>): PlaceholderValidationResult

  /**
   * 检测循环依赖
   * @param dependencies 依赖关系映射
   * @returns 循环依赖检测结果
   */
  detectCircularDependencies(dependencies: Map<string, string[]>): CircularDependencyResult
}

/**
 * 占位符验证结果
 */
export interface PlaceholderValidationResult {
  /** 验证是否通过 */
  isValid: boolean

  /** 验证错误列表 */
  errors: PlaceholderValidationError[]

  /** 验证警告列表 */
  warnings: PlaceholderValidationWarning[]

  /** 缺失的必填占位符 */
  missingRequired: string[]

  /** 未定义的占位符 */
  undefined: string[]
}

/**
 * 占位符验证错误
 */
export interface PlaceholderValidationError {
  /** 占位符名称 */
  placeholder: string

  /** 错误类型 */
  type: 'missing' | 'invalid_type' | 'validation_failed' | 'circular_dependency'

  /** 错误信息 */
  message: string

  /** 错误位置路径 */
  path?: string
}

/**
 * 占位符验证警告
 */
export interface PlaceholderValidationWarning {
  /** 占位符名称 */
  placeholder: string

  /** 警告类型 */
  type: 'unused' | 'deprecated' | 'performance'

  /** 警告信息 */
  message: string
}

/**
 * 循环依赖检测结果
 */
export interface CircularDependencyResult {
  /** 是否存在循环依赖 */
  hasCircularDependency: boolean

  /** 循环依赖路径列表 */
  circularPaths: string[][]

  /** 涉及循环依赖的占位符 */
  affectedPlaceholders: string[]
}

/**
 * 增强版数据源配置
 * 继承现有配置，增加版本管理和动态参数支持
 */
export interface EnhancedDataSourceConfiguration extends LegacyDataSourceConfiguration {
  /** 配置版本标识 */
  version: string

  /** 动态参数定义（预留） */
  dynamicParams?: DynamicParam[]

  /** 增强功能开关 */
  enhancedFeatures?: EnhancedFeatureFlags

  /** 配置元数据 */
  metadata?: ConfigurationMetadata

  /** 占位符配置映射 */
  placeholderConfigs?: Map<string, PlaceholderConfig>

  /** 组件映射配置列表 */
  componentMappings?: ComponentMappingConfig[]
}

/**
 * 增强功能开关
 */
export interface EnhancedFeatureFlags {
  /** 启用HTTP数组格式 */
  httpArrayFormat: boolean

  /** 启用动态参数支持 */
  dynamicParameterSupport: boolean

  /** 启用安全脚本执行 */
  secureScriptExecution: boolean

  /** 启用配置验证 */
  configurationValidation: boolean

  /** 启用性能监控 */
  performanceMonitoring: boolean
}

/**
 * 配置元数据
 */
export interface ConfigurationMetadata {
  /** 配置名称 */
  name?: string

  /** 配置描述 */
  description?: string

  /** 配置创建者 */
  author?: string

  /** 配置版本历史 */
  versionHistory?: ConfigurationVersion[]

  /** 配置标签 */
  tags?: string[]
}

/**
 * 配置版本信息
 */
export interface ConfigurationVersion {
  /** 版本号 */
  version: string

  /** 变更时间 */
  timestamp: number

  /** 变更说明 */
  changelog: string

  /** 变更作者 */
  author?: string
}

// ==================== 配置适配器系统 ====================

/**
 * 配置版本适配器
 * 处理新旧配置格式的自动转换
 */
export interface ConfigurationAdapter {
  /**
   * 检测配置版本
   * @param config 配置对象
   * @returns 版本标识
   */
  detectVersion(config: any): 'v1.0' | 'v2.0'

  /**
   * 适配配置到指定版本
   * @param config 源配置
   * @param targetVersion 目标版本
   * @returns 适配后的配置
   */
  adaptToVersion(config: any, targetVersion: 'v1.0' | 'v2.0'): any

  /**
   * v1升级到v2（无损升级）
   * @param v1Config v1格式配置
   * @returns v2格式配置
   */
  upgradeV1ToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration

  /**
   * v2降级到v1（功能裁剪）
   * @param v2Config v2格式配置
   * @returns v1格式配置
   */
  downgradeV2ToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration
}

// ==================== 类型工具和辅助函数 ====================

/**
 * 数据类型转换器
 * 用于HttpHeader和HttpParam的值转换
 */
export class DataTypeConverter {
  /**
   * 将字符串值转换为指定类型
   * @param value 原始字符串值
   * @param dataType 目标数据类型
   * @returns 转换后的值
   */
  static convertValue(value: string, dataType: 'string' | 'number' | 'boolean' | 'json'): any {
    if (value === null || value === undefined || value === '') {
      return value
    }

    switch (dataType) {
      case 'string':
        return String(value)

      case 'number': {
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error(`无法将值 "${value}" 转换为数字类型`)
        }
        return num
      }

      case 'boolean': {
        const lowerValue = String(value).toLowerCase().trim()
        if (lowerValue === 'true' || lowerValue === '1') {
          return true
        }
        if (lowerValue === 'false' || lowerValue === '0') {
          return false
        }
        throw new Error(`无法将值 "${value}" 转换为布尔类型`)
      }

      case 'json': {
        try {
          return JSON.parse(value)
        } catch (error) {
          throw new Error(`无法将值 "${value}" 转换为JSON类型: ${error.message}`)
        }
      }

      default:
        return value
    }
  }

  /**
   * 验证值是否符合指定类型
   * @param value 要验证的值
   * @param dataType 期望的数据类型
   * @returns 验证结果
   */
  static validateType(value: any, dataType: 'string' | 'number' | 'boolean' | 'json'): boolean {
    switch (dataType) {
      case 'string':
        return typeof value === 'string'

      case 'number':
        return typeof value === 'number' && !isNaN(value)

      case 'boolean':
        return typeof value === 'boolean'

      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
            return true
          }
          // 如果已经是对象，检查是否可序列化
          JSON.stringify(value)
          return true
        } catch {
          return false
        }

      default:
        return false
    }
  }

  /**
   * 获取值的实际数据类型
   * @param value 要检查的值
   * @returns 数据类型字符串
   */
  static getActualType(value: any): 'string' | 'number' | 'boolean' | 'json' | 'unknown' {
    if (typeof value === 'string') {
      return 'string'
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return 'number'
    }
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    if (typeof value === 'object' || Array.isArray(value)) {
      return 'json'
    }
    return 'unknown'
  }
}

/**
 * 占位符工具类
 * 用于处理{{variableName}}占位符
 */
export class PlaceholderUtils {
  /** 占位符正则表达式 */
  private static readonly PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

  /**
   * 提取字符串中的所有占位符
   * @param text 包含占位符的文本
   * @returns 占位符名称数组
   */
  static extractPlaceholders(text: string): string[] {
    if (typeof text !== 'string') {
      return []
    }

    const matches: string[] = []
    let match: RegExpExecArray | null

    // 重置正则表达式状态
    this.PLACEHOLDER_REGEX.lastIndex = 0

    while ((match = this.PLACEHOLDER_REGEX.exec(text)) !== null) {
      const placeholderName = match[1].trim()
      if (placeholderName && !matches.includes(placeholderName)) {
        matches.push(placeholderName)
      }
    }

    return matches
  }

  /**
   * 替换字符串中的占位符
   * @param text 包含占位符的文本
   * @param values 占位符值映射
   * @returns 替换后的文本
   */
  static replacePlaceholders(text: string, values: Map<string, any>): string {
    if (typeof text !== 'string') {
      return text
    }

    return text.replace(this.PLACEHOLDER_REGEX, (match, placeholderName) => {
      const trimmedName = placeholderName.trim()
      if (values.has(trimmedName)) {
        const value = values.get(trimmedName)
        return value !== null && value !== undefined ? String(value) : match
      }
      return match // 保持原占位符如果没有找到值
    })
  }

  /**
   * 验证占位符名称格式
   * @param name 占位符名称
   * @returns 是否为有效名称
   */
  static isValidPlaceholderName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false
    }

    // 占位符名称规则：字母开头，可包含字母、数字、下划线
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/
    return nameRegex.test(name.trim())
  }

  /**
   * 生成HTTP参数的占位符名称
   * @param parameterKey 参数键名
   * @returns 标准化的占位符名称
   */
  static generateHttpPlaceholderName(parameterKey: string): string {
    if (!parameterKey || typeof parameterKey !== 'string') {
      throw new Error('参数键名不能为空')
    }

    // 清理参数键名，只保留字母数字和下划线
    const cleanKey = parameterKey
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_') // 合并连续的下划线
      .replace(/^_+|_+$/g, '') // 移除开头和结尾的下划线

    if (!cleanKey) {
      throw new Error(`无效的参数键名: ${parameterKey}`)
    }

    return `http_${cleanKey}`
  }
}

/**
 * 类型守卫：检查是否为增强版配置
 */
export function isEnhancedConfiguration(config: any): config is EnhancedDataSourceConfiguration {
  return config && typeof config.version === 'string' && config.version.startsWith('2.')
}

/**
 * 类型守卫：检查是否为泛型数据项配置
 */
export function isGenericDataItemConfig(item: any): item is DataItemConfig {
  return item && typeof item.type === 'string' && typeof item.id === 'string' && item.config
}

/**
 * 类型守卫：检查是否为增强版HTTP配置
 */
export function isEnhancedHttpConfig(config: any): config is EnhancedHttpDataItemConfig {
  return config && Array.isArray(config.headers) && Array.isArray(config.params)
}

/**
 * 类型守卫：检查是否为EnhancedHttpConfig（用于UnifiedDataConfig）
 */
export function isUnifiedHttpConfig(config: any): config is EnhancedHttpConfig {
  return (
    config &&
    typeof config.url === 'string' &&
    typeof config.method === 'string' &&
    (config.headers === undefined || Array.isArray(config.headers)) &&
    (config.params === undefined || Array.isArray(config.params))
  )
}

/**
 * 类型守卫：检查是否为有效的HttpHeader
 */
export function isValidHttpHeader(header: any): header is HttpHeader {
  return (
    header &&
    typeof header.key === 'string' &&
    typeof header.value === 'string' &&
    typeof header.enabled === 'boolean' &&
    typeof header.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(header.dataType) &&
    typeof header.variableName === 'string'
  )
}

/**
 * 类型守卫：检查是否为有效的HttpParam
 */
export function isValidHttpParam(param: any): param is HttpParam {
  return (
    param &&
    typeof param.key === 'string' &&
    typeof param.value === 'string' &&
    typeof param.enabled === 'boolean' &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string'
  )
}

/**
 * 类型守卫：检查是否为有效的PlaceholderConfig
 */
export function isValidPlaceholderConfig(config: any): config is PlaceholderConfig {
  return (
    config &&
    typeof config.name === 'string' &&
    config.value !== undefined &&
    ['string', 'number', 'boolean', 'json'].includes(config.dataType) &&
    typeof config.required === 'boolean'
  )
}

/**
 * 类型守卫：检查是否为有效的ComponentMappingConfig
 */
export function isValidComponentMappingConfig(config: any): config is ComponentMappingConfig {
  return (
    config &&
    typeof config.id === 'string' &&
    typeof config.name === 'string' &&
    config.sourceComponent &&
    config.targetHttpConfig &&
    Array.isArray(config.mappings) &&
    ['active', 'inactive', 'error'].includes(config.status)
  )
}

// ==================== 向后兼容性保证 ====================

/**
 * 配置类型版本枚举
 */
export enum ConfigurationVersionEnum {
  V1_0 = 'v1.0',
  V2_0 = 'v2.0'
}

/**
 * 默认的增强功能开关配置
 */
export const DEFAULT_ENHANCED_FEATURES: EnhancedFeatureFlags = {
  httpArrayFormat: true,
  dynamicParameterSupport: true,
  secureScriptExecution: true,
  configurationValidation: true,
  performanceMonitoring: true
}

// ==================== 导出汇总 ====================

export type {
  // 泛型配置类型
  DataItemConfig,
  DataItemMetadata,

  // 具体数据项类型
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  HttpHeader,
  HttpParam,
  HttpBody,

  // 增强HTTP配置（用于UnifiedDataConfig）
  EnhancedHttpConfig,

  // 动态参数系统
  DynamicParam,

  // 占位符系统
  PlaceholderConfig,
  PlaceholderValidationRule,
  PlaceholderDependencyAnalysis,
  PlaceholderDependencyDetail,
  PlaceholderOccurrence,
  PlaceholderValidationResult,
  PlaceholderValidationError,
  PlaceholderValidationWarning,

  // 组件映射系统
  ComponentMappingConfig,
  ComponentMappingSource,
  HttpConfigMappingTarget,
  ComponentProperty,
  HttpMappableParameter,
  PropertyToParameterMapping,
  DataTransformationConfig,
  ConditionalMappingConfig,

  // ConfigurationManager扩展
  EnhancedConfigurationManager,
  CircularDependencyResult,

  // 增强配置系统
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,

  // 适配器系统
  ConfigurationAdapter
}
