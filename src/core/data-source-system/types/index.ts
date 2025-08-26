/**
 * 数据源系统统一类型定义
 * 整合所有相关类型，建立完整的类型体系
 *
 * @version 2.0.0
 * @description 统一的数据源系统类型定义，解决类型不一致问题
 */

// ========== 重新导出子模块类型 ==========
export * from './simple-types'
export * from './dynamic-params'
export * from './execution'
export * from './http-config'

// 重新导出配置表单相关类型
export * from '../components/data-source-config-form/types'

// ========== 核心数据源类型 (统一定义) ==========

/**
 * 数据源基础接口 - 系统核心类型
 */
export interface DataSource {
  /** 数据源唯一标识 */
  key: string
  /** 数据源名称 */
  name: string
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源描述 */
  description?: string
  /** 示例数据 */
  example?: any
  /** 字段映射配置 */
  fieldMappings?: Record<string, FieldMapping>
  /** 需要映射的字段列表 */
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
  /** 数据源元数据 */
  metadata?: DataSourceMetadata
}

/**
 * 字段映射配置
 */
export interface FieldMapping {
  /** 目标字段名 */
  targetField: string
  /** 源字段路径 */
  sourcePath: string
  /** 字段类型 */
  type: FieldType
  /** 是否必填 */
  required: boolean
  /** 默认值 */
  defaultValue?: any
  /** 数据转换函数（JavaScript表达式） */
  transform?: string
}

/**
 * 数据源元数据
 */
export interface DataSourceMetadata {
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 创建者 */
  createdBy?: string
  /** 版本号 */
  version: string
  /** 标签 */
  tags?: string[]
  /** 分组 */
  group?: string
}

/**
 * 数据源配置基础接口
 */
export interface DataSourceConfig {
  [key: string]: any
}

// ========== 组件配置类型 (解决类型不一致问题) ==========

/**
 * 组件数据源配置 - v-model 绑定的标准格式
 * 统一DataSourceConfigForm的modelValue类型
 */
export interface ComponentDataSourceConfig {
  /** 当前激活的数据源key */
  activeDataSourceKey?: string
  /** 数据源绑定配置映射 */
  dataSourceBindings?: Record<string, DataSourceBinding>
  /** 组件ID */
  componentId?: string
  /** 组件类型 */
  componentType?: string
  /** 其他扩展字段 */
  [key: string]: any
}

/**
 * 数据源绑定配置
 */
export interface DataSourceBinding {
  /** 数据源类型 */
  type: DataSourceType
  /** 具体配置数据 */
  config: DataSourceConfig
  /** 是否启用 */
  enabled?: boolean
  /** 最后更新时间 */
  lastUpdated?: number
}

// ========== 统一的HTTP配置类型 (解决HttpConfig vs HttpConfigData问题) ==========

/**
 * HTTP配置数据 - 统一标准
 * 统一HttpConfigForm和相关组件使用的类型
 */
export interface HttpConfiguration {
  /** HTTP方法 */
  method: HttpMethod
  /** 请求URL */
  url: string
  /** 请求头配置 */
  headers: HttpHeader[]
  /** URL参数配置 */
  params: HttpParam[]
  /** 请求体配置 */
  body: HttpBody
  /** 请求体类型 */
  bodyType: HttpBodyType
  /** 超时时间(毫秒) */
  timeout: number
  /** 重试次数 */
  retryCount: number
  /** 重试延迟(毫秒) */
  retryDelay: number
  /** 是否跟随重定向 */
  followRedirect: boolean
  /** 是否验证SSL */
  sslVerify: boolean
  /** 前置脚本 */
  preRequestScript?: string
  /** 响应脚本 */
  responseScript?: string
  /** 动态参数配置 */
  dynamicParams?: DynamicParam[]
}

/**
 * HTTP请求头
 */
export interface HttpHeader {
  /** 头部名称 */
  key: string
  /** 头部值 */
  value: string
  /** 是否启用 */
  enabled: boolean
  /** 是否为动态参数 */
  isDynamic?: boolean
  /** 动态参数名称 */
  dynamicName?: string
  /** 示例值 */
  exampleValue?: string
}

/**
 * HTTP URL参数
 */
