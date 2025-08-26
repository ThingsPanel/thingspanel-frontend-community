/**
 * 动态参数系统类型定义
 * 用于HTTP请求中的动态参数管理和处理
 */

/**
 * 动态参数来源类型
 * - context: 从执行上下文中获取（如卡片传递的设备ID）
 * - api: 通过API接口获取（如用户列表、配置项等）
 * - computed: 通过计算函数得出（如时间范围、派生值）
 * - static: 静态值（编译时确定）
 */
export type DynamicParamSource = 'context' | 'api' | 'computed' | 'static'

/**
 * @file 动态参数类型定义
 * @description 该文件定义了在数据源配置中使用的动态参数结构。
 * 新的设计理念是：参数的来源是隐式的，通过在URL、请求头、请求体等处使用 `${paramName}` 语法自动提取。
 * 用户只需为这些提取出的参数提供描述和测试用的示例值即可。
 */

/**
 * 动态参数类型
 * @description 定义了动态参数的基本数据类型。
 */
export type DynamicParamType = 'string' | 'number' | 'boolean' | 'object' | 'array'

/**
 * 动态参数定义
 * @description 描述一个从请求配置中自动提取出的动态参数。
 * 这个结构用于在UI上配置参数的元数据，如描述和测试值。
 */
export interface DynamicParam {
  /**
   * 参数名称
   * @description 从配置中通过 `${name}` 语法自动提取，是参数的唯一标识。
   */
  name: string

  /**
   * 参数类型
   * @description 指导如何在运行时处理该参数，例如进行类型转换。
   * @default 'string'
   */
  type?: DynamicParamType

  /**
   * 必需参数
   * @description 标记此参数在实际执行时是否必须提供值。
   * @default false
   */
  required?: boolean

  /**
   * 示例值
   * @description 用于在配置界面进行“解析并运行”测试时，替换占位符的值。
   * 这个值不会被存储用于生产环境，仅为调试和开发时提供便利。
   */
  exampleValue?: any

  /**
   * 参数描述
   * @description 对该参数的详细说明，解释其用途、来源或格式要求。
   */
  description?: string
}

/**
 * 参数上下文接口
 * @description 包含执行时可用的所有参数值，键为参数名，值为参数值。
 * 在大屏或报表等实际应用场景中，由外部环境提供。
 */
export interface ParamContext {
  [key: string]: any
}

/**
 * API参数配置
 * 当参数来源为'api'时使用
 */
export interface ApiParamConfig {
  /** API请求URL */
  url: string
  /** HTTP方法 */
  method?: 'GET' | 'POST'
  /** 请求参数 */
  params?: Record<string, any>
  /** 响应数据路径（如 'data.list' 表示取 response.data.list） */
  dataPath?: string
  /** 缓存时间（毫秒），0表示不缓存 */
  cacheTime?: number
}

/**
 * 计算参数配置
 * 当参数来源为'computed'时使用
 */
export interface ComputedParamConfig {
  /** 计算函数代码（JavaScript字符串） */
  computeScript: string
  /** 依赖的其他参数名称列表 */
  dependencies?: string[]
  /** 是否允许异步计算 */
  async?: boolean
}

/**
 * 动态参数定义
 * 描述一个动态参数的完整配置
 */
export interface DynamicParam {
  /** 参数名称（支持嵌套路径如 'user.id', 'timeRange.start'） */
  name: string

  /** 参数来源类型 */
  source: DynamicParamSource

  /** 参数数据类型 */
  type?: DynamicParamType

  /** 是否必需参数 */
  required: boolean

  /** 默认值 */
  defaultValue?: any

  /** 参数描述 */
  description?: string

  /** API配置（source为'api'时使用） */
  apiConfig?: ApiParamConfig

  /** 计算配置（source为'computed'时使用） */
  computedConfig?: ComputedParamConfig

  /** 静态值（source为'static'时使用） */
  staticValue?: any

  /** 参数验证规则 */
  validation?: {
    /** 最小值/最小长度 */
    min?: number
    /** 最大值/最大长度 */
    max?: number
    /** 正则表达式验证 */
    pattern?: string
    /** 枚举值限制 */
    enum?: any[]
  }
}

/**
 * 参数上下文接口
 * 包含执行时可用的所有参数值
 */
