/**
 * 统一类型导出入口
 * 整合data-architecture系统中所有类型定义，提供统一的导入入口
 * 解决类型重复定义和命名不统一的问题
 */

// ==================== 核心基础类型 ====================

/**
 * 参数值模式枚举 - 统一所有参数配置的编辑模式
 */
export type ValueMode = 'manual' | 'dropdown' | 'property' | 'component'

/**
 * 数据类型枚举 - 系统中通用的数据类型定义
 */
export type DataType = 'string' | 'number' | 'boolean' | 'json'

/**
 * 参数类型枚举 - HTTP参数的分类
 */
export type ParamType = 'path' | 'query' | 'header'

/**
 * 地址类型枚举 - HTTP请求的地址来源类型
 */
export type AddressType = 'internal' | 'external'

/**
 * 数据源类型枚举 - 支持的数据源类型
 */
export type DataSourceType = 'static' | 'api' | 'websocket' | 'mqtt' | 'database' | 'script'

/**
 * 触发器类型枚举
 */
export type TriggerType = 'timer' | 'websocket' | 'event' | 'manual'

/**
 * 字段类型枚举 - 支持Card2.1的扩展类型系统
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'any' | 'object' | 'array'

/**
 * 组件类型枚举
 */
export type ComponentType = 'visual-editor' | 'card2.1' | 'standard'

// ==================== 基础接口重导出 ====================

// 从parameter-editor.ts导出增强参数类型
export type { EnhancedParameter } from './parameter-editor'

// ==================== HTTP配置核心类型 ====================

/**
 * HTTP参数统一接口（标准化版本）
 * 整合了enhanced-types.ts和http-config.ts中的重复定义
 */
export interface HttpParameter {
  /** 参数键名 */
  key: string

  /** 参数值 - 示例值，类型与dataType匹配 */
  value: string | number | boolean

  /** 默认值 - 当value为空或绑定失败时使用的回退值 */
  defaultValue?: string | number | boolean

  /** 是否启用此参数 */
  enabled: boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: DataType

  /** 动态时自动生成的变量名 */
  variableName: string

  /** 参数说明，建议必填 */
  description: string

  /** 参数类型：路径参数、查询参数、请求头参数 */
  paramType: ParamType

  /** 参数值模式：手动输入、下拉选择、属性绑定等 */
  valueMode?: ValueMode

  /** 选中的模板ID */
  selectedTemplate?: string
}

/**
 * HTTP请求头配置（为了向后兼容保留）
 * @deprecated 建议使用统一的HttpParameter with paramType: 'header'
 */
export interface HttpHeader extends HttpParameter {
  paramType: 'header'
}

/**
 * HTTP查询参数配置（为了向后兼容保留）
 * @deprecated 建议使用统一的HttpParameter with paramType: 'query'
 */
export interface HttpParam extends HttpParameter {
  paramType: 'query'
}

/**
 * HTTP路径参数配置（为了向后兼容保留）
 * @deprecated 建议使用统一的HttpParameter with paramType: 'path'
 */
export interface HttpPathParam extends HttpParameter {
  paramType: 'path'
  /** 路径参数名（不带大括号），如 'device_id' */
  key: string
  /** 在URL中的占位符格式，如 '{device_id}' */
  placeholder: string
}

/**
 * 路径参数简化配置
 * 只支持单个路径参数，直接拼接到URL后
 */
export interface PathParameter {
  /** 参数值 - 示例值，类型与dataType匹配 */
  value: string | number | boolean

  /** 默认值 - 当value为空时使用的回退值 */
  defaultValue?: string | number | boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: DataType

  /** 动态时自动生成的变量名 */
  variableName: string

  /** 参数说明 */
  description: string

  /** 参数值模式：手动输入、下拉选择、属性绑定等 */
  valueMode?: ValueMode

  /** 选中的模板ID */
  selectedTemplate?: string

  /** 参数键名（用于内部标识） */
  key?: string

  /** 是否启用（用于向后兼容） */
  enabled?: boolean
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

/**
 * HTTP配置接口（统一标准版本）
 * 整合了多个文件中的HTTP配置定义
 */
export interface HttpConfig {
  /** 基础请求URL（路径参数会拼接到此URL后） */
  url: string

  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 超时时间（毫秒） */
  timeout: number

  /** 地址类型：内部地址还是外部地址 */
  addressType?: AddressType

