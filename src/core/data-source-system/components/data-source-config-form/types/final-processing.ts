/**
 * 最终数据处理相关类型定义
 * 基于DataSourceConfigForm copy.vue中的最终处理功能分析
 */

import type { RawDataItem } from './raw-data'

// 最终处理类型枚举
export type FinalProcessingType =
  | 'merge-object' // 对象合并（多个对象合并成一个大对象）
  | 'concat-array' // 数组连接（多个数组连接起来）
  | 'custom-script' // 自定义脚本（完全自定义处理逻辑）
  | 'select-specific' // 选择特定数据项（从多个数据项中选择一个）

// 处理状态类型
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error' | 'cancelled'

// 对象合并配置
export interface MergeObjectConfig {
  /** 合并策略 */
  strategy: 'shallow' | 'deep' | 'custom'
  /** 冲突处理方式 */
  conflictResolution: 'first-wins' | 'last-wins' | 'merge-arrays' | 'custom'
  /** 自定义合并函数 */
  customMerger?: string // JavaScript函数代码
  /** 是否保留空值 */
  keepEmptyValues: boolean
  /** 键名前缀映射 */
  keyPrefixMapping?: Record<string, string>
}

// 数组连接配置
export interface ConcatArrayConfig {
  /** 是否去重 */
  deduplicate: boolean
  /** 去重字段（对于对象数组） */
  deduplicateBy?: string[]
  /** 排序配置 */
  sorting?: {
    enabled: boolean
    field?: string
    order: 'asc' | 'desc'
    customComparator?: string // JavaScript函数代码
  }
  /** 最大长度限制 */
  maxLength?: number
  /** 是否扁平化嵌套数组 */
  flatten: boolean
}

// 脚本执行环境
export interface ScriptExecutionEnvironment {
  /** 可用的全局变量 */
  globals: Record<string, any>
  /** 可用的工具函数 */
  utilities: {
    /** 日期时间工具 */
    datetime: any
    /** 数学计算工具 */
    math: any
    /** 字符串处理工具 */
    string: any
    /** 数组处理工具 */
    array: any
    /** 对象处理工具 */
    object: any
  }
  /** 执行超时时间（毫秒） */
  timeout: number
  /** 内存限制（字节） */
  memoryLimit: number
}

// 自定义脚本配置
export interface CustomScriptConfig {
  /** 脚本内容 */
  content: string
  /** 脚本语言类型 */
  language: 'javascript' | 'typescript'
  /** 执行环境配置 */
  environment: ScriptExecutionEnvironment
  /** 脚本模板类型 */
  templateType: 'blank' | 'merge' | 'transform' | 'filter' | 'aggregate'
  /** 是否启用调试模式 */
  debugMode: boolean
  /** 输入参数定义 */
  inputSchema?: {
    type: string
    description: string
    properties?: Record<string, any>
  }
  /** 输出结果定义 */
  outputSchema?: {
    type: string
    description: string
    properties?: Record<string, any>
  }
}

// 特定数据项选择配置
export interface SelectSpecificConfig {
  /** 选择策略 */
  strategy: 'by-index' | 'by-id' | 'by-condition' | 'by-priority'
  /** 按索引选择 */
  index?: number
  /** 按ID选择 */
  itemId?: string
  /** 按条件选择 */
  condition?: {
    field: string
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'exists'
    value: any
  }
  /** 按优先级选择 */
  priority?: {
    /** 优先级字段 */
    field: string
    /** 排序方向 */
    order: 'asc' | 'desc'
  }
  /** 备用选择策略 */
  fallback: 'first' | 'last' | 'empty' | 'error'
}

// 处理执行结果
export interface ProcessingExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 处理后的数据 */
  data?: any
  /** 错误信息 */
  error?: {
    message: string
    code: string
    stack?: string
    line?: number
    column?: number
  }
  /** 执行统计 */
  stats: {
    /** 执行时间（毫秒） */
    duration: number
    /** 输入数据大小（字节） */
    inputSize: number
    /** 输出数据大小（字节） */
    outputSize: number
    /** 内存使用峰值（字节） */
    memoryUsage: number
  }
  /** 调试信息 */
  debugInfo?: {
    /** 控制台输出 */
    consoleOutput: string[]
    /** 中间变量快照 */
    variableSnapshots: Record<string, any>
    /** 执行步骤跟踪 */
    executionTrace: string[]
  }
}

