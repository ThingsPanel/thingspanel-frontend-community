/**
 * 数据源配置系统统一类型定义
 * 统一Card 2.1和Visual Editor的数据源类型系统
 */

// ========== 基础数据源类型 ==========

/**
 * 数据源类型枚举
 */
export enum DataSourceType {
  STATIC = 'static',
  API = 'api',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  SCRIPT = 'script',
  DEVICE = 'device',
  DATABASE = 'database'
}

/**
 * 数据源状态
 */
export enum DataSourceStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * 数据质量等级
 */
export type DataQuality = 'good' | 'bad' | 'uncertain'

// ========== 数据源配置接口 ==========

/**
 * 基础数据源配置
 */
export interface BaseDataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description?: string
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 静态数据源配置
 */
export interface StaticDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.STATIC
  /** 静态数据内容 */
  data: any
  /** 数据格式 */
  format?: 'json' | 'xml' | 'csv' | 'text'
}

/**
 * API/HTTP数据源配置
 */
export interface ApiDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.API | DataSourceType.HTTP
  /** API地址 */
  url: string
  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  body?: string
  /** 查询参数 */
  params?: Record<string, any>
  /** 认证配置 */
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key'
    credentials?: Record<string, string>
  }
}

/**
 * WebSocket数据源配置
 */
export interface WebSocketDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.WEBSOCKET
  /** WebSocket地址 */
  url: string
  /** 协议列表 */
  protocols?: string[]
  /** 是否自动重连 */
  autoReconnect?: boolean
  /** 重连间隔(毫秒) */
  reconnectInterval?: number
  /** 心跳配置 */
  heartbeat?: {
    interval: number
    message: string
  }
}

/**
 * 脚本数据源配置
 */
export interface ScriptDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.SCRIPT
  /** 脚本代码 */
  script: string
  /** 脚本语言 */
  language?: 'javascript' | 'typescript'
  /** 脚本参数 */
  parameters?: Record<string, any>
}

/**
 * 设备数据源配置
 */
export interface DeviceDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.DEVICE
  /** 设备ID */
  deviceId: string
  /** API类型 */
  apiType: 'telemetryDataCurrentKeys' | 'getAttributeDataSet' | 'getAttributeDatasKey' | 'telemetryDataHistoryList'
  /** API参数 */
  parameters: Record<string, any>
  /** 数据类型 */
  metricsType?: 'telemetry' | 'attributes' | 'events'
  /** 数据字段 */
  metricsId?: string
}

/**
 * 数据库数据源配置
 */
export interface DatabaseDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.DATABASE
  /** 数据库连接配置 */
  connection: {
    host: string
    port: number
    database: string
    username: string
    password: string
    ssl?: boolean
  }
  /** SQL查询 */
  query: string
  /** 查询参数 */
  queryParams?: Record<string, any>
}

/**
 * 统一数据源配置类型
 */
export type DataSourceConfig =
  | StaticDataSourceConfig
  | ApiDataSourceConfig
  | WebSocketDataSourceConfig
  | ScriptDataSourceConfig
  | DeviceDataSourceConfig
  | DatabaseDataSourceConfig

// ========== 数据源实例接口 ==========

/**
 * 数据源值接口
 */
export interface DataSourceValue {
  /** 处理后的数据值(多字段映射) */
  values: Record<string, any>
  /** 数据时间戳 */
  timestamp: number
  /** 数据质量 */
  quality: DataQuality
  /** 元数据 */
  metadata?: {
    source: string
    [key: string]: any
  }
  /** 原始数据 */
  rawData?: any
  /** 错误信息 */
  error?: string
}

/**
 * 数据源更新回调
 */
export type DataSourceUpdateCallback = (value: DataSourceValue) => void

/**
 * 数据路径映射
 */
export interface DataPathMapping {
  /** 源数据路径 */
  key: string
  /** 目标字段名 */
  target: string
  /** 数据类型 */
  type?: 'number' | 'string' | 'boolean' | 'object' | 'array'
  /** 是否为数组 */
  isArray?: boolean
  /** 数组处理模式 */
  arrayMode?: 'first' | 'last' | 'all' | 'index' | 'auto'
  /** 数组索引(当arrayMode为'index'时) */
  arrayIndex?: number
  /** 默认值 */
  defaultValue?: any
  /** 转换函数 */
  transformer?: (value: any) => any
}

/**
 * 数据映射配置
 */
