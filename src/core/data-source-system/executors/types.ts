/**
 * 数据项执行器类型定义
 * 重构架构 - 支持"数组思想"，每个数据项作为独立执行器
 */

// ========== 基础类型定义 ==========

/**
 * 数据项类型
 */
export type DataItemType = 'json' | 'http' | 'websocket' | 'script'

/**
 * 执行器状态枚举
 */
export enum ExecutorState {
  IDLE = 'idle', // 空闲状态
  RUNNING = 'running', // 运行中
  SUCCESS = 'success', // 执行成功
  ERROR = 'error', // 执行错误
  STOPPED = 'stopped' // 已停止
}

/**
 * 执行器基础配置接口
 */
export interface BaseExecutorConfig {
  /** 执行器ID */
  id: string
  /** 执行器名称 */
  name: string
  /** 执行器类型 */
  type: DataItemType
  /** 是否启用 */
  enabled: boolean
  /** 数据过滤路径 */
  filterPath?: string
  /** 数据处理脚本 */
  processScript?: string
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/**
 * JSON执行器配置
 */
export interface JsonExecutorConfig extends BaseExecutorConfig {
  type: 'json'
  /** JSON数据内容 */
  jsonData: string
}

/**
 * HTTP执行器配置
 */
export interface HttpExecutorConfig extends BaseExecutorConfig {
  type: 'http'
  /** 请求URL */
  url: string
  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  body?: any
  /** 超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retryCount?: number
  /** 重试间隔（毫秒） */
  retryInterval?: number
}

/**
 * WebSocket执行器配置
 */
export interface WebSocketExecutorConfig extends BaseExecutorConfig {
  type: 'websocket'
  /** WebSocket URL */
  url: string
  /** 协议列表 */
  protocols?: string[]
  /** 重连间隔（毫秒） */
  reconnectInterval?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
}

/**
 * 脚本执行器配置
 */
export interface ScriptExecutorConfig extends BaseExecutorConfig {
  type: 'script'
  /** JavaScript脚本代码 */
  script: string
  /** 脚本上下文 */
  context?: Record<string, any>
  /** 执行超时时间（毫秒） */
  timeout?: number
}

/**
 * 执行器配置联合类型
 */
export type ExecutorConfig = JsonExecutorConfig | HttpExecutorConfig | WebSocketExecutorConfig | ScriptExecutorConfig

// ========== 执行器状态管理 ==========

/**
 * 执行器运行时状态
 */
export interface ExecutorRuntimeState {
  /** 当前状态 */
  state: ExecutorState
  /** 最后执行时间 */
  lastExecutionTime?: number
  /** 执行次数 */
  executionCount: number
  /** 成功次数 */
  successCount: number
  /** 错误次数 */
  errorCount: number
  /** 最后执行结果 */
  lastResult?: ExecutionResult
  /** 最后错误信息 */
  lastError?: string
  /** 是否正在运行 */
  isRunning: boolean
  /** 启动时间 */
  startTime?: number
  /** 停止时间 */
  stopTime?: number
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 原始数据 */
  rawData?: any
  /** 处理后数据 */
  processedData?: any
  /** 执行时长（毫秒） */
  duration: number
  /** 执行时间戳 */
  timestamp: number
  /** 错误信息 */
  error?: string
  /** 元数据 */
  metadata?: Record<string, any>
}

// ========== 事件系统 ==========

/**
 * 执行器事件类型
 */
export enum ExecutorEventType {
  STATE_CHANGED = 'state-changed',
  EXECUTION_STARTED = 'execution-started',
  EXECUTION_COMPLETED = 'execution-completed',
  EXECUTION_FAILED = 'execution-failed',
  DATA_UPDATED = 'data-updated',
  ERROR_OCCURRED = 'error-occurred',
  CONFIG_UPDATED = 'config-updated',
  DISPOSED = 'disposed'
}

/**
 * 执行器事件数据
 */
export interface ExecutorEvent {
  type: ExecutorEventType
  executorId: string
  timestamp: number
  data?: any
}

/**
 * 事件处理器
 */
export type ExecutorEventHandler = (event: ExecutorEvent) => void

// ========== 生命周期管理 ==========

/**
 * 执行器生命周期阶段
 */
export enum ExecutorLifecycle {
  CREATED = 'created',
  INITIALIZED = 'initialized',
  STARTED = 'started',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  DISPOSED = 'disposed'
}

/**
 * 生命周期回调
 */
export interface LifecycleCallbacks {
  onCreated?: () => void
  onInitialized?: () => void
  onStarted?: () => void
  onStopped?: () => void
  onDisposed?: () => void
  onError?: (error: Error) => void
}

// ========== 调度和触发器 ==========

/**
 * 触发器类型
 */
export enum TriggerType {
  MANUAL = 'manual', // 手动触发
  TIMER = 'timer', // 定时器触发
  INTERVAL = 'interval', // 间隔触发
  WEBSOCKET = 'websocket', // WebSocket触发
  EVENT = 'event' // 事件触发
}

/**
 * 触发器配置
 */
export interface TriggerConfig {
  type: TriggerType
  /** 是否启用 */
  enabled: boolean
  /** 定时器配置 */
  timer?: {
    /** 延迟时间（毫秒） */
    delay: number
    /** 是否立即执行 */
    immediate?: boolean
  }
  /** 间隔配置 */
  interval?: {
    /** 间隔时间（毫秒） */
    interval: number
    /** 是否立即执行 */
    immediate?: boolean
  }
  /** WebSocket触发配置 */
  websocket?: {
    /** 监听的消息类型 */
    messageType?: string
    /** 消息过滤器 */
    messageFilter?: (message: any) => boolean
  }
  /** 事件触发配置 */
  event?: {
    /** 事件名称 */
    eventName: string
    /** 事件源 */
    eventTarget?: EventTarget
  }
}

// ========== 工具类型 ==========

/**
 * 可选的Promise类型
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * 可选的属性
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 深度可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 只读深度类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ========== 常量定义 ==========

/**
 * 执行器常量
 */
export const EXECUTOR_CONSTANTS = {
  /** 默认超时时间（毫秒） */
  DEFAULT_TIMEOUT: 30000,
  /** 默认重试次数 */
  DEFAULT_RETRY_COUNT: 3,
  /** 默认重试间隔（毫秒） */
  DEFAULT_RETRY_INTERVAL: 1000,
  /** 默认心跳间隔（毫秒） */
  DEFAULT_HEARTBEAT_INTERVAL: 30000,
  /** 最大执行历史记录数 */
  MAX_EXECUTION_HISTORY: 100,
  /** 默认调度间隔（毫秒） */
  DEFAULT_SCHEDULE_INTERVAL: 30000
} as const

/**
 * 执行器错误类型
 */
export enum ExecutorErrorType {
  CONFIG_ERROR = 'config-error',
  NETWORK_ERROR = 'network-error',
  TIMEOUT_ERROR = 'timeout-error',
  PARSE_ERROR = 'parse-error',
  SCRIPT_ERROR = 'script-error',
  VALIDATION_ERROR = 'validation-error',
  UNKNOWN_ERROR = 'unknown-error'
}

/**
 * 执行器错误
 */
export class ExecutorError extends Error {
  constructor(
    public type: ExecutorErrorType,
    message: string,
    public executorId?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ExecutorError'
  }
}
