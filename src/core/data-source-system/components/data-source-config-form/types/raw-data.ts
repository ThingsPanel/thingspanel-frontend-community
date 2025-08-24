/**
 * 原始数据相关类型定义
 * 基于DataSourceConfigForm copy.vue中的原始数据管理功能分析
 */

import type { HttpDataSourceConfig } from './http-config'
import type { WebSocketDataSourceConfig } from './websocket-config'

// 原始数据项类型枚举
export type RawDataItemType = 'json' | 'http' | 'websocket'

// 数据处理状态
export type DataProcessingStatus = 'pending' | 'processing' | 'success' | 'error' | 'cancelled'

// 数据验证结果
export interface DataValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 数据类型 */
  dataType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'
  /** 错误信息 */
  errors: Array<{
    path: string
    message: string
    code: string
  }>
  /** 警告信息 */
  warnings: Array<{
    path: string
    message: string
    code: string
  }>
  /** 数据统计 */
  stats: {
    /** 对象键数量 */
    keyCount?: number
    /** 数组长度 */
    arrayLength?: number
    /** 嵌套层级深度 */
    depth: number
    /** 数据大小（字节） */
    sizeBytes: number
  }
}

// JSON数据配置
export interface JsonDataConfig {
  /** JSON字符串内容 */
  content: string
  /** 格式化选项 */
  formatting: {
    /** 缩进大小 */
    indent: number
    /** 是否压缩显示 */
    compact: boolean
  }
  /** 验证结果 */
  validation: DataValidationResult
}

// 数据过滤配置
export interface DataFilterConfig {
  /** 是否启用过滤 */
  enabled: boolean
  /** JSONPath过滤路径 */
  path: string
  /** 过滤器类型 */
  type: 'jsonpath' | 'jq' | 'custom'
  /** 自定义过滤脚本 */
  customScript?: string
  /** 过滤结果预览 */
  preview?: any
}

// 数据处理脚本配置
export interface DataProcessScriptConfig {
  /** 是否启用脚本处理 */
  enabled: boolean
  /** 脚本语言类型 */
  language: 'javascript' | 'typescript'
  /** 脚本内容 */
  content: string
  /** 脚本模板类型 */
  templateType: 'custom' | 'transform' | 'aggregate' | 'filter' | 'validate'
  /** 脚本执行结果 */
  executionResult?: {
    success: boolean
    data?: any
    error?: string
    duration: number
    timestamp: number
  }
}

// 原始数据处理配置
export interface RawDataProcessingConfig {
  /** 数据过滤配置 */
  filter: DataFilterConfig
  /** 数据处理脚本配置 */
  script: DataProcessScriptConfig
  /** 处理顺序：先过滤后脚本处理 */
  processingOrder: ('filter' | 'script')[]
}

// 原始数据项状态
export interface RawDataItemStatus {
  /** 处理状态 */
  processing: DataProcessingStatus
  /** 最后更新时间 */
  lastUpdateTime: number
  /** 最后成功时间 */
  lastSuccessTime?: number
  /** 错误次数 */
  errorCount: number
  /** 最后错误信息 */
  lastError?: string
  /** 数据统计 */
  stats: {
    /** 总执行次数 */
    totalExecutions: number
    /** 成功次数 */
    successCount: number
    /** 平均处理时间（毫秒） */
    averageProcessTime: number
  }
}

// 完整的原始数据项接口
export interface RawDataItem {
  /** 数据项唯一标识 */
  id: string
  /** 数据项名称 */
  name: string
  /** 数据项描述 */
  description?: string
  /** 数据类型 */
  type: RawDataItemType
  /** 是否激活 */
  isActive: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string

  /** 类型特定的数据配置 */
  config: {
    /** JSON数据配置 */
    json?: JsonDataConfig
    /** HTTP数据配置 */
    http?: HttpDataSourceConfig
    /** WebSocket数据配置 */
    websocket?: WebSocketDataSourceConfig
  }

  /** 数据处理配置 */
  processing: RawDataProcessingConfig

  /** 当前数据内容 */
  currentData: any

