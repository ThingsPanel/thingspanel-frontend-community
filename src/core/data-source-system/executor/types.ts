/**
 * 数据源执行器相关类型定义
 */

// 复用Card2.1现有类型
import type { DataSourceType, UpdateTriggerConfig as Card2UpdateTriggerConfig } from '@/card2.1/core/data-binding/types'

/**
 * 数据源系统配置 - 输出给外部系统使用
 */
export interface DataSourceSystemConfig {
  /** 配置唯一ID */
  id: string

  /** 配置名称 */
  name: string

  /** 配置描述 */
  description?: string

  /** 数据源类型 */
  type: DataSourceType

  /** 数据源特定配置 */
  sourceConfig: any

  /** 触发器配置列表 */
  triggers: TriggerConfig[]

  /** 可选的数据处理器配置 */
  processors?: ProcessorConfig[]

  /** 字段映射配置 */
  mapping?: MappingConfig

  /** 配置元数据 */
  metadata?: {
    createdAt: number
    updatedAt: number
    version: string
    tags?: string[]
    [key: string]: any
  }
}

/**
 * 触发器配置
 */
export interface TriggerConfig {
  /** 触发器类型 */
  type: 'timer' | 'websocket' | 'event' | 'manual'

  /** 触发器配置参数 */
  config: any

  /** 是否启用 */
  enabled?: boolean

  /** 触发器名称 */
  name?: string
}

/**
 * 数据处理器配置
 */
export interface ProcessorConfig {
  /** 处理器类型 */
  type: 'script' | 'format' | 'filter' | 'transform' | 'validate'

  /** 处理器配置参数 */
  config: any

  /** 处理器名称 */
  name?: string

  /** 是否启用 */
  enabled?: boolean
}

/**
 * 字段映射配置
 */
export interface MappingConfig {
  /** 映射规则列表 */
  rules: MappingRule[]

  /** 映射策略 */
  strategy?: 'merge' | 'replace' | 'selective'
}

/**
 * 字段映射规则
 */
export interface MappingRule {
  /** 源数据路径 (支持JSONPath) */
  sourcePath: string

  /** 目标字段名 */
  targetField: string

  /** 映射类型 */
  type: 'direct' | 'calculated' | 'conditional'

  /** 转换函数 (当type为'calculated'时) */
  transformer?: string | ((value: any) => any)

  /** 条件判断 (当type为'conditional'时) */
  condition?: string | ((value: any) => boolean)

  /** 默认值 */
  defaultValue?: any
}

/**
 * 执行结果 - 执行器返回的标准结果格式
 */
export interface ExecutionResult {
  /** 执行是否成功 */
  success: boolean

  /** 返回的数据 */
  data: any

  /** 错误信息（如果失败） */
  error?: Error | string

  /** 执行耗时（毫秒） */
  executionTime: number

  /** 执行时间戳 */
  timestamp: number

  /** 数据源ID */
  sourceId: string

  /** 触发方式 */
  triggeredBy: string

  /** 执行元数据 */
  metadata?: {
    /** 数据源类型 */
    sourceType: DataSourceType

    /** 处理步骤 */
    processingSteps: string[]

    /** 原始数据大小 */
    rawDataSize?: number

    /** 处理后数据大小 */
    processedDataSize?: number

    /** 是否使用缓存 */
    cached?: boolean

    [key: string]: any
  }
}

/**
 * 执行选项
 */
export interface ExecutionOptions {
  /** 超时时间（毫秒） */
  timeout?: number

  /** 是否使用缓存 */
  useCache?: boolean

  /** 缓存有效期（毫秒） */
  cacheTimeout?: number

  /** 重试次数 */
  retryCount?: number

  /** 重试延迟（毫秒） */
  retryDelay?: number

  /** 是否记录性能指标 */
  trackPerformance?: boolean

  /** 自定义上下文数据 */
  context?: Record<string, any>
}

/**
 * 轮询执行配置
 */
export interface PollingConfig {
  /** 轮询间隔（毫秒） */
  interval: number

  /** 是否立即执行第一次 */
  immediate?: boolean

  /** 最大执行次数（0表示无限制） */
  maxExecutions?: number

  /** 错误重试配置 */
  retryOnError?: {
    /** 是否启用重试 */
    enabled: boolean
    /** 最大重试次数 */
    maxRetries: number
    /** 重试延迟（毫秒） */
    delay: number
  }

  /** 轮询条件（返回false停止轮询） */
  condition?: (lastResult?: ExecutionResult) => boolean
}

/**
 * 轮询实例信息
 */
export interface PollingInstance {
  /** 轮询ID */
  id: string

  /** 关联的配置ID */
  configId: string

  /** 轮询配置 */
  config: PollingConfig

  /** 轮询状态 */
  status: 'running' | 'paused' | 'stopped' | 'error'

  /** 开始时间 */
  startTime: number

  /** 执行次数 */
  executionCount: number

  /** 最后执行时间 */
  lastExecutionTime?: number

  /** 最后执行结果 */
  lastResult?: ExecutionResult

  /** 停止轮询的方法 */
  stop: () => void

  /** 暂停轮询的方法 */
  pause: () => void

  /** 恢复轮询的方法 */
  resume: () => void
}

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  /** 总执行次数 */
  totalExecutions: number

  /** 成功执行次数 */
  successfulExecutions: number

  /** 失败执行次数 */
  failedExecutions: number

  /** 平均执行时间（毫秒） */
  averageExecutionTime: number

  /** 最快执行时间（毫秒） */
  fastestExecutionTime: number

  /** 最慢执行时间（毫秒） */
  slowestExecutionTime: number

  /** 最后执行时间 */
  lastExecutionTime?: number

  /** 错误统计 */
  errorStats: Record<string, number>

  /** 数据大小统计 */
  dataSizeStats: {
    min: number
    max: number
    average: number
  }
}

/**
 * 事件类型定义
 */
export interface DataSourceEvents {
  /** 执行开始事件 */
  'execution:start': { configId: string; timestamp: number }

  /** 执行完成事件 */
  'execution:complete': { configId: string; result: ExecutionResult }

  /** 执行失败事件 */
  'execution:error': { configId: string; error: Error }

  /** 轮询开始事件 */
  'polling:start': { configId: string; pollingId: string }

  /** 轮询停止事件 */
  'polling:stop': { configId: string; pollingId: string }

  /** 配置变更事件 */
  'config:change': { configId: string; oldConfig: DataSourceSystemConfig; newConfig: DataSourceSystemConfig }
}