  /** 选中的内部地址值（当addressType为internal时使用） */
  selectedInternalAddress?: string

  /** 是否启用传参（用于内部地址的路径参数配置） */
  enableParams?: boolean

  /** 路径参数配置数组（新格式，支持多个参数） */
  pathParams?: EnhancedParameter[]

  /** 路径参数（可选，单个参数直接拼接到URL后） */
  pathParameter?: PathParameter

  /** 查询参数配置 */
  params: HttpParam[]

  /** 请求头配置 */
  headers: HttpHeader[]

  /** 请求体（可选） */
  body?: string | HttpBody

  /** 请求前处理脚本（可选） */
  preRequestScript?: string

  /** 响应后处理脚本（可选） */
  postResponseScript?: string

  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number
    /** 重试间隔（毫秒） */
    retryDelay: number
  }

  // ========== 向后兼容字段（已弃用） ==========
  /** @deprecated 使用简化的 pathParameter 字段替代 */
  pathParams_deprecated?: HttpPathParam[]
  /** @deprecated 使用新的统一 parameters 字段替代 */
  parameters?: HttpParameter[]
}

// ==================== 数据源系统类型 ====================

/**
 * 组件数据需求声明 - 与Card2.1完全兼容
 * 从simple-types.ts重新导出并标准化
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 组件名称 */
  componentName: string
  /** 静态参数需求声明 - 与Card2.1 StaticParamRequirement对应 */
  staticParams?: StaticParamRequirement[]
  /** 数据源需求声明 - 与Card2.1 DataSourceRequirement对应 */
  dataSources: DataSourceRequirement[]
}

/**
 * 静态参数需求定义 - 与Card2.1完全一致
 */
export interface StaticParamRequirement {
  /** 参数唯一标识 */
  key: string
  /** 参数名称 */
  name: string
  /** 参数类型 */
  type: FieldType
  /** 参数描述 */
  description: string
  /** 默认值 */
  defaultValue?: any
  /** 是否必填 */
  required?: boolean
  /** 参数验证规则 */
  validation?: ValidationRule
  /** UI 渲染提示 */
  ui?: UIConfig
}

/**
 * 数据源需求声明 - 与Card2.1完全兼容的版本
 */
export interface DataSourceRequirement {
  /** 数据源唯一标识 - 与Card2.1 key对应 */
  key: string
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description: string
  /** 支持的数据源类型 - 与Card2.1对齐 */
  supportedTypes: DataSourceType[]
  /** 字段映射规则 - 与Card2.1 fieldMappings兼容 */
  fieldMappings: Record<string, FieldMapping>
  /** 是否必填 */
  required?: boolean

  // ==== 向下兼容字段 - 支持原有简化格式 ====
  /** 数据结构类型 - 向下兼容 */
  structureType?: 'object' | 'array'
  /** 字段需求 - 向下兼容 */
  fields?: FieldRequirement[]
  /** 数据源ID - 向下兼容 */
  id?: string
}

/**
 * 字段映射规则
 */
export interface FieldMapping {
  /** 目标字段名 */
  targetField: string
  /** 字段类型 */
  type: 'value' | 'object' | 'array'
  /** 是否必填 */
  required: boolean
  /** 默认值 */
  defaultValue?: any
  /** 数据转换函数 */
  transform?: string
}

/**
 * 字段需求声明 - 与Card2.1兼容的扩展版本
 */
export interface FieldRequirement {
  /** 字段名 */
  name: string
  /** 字段类型 - 扩展支持Card2.1的类型系统 */
  type: FieldType
  /** 值类型 - 用于进一步细分类型 */
  valueType?: 'number' | 'string' | 'boolean' | 'any'
  /** 是否必填 */
  required: boolean
  /** 字段描述 */
  description: string
  /** 示例值 */
  example?: any
  /** 默认值 - 与Card2.1 StaticParamRequirement兼容 */
  defaultValue?: any
  /** 嵌套结构定义 - 支持复杂对象和数组 */
  structure?: DataSourceRequirement
  /** 验证规则 - 与Card2.1兼容的验证配置 */
  validation?: ValidationRule
  /** UI渲染提示 - 支持Card2.1的UI配置 */
  ui?: UIConfig
}

/**
 * 验证规则统一接口
 */