  /** 处理后的数据 */
  processedData: any

  /** 数据项状态 */
  status: RawDataItemStatus

  /** 扩展字段 */
  metadata?: Record<string, any>
}

// 原始数据列表状态
export interface RawDataListState {
  /** 数据项列表 */
  items: RawDataItem[]
  /** 选中的数据项ID */
  selectedItemIds: string[]
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error?: string
  /** 搜索关键词 */
  searchKeyword: string
  /** 过滤器 */
  filters: {
    /** 按类型过滤 */
    type?: RawDataItemType
    /** 按状态过滤 */
    status?: DataProcessingStatus
    /** 按激活状态过滤 */
    active?: boolean
  }
  /** 排序配置 */
  sorting: {
    /** 排序字段 */
    field: 'name' | 'type' | 'createdAt' | 'lastUpdateTime'
    /** 排序方向 */
    direction: 'asc' | 'desc'
  }
}

// 原始数据操作类型
export type RawDataOperation = 'create' | 'update' | 'delete' | 'duplicate' | 'export' | 'import'

// 原始数据操作结果
export interface RawDataOperationResult {
  /** 操作是否成功 */
  success: boolean
  /** 操作类型 */
  operation: RawDataOperation
  /** 受影响的数据项ID */
  itemId?: string
  /** 错误信息 */
  error?: string
  /** 操作耗时（毫秒） */
  duration: number
  /** 操作结果数据 */
  data?: any
}

// 数据预览配置
export interface DataPreviewConfig {
  /** 是否显示原始数据 */
  showRawData: boolean
  /** 是否显示处理后数据 */
  showProcessedData: boolean
  /** 预览数据的最大显示条目数 */
  maxItems: number
  /** 预览数据的最大深度 */
  maxDepth: number
  /** 是否格式化显示 */
  formatted: boolean
  /** 显示模式 */
  displayMode: 'json' | 'table' | 'tree'
}

// 数据导出配置
export interface DataExportConfig {
  /** 导出格式 */
  format: 'json' | 'csv' | 'xlsx' | 'xml'
  /** 是否导出配置 */
  includeConfig: boolean
  /** 是否导出历史数据 */
  includeHistory: boolean
  /** 文件命名规则 */
  fileNaming: {
    prefix?: string
    includeTimestamp: boolean
    includeDataSourceName: boolean
  }
}

// 数据导入配置
export interface DataImportConfig {
  /** 导入格式 */
  format: 'json' | 'csv' | 'xlsx'
  /** 是否覆盖已存在的数据项 */
  overwriteExisting: boolean
  /** 字段映射配置 */
  fieldMapping: Record<string, string>
  /** 数据验证规则 */
  validationRules: Array<{
    field: string
    rule: 'required' | 'type' | 'format'
    value: any
  }>
}

// 批量操作配置
export interface BatchOperationConfig {
  /** 操作类型 */
  operation: RawDataOperation
  /** 目标数据项ID列表 */
  targetItemIds: string[]
  /** 操作参数 */
  parameters: Record<string, any>
  /** 是否并行执行 */
  parallel: boolean
  /** 失败时是否继续 */
  continueOnError: boolean
}

// 原始数据管理器接口
export interface RawDataManager {
  /** 获取数据项列表 */
  getItems: () => RawDataItem[]
  /** 根据ID获取数据项 */
  getItemById: (id: string) => RawDataItem | undefined
  /** 创建新数据项 */
  createItem: (item: Omit<RawDataItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RawDataOperationResult>
  /** 更新数据项 */
  updateItem: (id: string, updates: Partial<RawDataItem>) => Promise<RawDataOperationResult>
  /** 删除数据项 */
  deleteItem: (id: string) => Promise<RawDataOperationResult>
  /** 执行批量操作 */
  batchOperation: (config: BatchOperationConfig) => Promise<RawDataOperationResult[]>
  /** 导出数据 */
  exportData: (config: DataExportConfig, itemIds?: string[]) => Promise<Blob>
  /** 导入数据 */
  importData: (file: File, config: DataImportConfig) => Promise<RawDataOperationResult[]>
}
