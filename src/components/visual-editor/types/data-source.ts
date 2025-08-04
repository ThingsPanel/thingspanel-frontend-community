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

// 基础数据源接口
export interface BaseDataSource {
  type: DataSourceType
  enabled: boolean
  name: string
  description?: string
  dataPath?: string // 数据路径，如 "data.value" 或 "data[0].value"
}

// 静态数据源配置
export interface StaticDataSource extends BaseDataSource {
  type: DataSourceType.STATIC
  data: Record<string, any>
  refreshInterval?: number // 刷新间隔（毫秒），0表示不自动刷新
}

// 设备数据源配置
export interface DeviceDataSource extends BaseDataSource {
  type: DataSourceType.DEVICE
  deviceId?: string
  metricsId?: string
  metricsType?: 'telemetry' | 'attributes' | 'event' | 'command'
  metricsName?: string
  aggregateFunction?: string
  timeRange?: string
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
}

// 联合类型
export type DataSource = StaticDataSource | DeviceDataSource | HttpDataSource | WebSocketDataSource

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

// 数据源值接口 - 统一的数据格式
export interface DataSourceValue {
  value: any // 可以是任何类型：string, number, object, array
  timestamp: number
  unit?: string
  quality?: 'good' | 'bad' | 'uncertain'
  metadata?: Record<string, any>
  rawData?: any // 原始数据，用于调试
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
  resolve(data: any, path?: string): any
  getAvailablePaths(data: any): string[]
}