export interface ParamContext {
  /** 基础上下文数据（通常由卡片或组件提供） */
  [key: string]: any

  /** 特殊的系统参数 */
  $system?: {
    /** 当前时间戳 */
    timestamp: number
    /** 当前用户ID */
    userId?: string
    /** 当前租户ID */
    tenantId?: string
    /** 当前设备ID */
    deviceId?: string
    /** 时间范围 */
    timeRange?: {
      start: string
      end: string
    }
  }
}

/**
 * 参数解析结果
 */
export interface ParamResolutionResult {
  /** 是否解析成功 */
  success: boolean

  /** 解析后的参数值映射 */
  resolvedParams: Record<string, any>

  /** 解析过程中的错误 */
  errors: Array<{
    paramName: string
    error: string
  }>

  /** 解析过程中的警告 */
  warnings: Array<{
    paramName: string
    warning: string
  }>

  /** 解析耗时（毫秒） */
  executionTime: number
}

/**
 * 模板解析结果
 */
export interface TemplateResolutionResult {
  /** 是否解析成功 */
  success: boolean

  /** 解析后的字符串 */
  result: string

  /** 使用的参数列表 */
  usedParams: string[]

  /** 未找到的参数列表 */
  missingParams: string[]

  /** 解析错误 */
  error?: string
}

/**
 * 动态参数管理器配置
 */
export interface DynamicParamManagerConfig {
  /** 参数缓存时间（毫秒） */
  defaultCacheTime?: number

  /** 最大并发API请求数 */
  maxConcurrentRequests?: number

  /** API请求超时时间（毫秒） */
  apiTimeout?: number

  /** 计算脚本执行超时时间（毫秒） */
  computeTimeout?: number

  /** 是否启用调试日志 */
  enableDebugLog?: boolean
}

/**
 * 参数缓存项
 */
export interface ParamCacheItem {
  /** 缓存的值 */
  value: any

  /** 缓存时间戳 */
  timestamp: number

  /** 缓存过期时间戳 */
  expireTime: number

  /** 参数配置的哈希值（用于检测配置变更） */
  configHash: string
}

/**
 * 批量参数解析请求
 */
export interface BatchParamRequest {
  /** 要解析的参数定义列表 */
  params: DynamicParam[]

  /** 参数上下文 */
  context: ParamContext

  /** 请求ID（用于跟踪） */
  requestId?: string
}

/**
 * 批量参数解析结果
 */
export interface BatchParamResult {
  /** 请求ID */
  requestId?: string

  /** 整体解析结果 */
  success: boolean

  /** 各个参数的解析结果 */
  results: Record<
    string,
    {
      success: boolean
      value?: any
      error?: string
    }
  >

  /** 总耗时 */
  totalTime: number
}

/**
 * 动态参数常量定义
 */
export const DYNAMIC_PARAM_CONSTANTS = {
  /** 默认缓存时间（5分钟） */
  DEFAULT_CACHE_TIME: 5 * 60 * 1000,

  /** API请求最大超时时间 */
  MAX_API_TIMEOUT: 30 * 1000,

  /** 计算脚本最大执行时间 */
  MAX_COMPUTE_TIMEOUT: 5 * 1000,

  /** 最大并发请求数 */
  MAX_CONCURRENT_REQUESTS: 10,

  /** 参数名称正则表达式 */
  PARAM_NAME_REGEX: /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/,

  /** 模板参数正则表达式 */
  TEMPLATE_PARAM_REGEX: /\$\{([^}]+)\}/g,

  /** 支持的数据类型 */
  SUPPORTED_TYPES: ['string', 'number', 'boolean', 'object', 'array'] as DynamicParamType[]
} as const

/**
 * 动态参数工具函数类型
 */
export interface DynamicParamUtils {
  /** 验证参数名称格式 */
  validateParamName(name: string): boolean

  /** 从路径获取嵌套对象值 */
  getValueByPath(obj: any, path: string): any

  /** 设置嵌套对象值 */
  setValueByPath(obj: any, path: string, value: any): void

  /** 解析模板字符串中的参数 */
  extractTemplateParams(template: string): string[]

  /** 计算配置哈希值 */
  computeConfigHash(config: DynamicParam): string

  /** 验证参数值类型 */
  validateParamValue(value: any, type: DynamicParamType): boolean
}
