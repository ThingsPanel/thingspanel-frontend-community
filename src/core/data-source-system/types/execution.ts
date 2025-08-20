/**
 * 数据源执行系统类型定义
 * 定义执行器、触发器、配置等相关类型接口
 */

// ================== 基础配置类型 ==================

/**
 * HTTP请求配置
 */
export interface HttpConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Array<{ key: string; value: string }>
  params: Array<{ key: string; value: string }>
  bodyType: 'none' | 'json' | 'form' | 'raw'
  bodyContent: string
  formData?: Array<{ key: string; value: string }>
  timeout: number
  retries?: number
  enablePreScript?: boolean
  preRequestScript?: string
  enableResponseScript?: boolean
  responseScript?: string
}

/**
 * WebSocket配置
 */
export interface WebSocketConfig {
  url: string
  protocols?: string[]
  headers?: Record<string, string>
  reconnectInterval?: number
  maxReconnectAttempts?: number
  messageFilter?: string
  autoConnect?: boolean
}

/**
 * 原始数据项配置
 */
export interface RawDataItem {
  id: string
  name: string
  type: 'json' | 'http' | 'websocket'
  data?: any
  httpConfig?: HttpConfig
  webSocketConfig?: WebSocketConfig
  description?: string
  enabled?: boolean
  config?: {
    filterPath?: string
    processScript?: string
    httpConfig?: HttpConfig
    jsonData?: string
    [key: string]: any
  }
  createdAt?: string
  isActive?: boolean
}

/**
 * 数据处理配置
 */
export interface DataProcessingConfig {
  finalProcessingType: 'merge-object' | 'concat-array' | 'custom-script' | 'select-specific'
  finalProcessingScript?: string
  selectedDataItemIndex?: number
  finalProcessingConfig?: Record<string, any>
}

/**
 * 完整数据源配置
 */
export interface DataSourceConfiguration {
  rawDataList: RawDataItem[]
  finalProcessingType: DataProcessingConfig['finalProcessingType']
  finalProcessingScript?: string
  selectedDataItemIndex?: number
  finalProcessingConfig?: Record<string, any>
}

/**
 * 数据源配置包装
 */
export interface DataSourceConfig {
  dataSourceKey: string
  configuration: DataSourceConfiguration
  version?: string
  exportTime?: string
  metadata?: Record<string, any>
  currentData?: any
}

/**
 * 单个数据源完整配置（v2.0.0格式中的数据源定义）
 */
export interface SingleDataSourceConfig {
  name: string
  fieldsToMap?: Array<{
    sourceProperty: string
    targetProperty: string
    description?: string
  }>
  configuration: DataSourceConfiguration
  currentData?: any
}

/**
 * 多数据源配置（v2.0.0完整配置格式）
 */
export interface MultiDataSourceConfig {
  version: '2.0.0'
  exportTime: string
  dataSources: Record<string, SingleDataSourceConfig>
  systemConfig?: {
    features?: string[]
    configVersion?: string
    lastUpdateTime?: string
  }
}

// ================== 执行状态类型 ==================

/**
 * 原始数据执行结果
 */
export interface RawDataResult {
  id: string
  name: string
  type: string
  success: boolean
  data: any
  error?: string
  timestamp: string
  duration?: number
  retryCount?: number
}

/**
 * 执行统计信息
 */
export interface ExecutionStats {
  totalSources: number
  successfulSources: number
  failedSources: number
  averageDuration: number
  totalDuration: number
}

/**
 * 执行状态
 */
export interface ExecutionState {
  isExecuting: boolean
  lastExecuteTime: string | null
  lastError: string | null
  executionCount: number
  rawDataResults: RawDataResult[]
  finalResult: any
  finalProcessingSuccess: boolean
  stats?: ExecutionStats
}

/**
 * 多数据源执行状态
 */
export interface MultiDataSourceExecutionState {
  isExecuting: boolean
  lastExecuteTime: string | null
  lastError: string | null
  executionCount: number

  // 各数据源的执行状态
  dataSourceStates: Record<string, ExecutionState>

  // 合并后的最终结果
  finalResults: Record<string, any>

  // 总体统计
  overallStats: {
    totalDataSources: number
    successfulDataSources: number
    failedDataSources: number
    averageDuration: number
    totalDuration: number
  }

  // 并行执行状态
  parallelExecution: boolean
  completedDataSources: string[]
  failedDataSources: string[]
}

// ================== 依赖和规则类型 ==================

/**
 * 依赖规则
 */
export interface DependencyRule {
  sourceDataId: string // 依赖的原始数据ID
  required: boolean // 是否必需
  blockOnFailure: boolean // 失败时是否阻塞后续执行
  description?: string // 规则描述
}

/**
 * 依赖检查结果
 */
export interface DependencyCheckResult {
  canProceed: boolean
  reason?: string
  failedDependencies?: string[]
  blockedSources?: string[]
}

/**
 * 错误处理策略
 */
export interface ErrorHandlingStrategy {
  tolerant: boolean // 是否容忍错误继续执行
  retryPolicy: {
    enabled: boolean
    maxRetries: number
    retryDelay: number
    exponentialBackoff: boolean
  }
  fallbackData?: any // 错误时的后备数据
}

// ================== 触发器类型 ==================

/**
 * 触发器类型
 */
export type TriggerType = 'manual' | 'timer' | 'event' | 'config-change' | 'data-change'

/**
 * 定时器触发配置
 */
export interface TimerTriggerConfig {
  interval: number // 间隔时间（毫秒）
  immediate: boolean // 是否立即执行一次
  maxExecutions?: number // 最大执行次数
  enabled: boolean // 是否启用
}