export interface ValidationRule {
  /** 最小值/最小长度 */
  min?: number
  /** 最大值/最大长度 */
  max?: number
  /** 正则表达式 */
  pattern?: string
  /** 枚举选项 */
  options?: Array<{ label: string; value: any }>
}

/**
 * UI配置统一接口
 */
export interface UIConfig {
  /** UI组件类型 */
  component?: 'input' | 'select' | 'number' | 'switch' | 'textarea' | 'color' | 'slider'
  /** 占位符文本 */
  placeholder?: string
  /** 标签文本 */
  label?: string
  /** 分组名称 */
  group?: string
}

// ==================== 数据源配置类型 ====================

/**
 * 简化的数据源配置 - 输出给外部系统使用
 */
export interface SimpleDataSourceConfig {
  /** 配置ID */
  id: string
  /** 组件ID */
  componentId: string
  /** 数据源定义列表 */
  dataSources: DataSourceDefinition[]
  /** 触发器配置 - 复用Card2.1的优秀设计 */
  triggers: TriggerConfig[]
  /** 是否启用 */
  enabled: boolean
}

/**
 * 数据源定义
 */
export interface DataSourceDefinition {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源配置 */
  config: any
  /** 字段映射 - 学习自visual-editor的映射机制 */
  fieldMapping?: { [targetField: string]: string }
}

/**
 * 触发器配置 - 复用Card2.1的触发器系统
 */
export interface TriggerConfig {
  /** 触发器类型 */
  type: TriggerType
  /** 触发器配置 */
  config: TriggerConfigData
}

/**
 * 触发器配置数据
 */
export interface TriggerConfigData {
  // 定时器配置
  interval?: number
  immediate?: boolean

  // WebSocket配置
  url?: string
  protocols?: string[]

  // 事件配置
  eventName?: string
  target?: EventTarget
}

// ==================== 增强版类型（从enhanced-types.ts选择性导出） ====================

// 重新导出增强版配置的核心类型
export type {
  // 组件映射系统
  ComponentMappingConfig,
  ComponentMappingSource,
  HttpConfigMappingTarget,
  ComponentProperty,
  HttpMappableParameter,
  PropertyToParameterMapping,
  DataTransformationConfig,
  ConditionalMappingConfig,

  // 占位符系统
  PlaceholderConfig,
  PlaceholderValidationRule,
  PlaceholderDependencyAnalysis,
  PlaceholderDependencyDetail,
  PlaceholderOccurrence,
  PlaceholderValidationResult,
  PlaceholderValidationError,
  PlaceholderValidationWarning,

  // 增强配置系统
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,
  ConfigurationVersion,

  // 配置管理器扩展
  EnhancedConfigurationManager,
  CircularDependencyResult
} from './enhanced-types'

// ==================== 执行结果和数据类型 ====================

/**
 * 组件最终接收的数据格式
 */
export interface ComponentData {
  [dataSourceId: string]: {
    /** 数据源类型 */
    type: string
    /** 解析后的数据 */
    data: any
    /** 最后更新时间 */
    lastUpdated?: number
    /** 元数据 */
    metadata?: any
  }
}

/**
 * 标准组件Props - 新组件使用的接口
 */
export interface StandardComponentProps {
  /** 数据源配置 */
  dataSourceConfig?: ComponentData
}

/**
 * 数据执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: ComponentData
  /** 错误信息 */
  error?: string
  /** 执行时间（毫秒） */
  executionTime: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 配置验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

/**
 * 字段映射预览结果
 */
export interface MappingPreviewResult {
  /** 目标字段 */
  targetField: string
  /** 源路径 */
  sourcePath: string
  /** 映射后的值 */
  mappedValue: any
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}

// ==================== 兼容性类型 ====================

/**
 * Visual Editor 兼容格式
 */
export interface VisualEditorCompatibleProps {
  widgetConfiguration?: {
    dataSource: {
      config: {
        dataSourceBindings: {
          [dataSourceId: string]: {
            rawData: string
          }
        }
      }
    }
  }
}

/**
 * Card2.1 兼容格式
 */
export interface Card21CompatibleProps {
  rawDataSources?: {
    dataSourceBindings: {
      [dataSourceId: string]: {
        rawData: string
      }
    }
  }
}

// ==================== 工具类型和类型守卫 ====================

/**
 * 类型守卫：检查是否为有效的HttpParameter
 */
