/**
 * 数据源类型定义
 * 定义数据源系统的契约和类型
 */

/**
 * 数据源类型
 */
export type DataSourceType =
  | 'static' // 静态数据
  | 'http' // HTTP API
  | 'websocket' // WebSocket
  | 'script' // JavaScript 脚本
  | 'device-api' // 设备 API（ThingsPanel 特有）

/**
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * 数据源配置基类
 */
export interface BaseDataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType

  /** 数据源名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 轮询间隔（毫秒，0表示不轮询） */
  pollInterval: number

  /** 数据转换脚本（可选） */
  transformScript?: string
}

/**
 * 静态数据源配置
 */
export interface StaticDataSourceConfig extends BaseDataSourceConfig {
  type: 'static'

  /** 静态数据值 */
  value: any
}

/**
 * HTTP 数据源配置
 */
export interface HttpDataSourceConfig extends BaseDataSourceConfig {
  type: 'http'

  /** 请求 URL */
  url: string

  /** 请求方法 */
  method: HttpMethod

  /** 请求头 */
  headers?: Record<string, string>

  /** 请求参数（Query String） */
  params?: Record<string, any>

  /** 请求体 */
  body?: any

  /** 超时时间（毫秒） */
  timeout?: number

  /** 响应数据路径（使用 lodash.get 路径语法） */
  dataPath?: string
}

/**
 * WebSocket 数据源配置
 */
export interface WebSocketDataSourceConfig extends BaseDataSourceConfig {
  type: 'websocket'

  /** WebSocket URL */
  url: string

  /** 连接协议 */
  protocols?: string | string[]

  /** 订阅消息（连接后发送） */
  subscribeMessage?: any

  /** 消息过滤器（JavaScript 表达式） */
  messageFilter?: string

  /** 数据路径 */
  dataPath?: string

  /** 重连间隔（毫秒） */
  reconnectInterval?: number

  /** 最大重连次数 */
  maxReconnectAttempts?: number
}

/**
 * 脚本数据源配置
 */
export interface ScriptDataSourceConfig extends BaseDataSourceConfig {
  type: 'script'

  /** JavaScript 代码（必须返回 Promise） */
  script: string

  /** 脚本参数 */
  scriptParams?: Record<string, any>
}

/**
 * 设备 API 数据源配置（ThingsPanel 特有）
 */
export interface DeviceApiDataSourceConfig extends BaseDataSourceConfig {
  type: 'device-api'

  /** 设备 ID */
  deviceId: string

  /** 数据键（属性标识符） */
  dataKey: string

  /** API 端点类型 */
  endpoint: 'telemetry' | 'attribute' | 'command'
}

/**
 * 数据源配置联合类型
 */
export type DataSourceConfig =
  | StaticDataSourceConfig
  | HttpDataSourceConfig
  | WebSocketDataSourceConfig
  | ScriptDataSourceConfig
  | DeviceApiDataSourceConfig

/**
 * 数据源实例
 * 由 executor 创建和管理
 */
export interface IDataSourceInstance {
  /** 唯一标识 */
  id: string

  /** 数据源配置 */
  config: DataSourceConfig

  /** 当前数据值 */
  value: any

  /** 加载状态 */
  status: DataSourceStatus

  /** 错误信息 */
  error: string | null

  /** 最后更新时间 */
  lastUpdated: number | null

  /** 开始执行 */
  start(): Promise<void>

  /** 停止执行 */
  stop(): Promise<void>

  /** 手动刷新 */
  refresh(): Promise<void>

  /** 订阅数据变化 */
  subscribe(callback: DataChangeCallback): () => void
}

/**
 * 数据源状态
 */
export type DataSourceStatus =
  | 'idle' // 空闲
  | 'loading' // 加载中
  | 'success' // 成功
  | 'error' // 错误

/**
 * 数据变化回调函数
 */
export type DataChangeCallback = (value: any, prevValue: any) => void

/**
 * 数据转换函数
 * 用于处理数据源返回的原始数据
 */
export type DataTransformer = (rawData: any, context: TransformContext) => any

/**
 * 数据转换上下文
 */
export interface TransformContext {
  /** 节点 ID */
  nodeId: string

  /** 数据源键 */
  dataKey: string

  /** 之前的数据值 */
  prevValue: any

  /** 节点当前配置 */
  nodeConfig: Record<string, any>
}

/**
 * 数据源提供者接口（Provider）
 * 每种数据源类型必须实现此接口
 */
export interface IDataSourceProvider<T extends DataSourceConfig = DataSourceConfig> {
  /** 提供者支持的数据源类型 */
  readonly type: DataSourceType

  /** 创建数据源实例 */
  create(config: T): IDataSourceInstance

  /** 销毁数据源实例 */
  destroy(instance: IDataSourceInstance): Promise<void>

  /** 验证配置 */
  validate(config: T): ValidationResult
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean

  /** 错误信息列表 */
  errors: string[]
}

/**
 * 数据源执行器配置
 */
export interface DataSourceExecutorConfig {
  /** 全局超时时间（毫秒） */
  globalTimeout: number

  /** 最大并发数据源数量 */
  maxConcurrent: number

  /** 是否启用数据缓存 */
  enableCache: boolean

  /** 缓存过期时间（毫秒） */
  cacheExpiration: number
}

/**
 * 节点数据绑定映射
 * 描述一个节点的所有数据源绑定关系
 */
export interface NodeDataBinding {
  /** 节点 ID */
  nodeId: string

  /** 数据源映射：数据键 -> 数据源配置 */
  dataSources: Record<string, DataSourceConfig>

  /** 数据转换器映射：数据键 -> 转换函数 */
  transformers?: Record<string, DataTransformer>
}

/**
 * 数据更新事件
 */
export interface DataUpdateEvent {
  /** 节点 ID */
  nodeId: string

  /** 数据键 */
  dataKey: string

  /** 新值 */
  value: any

  /** 旧值 */
  prevValue: any

  /** 更新时间 */
  timestamp: number

  /** 数据源类型 */
  sourceType: DataSourceType
}