/**
 * 事件触发配置
 */
export interface EventTriggerConfig {
  eventName: string // 事件名称
  eventSource?: string // 事件源
  eventFilter?: string // 事件过滤条件
  debounceTime?: number // 防抖时间
  enabled: boolean
}

/**
 * 配置变更触发配置
 */
export interface ConfigChangeTriggerConfig {
  watchPaths: string[] // 监听的配置路径
  debounceTime: number // 防抖时间
  excludePaths?: string[] // 排除的路径
  enabled: boolean
}

/**
 * 触发器配置
 */
export interface TriggerConfig {
  id: string
  name: string
  type: TriggerType
  enabled: boolean
  timerConfig?: TimerTriggerConfig
  eventConfig?: EventTriggerConfig
  configChangeConfig?: ConfigChangeTriggerConfig
  description?: string
}

/**
 * 触发器状态
 */
export interface TriggerState {
  id: string
  type: TriggerType
  isActive: boolean
  lastTriggerTime: string | null
  triggerCount: number
  errorCount: number
  lastError?: string
}

// ================== 执行器接口 ==================

/**
 * 数据源执行器接口
 */
export interface IDataSourceExecutor {
  // 配置管理
  loadConfig(config: DataSourceConfig): void
  getConfig(): DataSourceConfig | null

  // 执行方法
  executeAll(): Promise<ExecutionState>
  executeDataSource(dataSourceId: string): Promise<any>
  executeFinalProcessing(): Promise<any>

  // 状态获取
  getExecutionState(): ExecutionState
  getFinalResult(): any
  getRawDataResults(): RawDataResult[]

  // 规则配置
  setDependencyRules(rules: DependencyRule[]): void
  setErrorHandlingStrategy(strategy: ErrorHandlingStrategy): void

  // 生命周期
  destroy(): void
}

/**
 * 多数据源执行器接口
 */
export interface IMultiDataSourceExecutor {
  // 配置管理
  loadConfig(config: MultiDataSourceConfig): void
  getConfig(): MultiDataSourceConfig | null

  // 执行方法
  executeAll(): Promise<MultiDataSourceExecutionState>
  executeDataSource(dataSourceKey: string): Promise<any>

  // 状态获取
  getExecutionState(): MultiDataSourceExecutionState
  getFinalResults(): Record<string, any>
  getDataSourceState(dataSourceKey: string): ExecutionState | null

  // 并行控制
  setParallelExecution(enabled: boolean): void
  isParallelExecution(): boolean

  // 错误处理
  setErrorHandlingStrategy(strategy: ErrorHandlingStrategy): void

  // 生命周期
  destroy(): void
}

/**
 * 触发器接口
 */
export interface IDataSourceTrigger {
  // 触发器管理
  addTrigger(config: TriggerConfig): string
  removeTrigger(triggerId: string): boolean
  updateTrigger(triggerId: string, config: Partial<TriggerConfig>): boolean

  // 触发器控制
  enableTrigger(triggerId: string): boolean
  disableTrigger(triggerId: string): boolean
  enableAllTriggers(): void
  disableAllTriggers(): void

  // 手动触发
  trigger(triggerId?: string): Promise<void>

  // 状态获取
  getTriggerStates(): TriggerState[]
  getTriggerState(triggerId: string): TriggerState | null

  // 事件系统
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void

  // 生命周期
  destroy(): void
}

// ================== 事件类型 ==================

/**
 * 执行事件类型
 */
export interface ExecutionEvent {
  type: 'execution-start' | 'execution-complete' | 'execution-error' | 'data-source-complete' | 'data-source-error'
  timestamp: string
  executorId?: string
  dataSourceId?: string
  data?: any
  error?: string
}

/**
 * 触发事件类型
 */
export interface TriggerEvent {
  type: 'trigger-fired' | 'trigger-added' | 'trigger-removed' | 'trigger-enabled' | 'trigger-disabled'
  timestamp: string
  triggerId: string
  triggerType: TriggerType
  data?: any
}

/**
 * 配置变更事件类型
 */
export interface ConfigChangeEvent {
  type: 'config-loaded' | 'config-updated' | 'config-reset'
  timestamp: string
  path?: string
  oldValue?: any
  newValue?: any
  source?: string
}

// ================== 工具类型 ==================

/**
 * 执行选项
 */
export interface ExecutionOptions {
  timeout?: number
  retries?: number
  parallel?: boolean
  continueOnError?: boolean
  skipDependencyCheck?: boolean
}

/**
 * 导出选项
 */
export interface ExportOptions {
  format: 'json' | 'yaml' | 'xml'
  includeMetadata: boolean
  includeResults: boolean
  compressData: boolean
}

/**
 * 导入选项
 */
export interface ImportOptions {
  validateConfig: boolean
  mergeMode: 'replace' | 'merge' | 'append'
  skipInvalid: boolean
}

/**
 * 性能监控数据
 */
export interface PerformanceMetrics {
  executionTime: number
  memoryUsage: number
  cpuUsage?: number
  networkRequests: number
  cacheHits: number
  cacheMisses: number
}

// ================== 响应式类型 ==================

/**
 * 响应式执行器状态
 */
export interface ReactiveExecutorState {
  config: DataSourceConfig | null
  state: ExecutionState
  isConfigured: boolean
  canExecute: boolean
  hasErrors: boolean
  metrics: PerformanceMetrics
}

/**
 * 响应式触发器状态
 */
export interface ReactiveTriggerState {
  triggers: TriggerConfig[]
  states: TriggerState[]
  activeTriggerCount: number
  totalTriggerCount: number
  isAnyActive: boolean
}