export interface DataMappingConfig {
  /** 数据路径映射列表 */
  paths?: DataPathMapping[]
  /** 默认数组处理模式 */
  defaultArrayMode?: 'first' | 'last' | 'all' | 'index' | 'auto'
  /** 默认数组索引 */
  defaultArrayIndex?: number
  /** 是否启用自动检测 */
  enableAutoDetection?: boolean
}

/**
 * 数据源配置接口（增强版）
 */
export interface EnhancedDataSourceConfiguration {
  /** 数据源基础配置 */
  source: DataSourceConfig
  /** 数据映射配置 */
  dataMapping?: DataMappingConfig
  /** 数据刷新间隔(秒) */
  refreshInterval?: number
  /** 是否启用数据缓存 */
  enableCache?: boolean
  /** 缓存时间(秒) */
  cacheTimeout?: number
  /** 错误重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxAttempts: number
    /** 重试延迟(毫秒) */
    delay: number
    /** 指数退避 */
    exponentialBackoff?: boolean
  }
  /** 数据验证配置 */
  validation?: {
    /** 验证模式 */
    schema?: any
    /** 是否验证响应 */
    validateResponse?: boolean
    /** 错误阈值 */
    errorThreshold?: number
  }
  /** 监控配置 */
  monitoring?: {
    /** 是否启用监控 */
    enabled: boolean
    /** 监控指标 */
    metrics: string[]
    /** 告警阈值 */
    alertThresholds: Record<string, number>
  }
}

// ========== 数据源管理接口 ==========

/**
 * 数据源实例接口
 */
export interface IDataSource {
  /** 数据源ID */
  readonly id: string
  /** 数据源配置 */
  readonly config: DataSourceConfig
  /** 数据源状态 */
  readonly status: DataSourceStatus
  /** 最后更新时间 */
  readonly lastUpdated: number
  /** 错误信息 */
  readonly error?: Error

  /** 启动数据源 */
  start(): Promise<void>
  /** 停止数据源 */
  stop(): Promise<void>
  /** 获取数据 */
  fetchData(): Promise<any>
  /** 验证配置 */
  validateConfig(): boolean
  /** 测试连接 */
  testConnection(): Promise<boolean>
}

/**
 * 数据源管理器接口
 */
export interface IDataSourceManager {
  /** 创建数据源实例 */
  createDataSource(id: string, config: DataSourceConfig): IDataSource
  /** 获取数据源实例 */
  getDataSource(id: string): IDataSource | null
  /** 移除数据源实例 */
  removeDataSource(id: string): boolean
  /** 订阅数据源 */
  subscribe(id: string, callback: DataSourceUpdateCallback): () => void
  /** 获取数据源值 */
  getValue(id: string): Promise<DataSourceValue>
  /** 测试数据源配置 */
  testDataSourceConfig(config: DataSourceConfig): Promise<boolean>
  /** 清理所有资源 */
  destroy(): void
}

// ========== 验证和错误处理 ==========

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: string[]
  /** 警告列表 */
  warnings: string[]
}

/**
 * 数据源验证器接口
 */
export interface IDataSourceValidator {
  /** 验证数据源配置 */
  validateConfig(config: DataSourceConfig): ValidationResult
  /** 验证数据映射配置 */
  validateDataMapping(mapping: DataMappingConfig): ValidationResult
  /** 验证数据源连接 */
  validateConnection(config: DataSourceConfig): Promise<ValidationResult>
}

/**
 * 错误类型
 */
export enum DataSourceErrorType {
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * 数据源错误接口
 */
export interface DataSourceError extends Error {
  type: DataSourceErrorType
  code?: string
  details?: any
  retryable?: boolean
}

// ========== 兼容性类型映射 ==========

/**
 * Visual Editor兼容的数据源配置类型
 */
export interface VisualEditorDataSourceConfig {
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script' | 'device' | null
  /** 数据源配置 */
  config: Record<string, any>
  /** 数据刷新间隔(秒) */
  refreshInterval?: number
  /** 是否启用数据缓存 */
  enableCache?: boolean
  /** 缓存时间(秒) */
  cacheTimeout?: number
  /** 错误重试次数 */
  retryAttempts?: number
  /** 数据映射配置 */
  dataMapping?: {
    [key: string]: string | ((data: any) => any)
  }
}

/**
 * Card 2.1兼容的数据源配置类型
 */
export interface Card2DataSourceConfig {
  type: 'static' | 'api' | 'websocket' | 'script' | 'database'
  config: any
}