export interface HttpParam {
  /** 参数名 */
  key: string
  /** 参数值 */
  value: string
  /** 是否启用 */
  enabled: boolean
  /** 是否为动态参数 */
  isDynamic?: boolean
  /** 动态参数名称 */
  dynamicName?: string
  /** 示例值 */
  exampleValue?: string
}

/**
 * HTTP请求体
 */
export interface HttpBody {
  /** JSON格式请求体 */
  json?: string
  /** 表单数据 */
  form?: HttpFormField[]
  /** 纯文本 */
  text?: string
  /** 原始数据 */
  raw?: string
}

/**
 * HTTP表单字段
 */
export interface HttpFormField {
  /** 字段名 */
  key: string
  /** 字段值 */
  value: string
  /** 是否启用 */
  enabled: boolean
}

// ========== 数据处理类型 ==========

/**
 * 原始数据项
 */
export interface RawDataItem {
  /** 数据项ID */
  id: string
  /** 数据项名称 */
  name: string
  /** 数据类型 */
  dataType: RawDataType
  /** 数据值 */
  value: any
  /** 数据源配置 */
  sourceConfig?: DataSourceConfig
  /** 处理步骤 */
  processingSteps?: ProcessingStep[]
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 元数据 */
  metadata?: RawDataItemMetadata
}

/**
 * 原始数据项元数据
 */
export interface RawDataItemMetadata {
  /** 数据来源 */
  source?: string
  /** 数据大小 */
  size?: number
  /** 数据格式 */
  format?: string
  /** 处理历史 */
  history?: ProcessingHistory[]
}

/**
 * 处理步骤
 */
export interface ProcessingStep {
  /** 步骤ID */
  id: string
  /** 步骤名称 */
  name: string
  /** 步骤类型 */
  type: ProcessingStepType
  /** 步骤配置 */
  config: ProcessingStepConfig
  /** 是否启用 */
  enabled: boolean
  /** 执行顺序 */
  order: number
}

/**
 * 处理历史记录
 */
export interface ProcessingHistory {
  /** 时间戳 */
  timestamp: string
  /** 操作类型 */
  action: string
  /** 操作描述 */
  description: string
  /** 操作者 */
  operator?: string
}

// ========== 最终处理配置类型 ==========

/**
 * 最终处理配置
 */
export interface FinalProcessingConfig {
  /** 处理类型 */
  type: FinalProcessingType
  /** 具体配置 */
  config: FinalProcessingOptions
}

/**
 * 最终处理选项
 */
export interface FinalProcessingOptions {
  /** 选择特定数据项时的索引 */
  selectedIndex?: number
  /** 合并脚本 */
  script?: string
  /** 合并策略 */
  strategy?: MergeStrategy
  /** 是否保留原始结构 */
  keepOriginalStructure?: boolean
}

// ========== 执行和结果类型 ==========

/**
 * 执行上下文
 */
export interface ExecutionContext {
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 执行环境 */
  environment: 'development' | 'production' | 'test'
  /** 用户上下文 */
  user?: UserContext
  /** 时间戳 */
  timestamp: number
}

/**
 * 用户上下文
 */
export interface UserContext {
  /** 用户ID */
  userId?: string
  /** 用户权限 */
  permissions?: string[]
  /** 用户偏好 */
  preferences?: Record<string, any>
}

/**
 * 数据源执行结果
 */
export interface DataSourceExecutionResult {
  /** 执行是否成功 */
  success: boolean
  /** 数据源ID */
  dataSourceId: string
  /** 执行结果数据 */
  data?: any
  /** 错误信息 */
  error?: DataSourceError
  /** 执行时间(毫秒) */
  executionTime: number
  /** 执行时间戳 */
  timestamp: number
  /** 执行上下文 */
  context?: ExecutionContext
}

/**
 * 数据源错误
 */
export interface DataSourceError {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
  /** 错误堆栈 */
  stack?: string
  /** 是否可重试 */
  retryable: boolean
}

// ========== 组件接口类型 ==========

/**
 * 数据源配置表单Props - 统一接口
 */
export interface DataSourceConfigFormProps {
  /** 选中的组件ID */
  selectedWidgetId?: string
  /** 数据源定义列表 */
  dataSources: Record<string, DataSource>
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** v-model绑定值 */
  modelValue?: ComponentDataSourceConfig
  /** 是否只读模式 */
  readonly?: boolean
  /** 调试模式 */
  debugMode?: boolean
}