// 处理状态信息
export interface ProcessingStatusInfo {
  /** 当前状态 */
  status: ProcessingStatus
  /** 状态描述 */
  message: string
  /** 最后更新时间 */
  lastUpdateTime: number
  /** 最后成功时间 */
  lastSuccessTime?: number
  /** 连续失败次数 */
  consecutiveFailures: number
  /** 执行历史 */
  history: Array<{
    timestamp: number
    status: ProcessingStatus
    duration?: number
    error?: string
  }>
}

// 完整的最终处理配置
export interface FinalProcessingConfig {
  /** 处理类型 */
  type: FinalProcessingType
  /** 是否启用处理 */
  enabled: boolean
  /** 类型特定的配置 */
  config: {
    /** 对象合并配置 */
    mergeObject?: MergeObjectConfig
    /** 数组连接配置 */
    concatArray?: ConcatArrayConfig
    /** 自定义脚本配置 */
    customScript?: CustomScriptConfig
    /** 特定选择配置 */
    selectSpecific?: SelectSpecificConfig
  }
  /** 处理状态信息 */
  statusInfo: ProcessingStatusInfo
  /** 最后执行结果 */
  lastResult?: ProcessingExecutionResult
}

// 数据转换管道阶段
export interface DataTransformPipelineStage {
  /** 阶段名称 */
  name: string
  /** 阶段描述 */
  description?: string
  /** 转换函数 */
  transformer: (data: any, context: any) => any
  /** 是否启用 */
  enabled: boolean
  /** 错误处理策略 */
  errorHandling: 'stop' | 'continue' | 'retry'
  /** 重试配置 */
  retryConfig?: {
    maxRetries: number
    retryInterval: number
  }
}

// 数据转换管道
export interface DataTransformPipeline {
  /** 管道名称 */
  name: string
  /** 管道描述 */
  description?: string
  /** 处理阶段 */
  stages: DataTransformPipelineStage[]
  /** 管道配置 */
  config: {
    /** 是否并行处理 */
    parallel: boolean
    /** 最大并发数 */
    maxConcurrency?: number
    /** 整体超时时间 */
    timeout: number
  }
}

// 预览配置
export interface ProcessingPreviewConfig {
  /** 是否启用实时预览 */
  realTimePreview: boolean
  /** 预览更新间隔（毫秒） */
  updateInterval: number
  /** 预览数据最大大小（字节） */
  maxPreviewSize: number
  /** 预览显示格式 */
  displayFormat: 'json' | 'table' | 'tree' | 'raw'
  /** 显示选项 */
  displayOptions: {
    /** 最大显示层级 */
    maxDepth: number
    /** 是否显示类型信息 */
    showTypes: boolean
    /** 是否显示统计信息 */
    showStats: boolean
  }
}

// 处理器性能监控
export interface ProcessorPerformanceMetrics {
  /** 平均处理时间（毫秒） */
  averageProcessTime: number
  /** 处理次数统计 */
  processCount: {
    total: number
    success: number
    failed: number
  }
  /** 数据大小统计 */
  dataSizeStats: {
    averageInputSize: number
    averageOutputSize: number
    maxInputSize: number
    maxOutputSize: number
  }
  /** 内存使用统计 */
  memoryStats: {
    averageUsage: number
    maxUsage: number
  }
  /** 错误统计 */
  errorStats: Record<string, number>
}

// 最终处理器接口
export interface FinalProcessor {
  /** 处理器ID */
  id: string
  /** 处理器名称 */
  name: string
  /** 处理配置 */
  config: FinalProcessingConfig
  /** 预览配置 */
  previewConfig: ProcessingPreviewConfig
  /** 性能监控 */
  performanceMetrics: ProcessorPerformanceMetrics

  /** 处理方法 */
  process: (rawDataItems: RawDataItem[]) => Promise<ProcessingExecutionResult>
  /** 预览方法 */
  preview: (rawDataItems: RawDataItem[]) => Promise<ProcessingExecutionResult>
  /** 验证配置 */
  validateConfig: () => Promise<{ valid: boolean; errors: string[] }>
  /** 重置状态 */
  reset: () => void
  /** 获取处理历史 */
  getHistory: () => ProcessingStatusInfo['history']
}
