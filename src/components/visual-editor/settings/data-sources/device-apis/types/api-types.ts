// API类型枚举
export enum ApiType {
  // 遥测数据
  TELEMETRY_CURRENT = 'telemetry_current',
  TELEMETRY_HISTORY = 'telemetry_history',
  TELEMETRY_PUB = 'telemetry_pub',
  TELEMETRY_LOGS = 'telemetry_logs',

  // 属性数据
  ATTRIBUTES_DATASET = 'attributes_dataset',
  ATTRIBUTES_KEY = 'attributes_key',
  ATTRIBUTES_PUB = 'attributes_pub',
  ATTRIBUTES_LOGS = 'attributes_logs',

  // 事件数据
  EVENT_DATASET = 'event_dataset',

  // 命令数据
  COMMAND_PUB = 'command_pub',
  COMMAND_LOGS = 'command_logs',
  COMMAND_CUSTOM = 'command_custom',

  // 设备信息
  DEVICE_DETAIL = 'device_detail',
  DEVICE_CONNECT = 'device_connect',
  DEVICE_ALARM_STATUS = 'device_alarm_status',
  DEVICE_ALARM_HISTORY = 'device_alarm_history',

  // 模拟数据
  SIMULATION_GET = 'simulation_get',
  SIMULATION_SEND = 'simulation_send'
}

// 轮询方式枚举
export enum PollingType {
  HTTP = 'http',
  WEBSOCKET = 'websocket'
}

// API配置接口
export interface ApiConfig {
  type: ApiType
  deviceId: string
  pollingType: PollingType
  enabled: boolean
  refreshInterval?: number // 轮询间隔（毫秒）
  websocketUrl?: string // WebSocket URL
  parameters: Record<string, any> // API特定参数
}

// 遥测数据参数
export interface TelemetryParams {
  keys?: string // 当前值、日志
  key?: string // 历史值、发布
  time_range?: string // 历史值
  aggregate_function?: string // 历史值
  value?: any // 发布
}

// 属性数据参数
export interface AttributesParams {
  key?: string // 指定键值、发布
  value?: any // 发布
}

// 命令数据参数
export interface CommandParams {
  key?: string // 发布
  value?: any // 发布
}

// 模拟数据参数
export interface SimulationParams {
  key?: string // 发送
  value?: any // 发送
}

// API响应数据
export interface ApiResponse {
  success: boolean
  data: any
  message?: string
  timestamp: string
}

// 设备信息
export interface DeviceInfo {
  id: string
  name: string
  type?: string
  status?: string
}

// 表单配置
export interface FormConfig {
  title: string
  description: string
  parameters: FormParameter[]
  supportsPolling: boolean
  supportsWebSocket: boolean
}

// 表单参数
export interface FormParameter {
  name: string
  label: string
  type: 'string' | 'number' | 'select' | 'textarea' | 'boolean'
  required: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  description?: string
  validation?: (value: any) => string | null
}

// 轮询配置
export interface PollingConfig {
  enabled: boolean
  interval: number // 毫秒
  status: 'stopped' | 'running' | 'error'
  lastUpdate?: string
  errorMessage?: string
}

// WebSocket配置
export interface WebSocketConfig {
  url: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  lastMessage?: any
  errorMessage?: string
}