/**
 * 数据源配置表单Emits - 统一事件接口
 */
export interface DataSourceConfigFormEmits {
  /** v-model更新事件 */
  'update:modelValue': (value: ComponentDataSourceConfig) => void
  /** 数据变更通知 */
  dataChange: (dataSourceKey: string, data: any) => void
  /** 配置同步事件 */
  configSync: (config: ComponentDataSourceConfig) => void
  /** 请求当前运行时数据 */
  'request-current-data': (widgetId: string) => void
  /** 错误事件 */
  error: (error: DataSourceError) => void
}

// ========== 枚举和联合类型 ==========

/**
 * 数据源类型
 */
export type DataSourceType = 'static' | 'http' | 'websocket' | 'script' | 'database' | 'mqtt'

/**
 * HTTP方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * HTTP请求体类型
 */
export type HttpBodyType = 'json' | 'form' | 'text' | 'raw' | 'form-data'

/**
 * 字段类型
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

/**
 * 原始数据类型
 */
export type RawDataType = 'json' | 'http' | 'websocket' | 'clipboard' | 'file' | 'script'

/**
 * 处理步骤类型
 */
export type ProcessingStepType = 'filter' | 'transform' | 'validate' | 'script'

/**
 * 处理步骤配置
 */
export type ProcessingStepConfig = {
  /** JSONPath过滤表达式 */
  jsonPath?: string
  /** 转换脚本 */
  script?: string
  /** 验证规则 */
  validation?: ValidationRule[]
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom'
  /** 规则参数 */
  params?: any
  /** 错误消息 */
  message?: string
}

/**
 * 最终处理类型
 */
export type FinalProcessingType = 'select' | 'merge' | 'concat' | 'script'

/**
 * 合并策略
 */
export type MergeStrategy = 'shallow' | 'deep' | 'replace' | 'append'

/**
 * 动态参数
 */
export interface DynamicParam {
  /** 参数名称 */
  name: string
  /** 参数描述 */
  description?: string
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean'
  /** 默认值 */
  defaultValue?: any
  /** 示例值 */
  exampleValue?: any
  /** 是否必填 */
  required?: boolean
}

// ========== 系统常量 ==========

/**
 * 数据源系统常量
 */
export const DATA_SOURCE_CONSTANTS = {
  /** 配置版本 */
  VERSION: '2.0.0',
  /** 最大数据源数量 */
  MAX_DATA_SOURCES: 10,
  /** 默认HTTP超时时间 */
  DEFAULT_HTTP_TIMEOUT: 30000,
  /** 默认重试次数 */
  DEFAULT_RETRY_COUNT: 3,
  /** 默认重试延迟 */
  DEFAULT_RETRY_DELAY: 1000,
  /** 默认WebSocket重连间隔 */
  DEFAULT_WEBSOCKET_RECONNECT_INTERVAL: 5000,
  /** 脚本执行超时时间 */
  SCRIPT_EXECUTION_TIMEOUT: 10000
} as const

// ========== 类型守卫函数 ==========

/**
 * 检查是否为有效的数据源类型
 */
export function isValidDataSourceType(type: string): type is DataSourceType {
  return ['static', 'http', 'websocket', 'script', 'database', 'mqtt'].includes(type)
}

/**
 * 检查是否为HTTP配置
 */
export function isHttpConfiguration(config: any): config is HttpConfiguration {
  return config && typeof config.url === 'string' && typeof config.method === 'string'
}

/**
 * 检查是否为WebSocket配置
 */
export function isWebSocketConfiguration(config: any): config is WebSocketConfiguration {
  return config && typeof config.url === 'string' && config.url.startsWith('ws')
}

// ========== WebSocket配置类型 ==========

/**
 * WebSocket配置数据 - 统一标准
 */
export interface WebSocketConfiguration {
  /** WebSocket URL */
  url: string
  /** 协议列表 */
  protocols?: string[]
  /** 心跳配置 */
  heartbeat?: WebSocketHeartbeatConfig
  /** 重连配置 */
  reconnect?: WebSocketReconnectConfig
  /** 消息过滤器 */
  messageFilter?: WebSocketMessageFilter
  /** 认证配置 */
  auth?: WebSocketAuthConfig
  /** 缓冲区配置 */
  buffer?: WebSocketBufferConfig
}

