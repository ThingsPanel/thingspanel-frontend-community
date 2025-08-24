/**
 * WebSocket数据源配置相关类型定义
 * 基于DataSourceConfigForm copy.vue中的WebSocket配置功能分析
 */

// WebSocket连接状态
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

// WebSocket消息类型
export type WebSocketMessageType = 'text' | 'binary' | 'ping' | 'pong'

// WebSocket认证类型
export type WebSocketAuthType = 'none' | 'token' | 'basic' | 'custom'

// WebSocket认证配置
export interface WebSocketAuthConfig {
  /** 认证类型 */
  type: WebSocketAuthType
  /** Token认证配置 */
  token?: {
    value: string
    headerName?: string // 默认为 'Authorization'
    prefix?: string // 如 'Bearer ', 'Token ' 等
  }
  /** Basic认证配置 */
  basic?: {
    username: string
    password: string
  }
  /** 自定义认证配置 */
  custom?: {
    headers: Record<string, string>
    query: Record<string, string>
  }
}

// WebSocket重连策略
export interface WebSocketReconnectConfig {
  /** 是否启用自动重连 */
  enabled: boolean
  /** 最大重连次数 */
  maxAttempts: number
  /** 初始重连延迟（毫秒） */
  initialDelay: number
  /** 最大重连延迟（毫秒） */
  maxDelay: number
  /** 延迟增长因子 */
  backoffFactor: number
  /** 随机化延迟 */
  jitter: boolean
}

// WebSocket消息过滤配置
export interface WebSocketMessageFilter {
  /** 是否启用过滤 */
  enabled: boolean
  /** 过滤条件 */
  conditions: Array<{
    /** 字段路径（JSONPath格式） */
    path: string
    /** 操作符 */
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists'
    /** 期望值 */
    value: any
    /** 逻辑关系 */
    logic: 'and' | 'or'
  }>
}

// WebSocket心跳配置
export interface WebSocketHeartbeatConfig {
  /** 是否启用心跳 */
  enabled: boolean
  /** 心跳间隔（毫秒） */
  interval: number
  /** 心跳消息内容 */
  message: string
  /** 心跳消息类型 */
  messageType: WebSocketMessageType
  /** 期望的响应消息 */
  expectedResponse?: string
  /** 超时时间（毫秒） */
  timeout: number
}

// WebSocket连接信息
export interface WebSocketConnectionInfo {
  /** 连接状态 */
  state: WebSocketState
  /** 连接开始时间 */
  connectedAt?: number
  /** 断开时间 */
  disconnectedAt?: number
  /** 重连次数 */
  reconnectCount: number
  /** 发送消息计数 */
  sentMessageCount: number
  /** 接收消息计数 */
  receivedMessageCount: number
  /** 最后一条消息时间 */
  lastMessageAt?: number
  /** 连接错误信息 */
  error?: string
}

// WebSocket消息记录
export interface WebSocketMessage {
  /** 消息ID */
  id: string
  /** 消息方向 */
  direction: 'sent' | 'received'
  /** 消息内容 */
  content: any
  /** 消息类型 */
  type: WebSocketMessageType
  /** 时间戳 */
  timestamp: number
  /** 消息大小（字节） */
  size: number
}

// WebSocket消息缓冲区配置
export interface WebSocketBufferConfig {
  /** 最大缓存消息数量 */
  maxMessages: number
  /** 是否启用消息去重 */
  deduplication: boolean
  /** 去重字段路径 */
  deduplicationPath?: string
  /** 是否按时间排序 */
  sortByTime: boolean
}

// 完整的WebSocket配置接口
export interface WebSocketDataSourceConfig {
  /** WebSocket服务器URL */
  url: string

  /** 支持的协议列表 */
  protocols: string[]

  /** 认证配置 */
  auth: WebSocketAuthConfig

  /** 重连配置 */
  reconnect: WebSocketReconnectConfig

  /** 消息过滤配置 */
  messageFilter: WebSocketMessageFilter

  /** 心跳配置 */
  heartbeat: WebSocketHeartbeatConfig

  /** 消息缓冲区配置 */
  buffer: WebSocketBufferConfig

  /** 连接超时时间（毫秒） */
  connectionTimeout: number

  /** 自定义头部 */
  customHeaders: Record<string, string>

  /** 连接信息（运行时状态） */
  connectionInfo: WebSocketConnectionInfo

  /** 消息历史记录（运行时数据） */
  messageHistory: WebSocketMessage[]
}

// WebSocket测试结果
export interface WebSocketTestResult {
  /** 是否连接成功 */
  success: boolean
  /** 连接耗时（毫秒） */
  connectionTime?: number
  /** 错误信息 */
  error?: string
  /** 服务器响应的协议 */
  protocol?: string
  /** 连接详情 */
  connectionDetails?: {
    url: string
    protocols: string[]
    headers: Record<string, string>
  }
  /** 测试消息记录 */
  testMessages?: WebSocketMessage[]
}

// WebSocket测试状态
export interface WebSocketTestStatus {
  /** 是否正在测试 */
  testing: boolean
  /** 测试阶段 */
  phase: 'connecting' | 'connected' | 'messaging' | 'disconnecting' | 'completed'
  /** 测试开始时间 */
  startTime?: number
  /** 测试结果 */
  result?: WebSocketTestResult
}

// WebSocket事件类型
export type WebSocketEventType =
  | 'connection-open'
  | 'connection-close'
  | 'connection-error'
  | 'message-received'
  | 'message-sent'
  | 'reconnect-attempt'
  | 'heartbeat-sent'
  | 'heartbeat-timeout'

// WebSocket事件数据
export interface WebSocketEvent {
  /** 事件类型 */
  type: WebSocketEventType
  /** 时间戳 */
  timestamp: number
  /** 事件数据 */
  data?: any
  /** 错误信息（如果是错误事件） */
  error?: string
}

// WebSocket配置验证结果
export interface WebSocketConfigValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    field: string
    message: string
    type: 'required' | 'format' | 'invalid'
  }>
  /** 警告列表 */
  warnings?: Array<{
    field: string
    message: string
  }>
}

// WebSocket工具方法相关类型
export interface WebSocketUtilities {
  /** 验证WebSocket URL */
  validateUrl: (url: string) => { valid: boolean; error?: string }
  /** 解析WebSocket URL */
  parseUrl: (url: string) => {
    protocol: 'ws' | 'wss'
    host: string
    port: number
    path: string
    query: Record<string, string>
  }
  /** 格式化消息内容 */
  formatMessage: (content: any, type: WebSocketMessageType) => string
  /** 计算消息大小 */
  calculateMessageSize: (content: any) => number
}