export function isValidHttpParameter(param: any): param is HttpParameter {
  return (
    param &&
    typeof param.key === 'string' &&
    param.value !== undefined &&
    typeof param.enabled === 'boolean' &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string' &&
    ['path', 'query', 'header'].includes(param.paramType)
  )
}

/**
 * 类型守卫：检查是否为有效的PathParameter
 */
export function isValidPathParameter(param: any): param is PathParameter {
  return (
    param &&
    param.value !== undefined &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string'
  )
}

/**
 * 类型守卫：检查是否为有效的HttpConfig
 */
export function isValidHttpConfig(config: any): config is HttpConfig {
  return (
    config &&
    typeof config.url === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method) &&
    typeof config.timeout === 'number' &&
    Array.isArray(config.params) &&
    Array.isArray(config.headers)
  )
}

/**
 * 类型守卫：检查是否为有效的ComponentDataRequirement
 */
export function isValidComponentDataRequirement(requirement: any): requirement is ComponentDataRequirement {
  return (
    requirement &&
    typeof requirement.componentId === 'string' &&
    typeof requirement.componentName === 'string' &&
    Array.isArray(requirement.dataSources)
  )
}

// ==================== 常量定义 ====================

/**
 * 系统常量
 */
export const DATA_ARCHITECTURE_CONSTANTS = {
  /** 最大数据源数量 */
  MAX_DATA_SOURCES: 5,

  /** 默认触发器间隔 */
  DEFAULT_TRIGGER_INTERVAL: 30000,

  /** 默认HTTP超时时间 */
  DEFAULT_HTTP_TIMEOUT: 10000,

  /** 配置版本 */
  CONFIG_VERSION: '2.1.0',

  /** 支持的数据类型 */
  SUPPORTED_DATA_TYPES: ['string', 'number', 'boolean', 'json'] as const,

  /** 支持的参数类型 */
  SUPPORTED_PARAM_TYPES: ['path', 'query', 'header'] as const,

  /** 支持的值模式 */
  SUPPORTED_VALUE_MODES: ['manual', 'dropdown', 'property', 'component'] as const,

  /** 支持的数据源类型 */
  SUPPORTED_DATA_SOURCE_TYPES: ['static', 'api', 'websocket', 'mqtt', 'database', 'script'] as const
} as const

/**
 * 字段类型映射表 - Card2.1与数据源系统之间的类型映射
 * 从simple-types.ts重新导出
 */
export const FIELD_TYPE_MAPPING = {
  // Card2.1 -> 数据源系统
  card2ToDataSource: {
    value: 'any' as FieldType,
    object: 'object' as FieldType,
    array: 'array' as FieldType,
    string: 'string' as FieldType,
    number: 'number' as FieldType,
    boolean: 'boolean' as FieldType
  },
  // 数据源系统 -> Card2.1
  dataSourceToCard2: {
    string: 'value',
    number: 'value',
    boolean: 'value',
    any: 'value',
    object: 'object',
    array: 'array'
  }
} as const

// ==================== 工具函数重新导出 ====================

// 从http-config.ts重新导出实用工具函数
export {
  convertValue,
  createDefaultPathParameter,
  extractPathParamsFromUrl,
  replaceUrlPathParams,
  generateVariableName
} from './http-config'

// 从enhanced-types.ts重新导出工具类
export {
  DataTypeConverter,
  PlaceholderUtils,
  isEnhancedConfiguration,
  isGenericDataItemConfig,
  isEnhancedHttpConfig,
  isUnifiedHttpConfig,
  isValidHttpHeader,
  isValidHttpParam,
  isValidPlaceholderConfig,
  isValidComponentMappingConfig,
  DEFAULT_ENHANCED_FEATURES,
  ConfigurationVersionEnum
} from './enhanced-types'

// ==================== 默认配置导出 ====================

/**
 * 默认HTTP配置
 */
export const DEFAULT_HTTP_CONFIG: Partial<HttpConfig> = {
  method: 'GET',
  timeout: DATA_ARCHITECTURE_CONSTANTS.DEFAULT_HTTP_TIMEOUT,
  addressType: 'external',
  params: [],
  headers: [],
  enableParams: false
}

/**
 * 默认触发器配置
 */
export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  type: 'timer',
  config: {
    interval: DATA_ARCHITECTURE_CONSTANTS.DEFAULT_TRIGGER_INTERVAL,
    immediate: true
  }
}