/**
 * WebSocket心跳配置
 */
export interface WebSocketHeartbeatConfig {
  /** 是否启用心跳 */
  enabled: boolean
  /** 心跳间隔(毫秒) */
  interval: number
  /** 心跳消息 */
  message?: string
  /** 心跳超时时间(毫秒) */
  timeout?: number
}

/**
 * WebSocket重连配置
 */
export interface WebSocketReconnectConfig {
  /** 是否启用自动重连 */
  enabled: boolean
  /** 重连间隔(毫秒) */
  interval: number
  /** 最大重连次数 */
  maxRetries: number
  /** 退避策略 */
  backoff?: 'linear' | 'exponential'
}

/**
 * WebSocket消息过滤器
 */
export interface WebSocketMessageFilter {
  /** 消息类型过滤 */
  messageType?: string[]
  /** JSONPath过滤表达式 */
  jsonPath?: string
  /** 自定义过滤函数 */
  customFilter?: string
}

/**
 * WebSocket认证配置
 */
export interface WebSocketAuthConfig {
  /** 认证类型 */
  type: 'none' | 'basic' | 'bearer' | 'custom'
  /** 认证令牌 */
  token?: string
  /** 用户名 */
  username?: string
  /** 密码 */
  password?: string
  /** 自定义认证头 */
  headers?: Record<string, string>
}

/**
 * WebSocket缓冲区配置
 */
export interface WebSocketBufferConfig {
  /** 缓冲区大小 */
  size: number
  /** 缓冲策略 */
  strategy: 'fifo' | 'lifo' | 'replace'
}

// ========== 向后兼容性 ==========

// ========== 错误处理系统 ==========

/**
 * 系统错误类型
 */
export enum SystemErrorType {
  // 配置相关
  VALIDATION = 'validation', // 配置验证错误
  MISSING_CONFIG = 'missing_config', // 配置缺失
  INVALID_CONFIG = 'invalid_config', // 配置无效

  // 网络相关
  NETWORK = 'network', // 网络错误
  TIMEOUT = 'timeout', // 超时错误
  ABORT = 'abort', // 请求中止
  CONNECTION_FAILED = 'connection_failed', // 连接失败

  // 认证相关
  AUTH = 'auth', // 认证错误
  PERMISSION = 'permission', // 权限错误

  // 数据处理相关
  PARSE = 'parse', // 数据解析错误
  TRANSFORM = 'transform', // 数据转换错误
  SCRIPT = 'script', // 脚本执行错误

  // 系统相关
  SYSTEM = 'system', // 系统错误
  UNKNOWN = 'unknown' // 未知错误
}

/**
 * 系统错误接口
 */
export interface SystemError {
  /** 错误类型 */
  type: SystemErrorType
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 详细错误信息 */
  details?: any
  /** 错误上下文 */
  context?: Record<string, any>
  /** 时间戳 */
  timestamp: number
  /** 是否可重试 */
  retryable?: boolean
  /** 用户友好消息 */
  userMessage?: string
}

/**
 * 错误处理结果
 */
export interface ErrorHandlingResult<T = any> {
  /** 是否成功 */
  success: boolean
  /** 数据（成功时） */
  data?: T
  /** 错误信息（失败时） */
  error?: SystemError
  /** 执行时间（毫秒） */
  executionTime: number
  /** 重试次数 */
  retryCount?: number
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  /** 策略类型 */
  type: 'retry' | 'fallback' | 'ignore' | 'fail'
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** fallback 数据 */
  fallbackData?: any
  /** 自定义恢复函数 */
  customRecovery?: string
}

/**
 * 错误监听器接口
 */
export interface ErrorListener {
  /** 监听器ID */
  id: string
  /** 错误类型过滤器 */
  errorTypes?: SystemErrorType[]
  /** 回调函数 */
  callback: (error: SystemError) => void | Promise<void>
}

// ========== 向后兼容性 ==========

// 为了保持向后兼容，重新导出一些旧的类型名称
export type HttpConfig = HttpConfiguration
export type HttpConfigData = HttpConfiguration
export type WebSocketConfig = WebSocketConfiguration
export type WebSocketConfigData = WebSocketConfiguration
export type DataSourceValue = ComponentDataSourceConfig
export type ModelValue = ComponentDataSourceConfig
