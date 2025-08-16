/**
 * 数据源配置系统类型定义
 */

import type { DataSourceSystemConfig, TriggerConfig, ProcessorConfig, MappingConfig } from '../executor/types'

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否验证通过 */
  valid: boolean

  /** 错误信息 */
  errors: ConfigValidationError[]

  /** 警告信息 */
  warnings: ConfigValidationWarning[]

  /** 验证详情 */
  details?: Record<string, any>
}

/**
 * 配置验证错误
 */
export interface ConfigValidationError {
  /** 错误字段路径 */
  field: string

  /** 错误代码 */
  code: string

  /** 错误消息 */
  message: string

  /** 错误值 */
  value?: any
}

/**
 * 配置验证警告
 */
export interface ConfigValidationWarning {
  /** 警告字段路径 */
  field: string

  /** 警告代码 */
  code: string

  /** 警告消息 */
  message: string

  /** 警告值 */
  value?: any
}

/**
 * 配置管理器事件
 */
export interface ConfigManagerEvents {
  /** 配置创建事件 */
  'config:created': { config: DataSourceSystemConfig }

  /** 配置更新事件 */
  'config:updated': { id: string; oldConfig: DataSourceSystemConfig; newConfig: DataSourceSystemConfig }

  /** 配置删除事件 */
  'config:deleted': { id: string; config: DataSourceSystemConfig }

  /** 配置导入事件 */
  'config:imported': { configs: DataSourceSystemConfig[] }

  /** 配置导出事件 */
  'config:exported': { configs: DataSourceSystemConfig[] }

  /** 配置验证事件 */
  'config:validated': { id: string; result: ConfigValidationResult }
}

/**
 * 配置存储接口
 */
export interface ConfigStorage {
  /** 获取所有配置 */
  getAll(): Promise<DataSourceSystemConfig[]>

  /** 根据ID获取配置 */
  get(id: string): Promise<DataSourceSystemConfig | null>

  /** 保存配置 */
  save(config: DataSourceSystemConfig): Promise<void>

  /** 删除配置 */
  delete(id: string): Promise<boolean>

  /** 批量保存配置 */
  saveBatch(configs: DataSourceSystemConfig[]): Promise<void>

  /** 清空所有配置 */
  clear(): Promise<void>
}

/**
 * 本地存储实现
 */
export interface LocalStorageConfig {
  /** 存储键名 */
  key: string

  /** 是否启用压缩 */
  compression?: boolean

  /** 最大存储大小（字节） */
  maxSize?: number

  /** 是否启用备份 */
  backup?: boolean
}

/**
 * 配置模板定义
 */
export interface ConfigTemplate {
  /** 模板ID */
  id: string

  /** 模板名称 */
  name: string

  /** 模板描述 */
  description: string

  /** 模板分类 */
  category: 'basic' | 'advanced' | 'integration' | 'custom'

  /** 数据源类型 */
  sourceType: 'static' | 'api' | 'websocket' | 'script'

  /** 模板配置 */
  template: Partial<DataSourceSystemConfig>

  /** 模板参数 */
  parameters?: ConfigTemplateParameter[]

  /** 是否为系统模板 */
  isSystem?: boolean

  /** 创建时间 */
  createdAt: number
}

/**
 * 配置模板参数
 */
export interface ConfigTemplateParameter {
  /** 参数名称 */
  name: string

  /** 参数标签 */
  label: string

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'

  /** 参数描述 */
  description?: string

  /** 默认值 */
  defaultValue?: any

  /** 是否必填 */
  required?: boolean

  /** 验证规则 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: any[]
  }
}

/**
 * 配置导入导出选项
 */
export interface ImportExportOptions {
  /** 是否包含元数据 */
  includeMetadata?: boolean

  /** 是否压缩 */
  compress?: boolean

  /** 导出格式 */
  format?: 'json' | 'yaml' | 'xml'

  /** 是否加密 */
  encrypt?: boolean

  /** 加密密钥 */
  encryptionKey?: string

  /** 过滤条件 */
  filter?: {
    types?: string[]
    tags?: string[]
    dateRange?: {
      start: number
      end: number
    }
  }
}

/**
 * 配置迁移规则
 */
export interface ConfigMigrationRule {
  /** 源版本 */
  fromVersion: string

  /** 目标版本 */
  toVersion: string

  /** 迁移描述 */
  description: string

  /** 迁移函数 */
  migrate: (oldConfig: any) => DataSourceSystemConfig

  /** 验证函数 */
  validate?: (config: DataSourceSystemConfig) => boolean
}

/**
 * 配置搜索选项
 */
export interface ConfigSearchOptions {
  /** 搜索关键词 */
  keyword?: string

  /** 搜索字段 */
  fields?: ('name' | 'description' | 'type')[]

  /** 数据源类型过滤 */
  types?: string[]

  /** 标签过滤 */
  tags?: string[]

  /** 创建时间范围 */
  dateRange?: {
    start: number
    end: number
  }

  /** 排序方式 */
  sortBy?: 'name' | 'type' | 'createdAt' | 'updatedAt'

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'

  /** 分页选项 */
  pagination?: {
    page: number
    pageSize: number
  }
}

/**
 * 配置搜索结果
 */
export interface ConfigSearchResult {
  /** 匹配的配置列表 */
  configs: DataSourceSystemConfig[]

  /** 总数量 */
  total: number

  /** 当前页 */
  page: number

  /** 页大小 */
  pageSize: number

  /** 总页数 */
  totalPages: number

  /** 搜索耗时（毫秒） */
  searchTime: number
}

/**
 * 配置统计信息
 */
export interface ConfigStatistics {
  /** 总配置数 */
  total: number

  /** 按类型分组的统计 */
  byType: Record<string, number>

  /** 按创建日期分组的统计 */
  byDate: Record<string, number>

  /** 最近创建的配置 */
  recentlyCreated: DataSourceSystemConfig[]

  /** 最近更新的配置 */
  recentlyUpdated: DataSourceSystemConfig[]

  /** 最常用的配置 */
  mostUsed: Array<{
    config: DataSourceSystemConfig
    usageCount: number
  }>
}

/**
 * 配置预设
 */
export interface ConfigPreset {
  /** 预设ID */
  id: string

  /** 预设名称 */
  name: string

  /** 预设描述 */
  description: string

  /** 预设分类 */
  category: string

  /** 预设配置 */
  config: Partial<DataSourceSystemConfig>

  /** 是否为系统预设 */
  isSystem: boolean

  /** 创建时间 */
  createdAt: number

  /** 使用次数 */
  usageCount?: number
}

/**
 * 配置差异对比结果
 */
export interface ConfigDiff {
  /** 差异类型 */
  type: 'added' | 'removed' | 'modified'

  /** 字段路径 */
  path: string

  /** 旧值 */
  oldValue?: any

  /** 新值 */
  newValue?: any

  /** 差异描述 */
  description: string
}

/**
 * 配置版本信息
 */
export interface ConfigVersion {
  /** 版本号 */
  version: string

  /** 配置ID */
  configId: string

  /** 配置快照 */
  snapshot: DataSourceSystemConfig

  /** 创建时间 */
  createdAt: number

  /** 创建者 */
  createdBy?: string

  /** 版本描述 */
  description?: string

  /** 是否为当前版本 */
  isCurrent?: boolean
}
