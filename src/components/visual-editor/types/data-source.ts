/**
 * 数据源系统类型定义
 */

// 数据源类型枚举
export enum DataSourceType {
  NONE = 'none', // 不使用数据源
  STATIC = 'static', // 静态数据（JSON）
  DEVICE = 'device', // 设备数据
  HTTP = 'http', // HTTP API
  WEBSOCKET = 'websocket' // WebSocket
}

// 数据路径映射配置
export interface DataPathMapping {
  key: string // 数据源中的路径，如 "data.temperature" 或 "data[0].temperature"
  target: string // 映射到组件的数据源名称，如 "temperature"
  description?: string // 描述
  isArray?: boolean // 标记此映射是否指向数组数据
  arrayIndex?: number // 数组索引，默认为0
  arrayMode?: 'auto' | 'manual' | 'none' // 数组处理模式：auto=自动检测, manual=手动指定, none=不处理
}

// 数据映射配置
export interface DataMappingConfig {
  mappings: DataPathMapping[]
  defaultArrayMode?: 'auto' | 'manual' | 'none' // 默认数组处理模式
  defaultArrayIndex?: number // 默认数组索引，默认为0
  enableAutoDetection?: boolean // 是否启用自动检测，默认为true
}

// 基础数据源接口
export interface BaseDataSource {
  type: DataSourceType
  enabled: boolean
  name: string
  description?: string
  dataPaths: DataPathMapping[] // 支持多个数据路径映射
  dataMapping?: DataMappingConfig // 数据映射配置，包含数组模式等高级配置
}

// 静态数据源配置
export interface StaticDataSource extends BaseDataSource {
  type: DataSourceType.STATIC
  data: Record<string, any>
  refreshInterval?: number // 刷新间隔（毫秒），0表示不自动刷新
}

// 轮询配置
export interface PollingConfig {
  enabled: boolean
  mode?: 'websocket' | 'timer' | 'manual' // 数据获取模式
  interval: number // 间隔时间(毫秒)
  status: 'stopped' | 'running' | 'paused'
}

// 基于API接口的设备数据源配置（新设计）
export interface DeviceDataSourceNew extends BaseDataSource {
  type: DataSourceType.DEVICE
  apiType: string // API接口类型，如 'telemetryDataCurrentKeys', 'telemetryDataHistoryList' 等
  parameters: Record<string, any> // API参数，根据apiType动态变化
  polling: PollingConfig // 轮询配置
}

// 兼容的设备数据源配置（保留旧版本兼容性）
export interface DeviceDataSource extends BaseDataSource {
  type: DataSourceType.DEVICE
  deviceId?: string
  metricsId?: string
  metricsType?: 'telemetry' | 'attributes' | 'event' | 'command'
  metricsName?: string
  metricsDataType?: string
  aggregateFunction?: string
  timeRange?: string
  refreshInterval?: number
  metricsOptions?: any[]
  metricsOptionsFetched?: boolean
  metricsShow?: boolean
  // 新增字段
  dataMode?: 'latest' | 'history' // 数据模式：最新数据/历史数据
  pollingType?: 'timer' | 'websocket' | 'mqtt' // 轮询方式
  websocketUrl?: string // WebSocket URL
  websocketTopic?: string // WebSocket 订阅主题
  mqttConfig?: {
    broker: string
    topic: string
    username?: string
    password?: string
  }
  // 数据请求相关
  isDataLoading?: boolean
  lastFetchTime?: number
  errorMessage?: string
  // 新API配置兼容字段
  apiType?: string
  parameters?: Record<string, any>
  polling?: PollingConfig
}

// HTTP 数据源
export interface HttpDataSource extends BaseDataSource {
  type: DataSourceType.HTTP
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Array<{ key: string; value: string }>
  body?: string
  refreshInterval?: number
}

// WebSocket数据源配置
export interface WebSocketDataSource extends BaseDataSource {
  type: DataSourceType.WEBSOCKET
  url: string
  protocols?: string | string[]
  messageFormat: 'json' | 'text'
  refreshInterval?: number
}

// 联合类型
export type DataSource =
  | StaticDataSource
  | DeviceDataSource
  | DeviceDataSourceNew
  | HttpDataSource
  | WebSocketDataSource

// 组件数据源定义
export interface ComponentDataSourceDefinition {
  name: string // 数据源名称
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' // 数据类型
  required: boolean // 是否必需
  description: string // 描述
  defaultValue: any // 默认值
  mappingKeys?: string[] // 需要映射的键（基于defaultValue结构）
}

// 数据源值接口 - 支持多值
export interface DataSourceValue {
  values: Record<string, any> // 多个值，key为组件数据源名称
  timestamp: number
  quality?: 'good' | 'bad' | 'uncertain'
  metadata?: Record<string, any>
  rawData?: any // 原始数据，用于调试
  error?: string // 错误信息
}

// 数据源更新回调
export type DataSourceUpdateCallback = (value: DataSourceValue) => void

// 数据源管理器接口
export interface DataSourceManager {
  subscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): () => void
  unsubscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): void
  getValue(dataSource: DataSource): Promise<DataSourceValue>
  updateValue(dataSource: DataSource, value: any): void
}

// 数据路径解析工具
export interface DataPathResolver {
  resolve(
    data: any,
    path?: string,
    options?: {
      arrayMode?: 'auto' | 'manual' | 'none'
      defaultArrayIndex?: number
      enableAutoDetection?: boolean
    }
  ): any
  getAvailablePaths(data: any): string[]
  detectDataType(
    data: any,
    path?: string
  ): {
    isArray: boolean
    arrayLength?: number
    type: string
    sampleValue?: any
  }
  suggestPath(data: any, targetField: string): string
}

// 数据源配置组件接口
export interface DataSourceConfigComponent {
  type: DataSourceType
  name: string
  description: string
  icon: string
  component: any // Vue组件
  defaultConfig: Partial<DataSource>
}

// 数据源注册表
export interface DataSourceRegistry {
  register(type: DataSourceType, config: DataSourceConfigComponent): void
  get(type: DataSourceType): DataSourceConfigComponent | undefined
  getAll(): DataSourceConfigComponent[]
  has(type: DataSourceType): boolean
}
