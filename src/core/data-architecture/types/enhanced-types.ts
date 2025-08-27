/**
 * 增强版数据架构类型定义
 * 基于现有架构扩展，保持向后兼容性
 *
 * 设计目标：
 * 1. 泛型化数据项配置，支持扩展
 * 2. 保持现有类型系统100%兼容
 * 3. 为动态参数系统预留接口
 * 4. 支持配置版本管理和自动适配
 */

// ==================== 基础类型导入 ====================
import type {
  DataItem as LegacyDataItem,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig,
  WebSocketDataItemConfig,
  ScriptDataItemConfig
} from '../executors/DataItemFetcher'

import type { ProcessingConfig } from '../executors/DataItemProcessor'

import type { MergeStrategy } from '../executors/DataSourceMerger'

import type {
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  ExecutionResult
} from '../executors/MultiLayerExecutorChain'

// ==================== 泛型化数据项配置 ====================

/**
 * 泛型化数据项配置基础接口
 * 支持任意类型的配置结构扩展
 */
export interface DataItemConfig<T = any> {
  /** 数据项类型标识 */
  type: string

  /** 数据项唯一标识符 */
  id: string

  /** 类型特定的配置参数 */
  config: T

  /** 数据处理配置（复用现有ProcessingConfig） */
  processing?: ProcessingConfig

  /** 数据项元数据 */
  metadata?: DataItemMetadata
}

/**
 * 数据项元数据接口
 * 用于存储额外的配置信息和状态
 */
export interface DataItemMetadata {
  /** 数据项显示名称 */
  displayName?: string

  /** 数据项描述 */
  description?: string

  /** 创建时间 */
  createdAt?: number

  /** 最后更新时间 */
  lastUpdated?: number

  /** 数据项启用状态 */
  enabled?: boolean

  /** 自定义标签 */
  tags?: string[]
}

// ==================== 具体数据项类型实现 ====================

/**
 * JSON数据项配置（增强版）
 * 保持与现有JsonDataItemConfig的兼容性
 */
export interface EnhancedJsonDataItemConfig {
  /** JSON数据内容 */
  jsonData: string

  /** 数据验证选项 */
  validation?: {
    /** 是否启用JSON格式验证 */
    enableFormat: boolean
    /** 是否启用数据结构验证 */
    enableStructure: boolean
    /** JSON Schema（可选） */
    schema?: any
  }

  /** 数据预处理选项 */
  preprocessing?: {
    /** 是否去除注释 */
    removeComments: boolean
    /** 是否格式化输出 */
    formatOutput: boolean
  }
}

/**
 * HTTP数据项配置（增强版）
 * 为动态参数系统预留扩展接口
 */
export interface EnhancedHttpDataItemConfig {
  /** 请求URL（支持模板语法 {{paramName}}） */
  url: string

  /** HTTP请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 请求头配置（数组格式，支持动态参数） */
  headers: HttpHeader[]

  /** URL参数配置（新增，支持动态参数） */
  params: HttpParam[]

  /** 请求体配置 */
  body?: HttpBody

  /** 请求超时时间（毫秒） */
  timeout?: number

  /** 请求前脚本（预留） */
  preRequestScript?: string

  /** 响应后脚本（预留） */
  responseScript?: string

  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number
    /** 重试间隔（毫秒） */
    retryDelay: number
  }
}

/**
 * HTTP头部配置
 */
export interface HttpHeader {
  /** 头部字段名 */
  key: string

  /** 头部字段值 */
  value: string

  /** 是否启用此头部 */
  enabled: boolean

  /** 是否为动态参数（预留） */
  isDynamic?: boolean

  /** 动态参数名称（预留） */
  dynamicName?: string

  /** 示例值（用于测试和文档） */
  exampleValue?: string
}

/**
 * HTTP参数配置
 */
export interface HttpParam {
  /** 参数名 */
  key: string

  /** 参数值 */
  value: string

  /** 是否启用此参数 */
  enabled: boolean

  /** 是否为动态参数（预留） */
  isDynamic?: boolean

  /** 动态参数名称（预留） */
  dynamicName?: string

  /** 示例值（用于测试和文档） */
  exampleValue?: string
}

/**
 * HTTP请求体配置
 */
export interface HttpBody {
  /** 请求体类型 */
  type: 'json' | 'form' | 'text' | 'binary'

  /** 请求体内容 */
  content: any

  /** 内容类型 */
  contentType?: string
}

// ==================== 动态参数系统（预留） ====================

/**
 * 动态参数定义（预留接口）
 * 用于HTTP动态参数系统
 */
export interface DynamicParam {
  /** 参数名称 */
  name: string

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object'

  /** 当前参数值 */
  currentValue: any

  /** 示例值 */
  exampleValue?: any

  /** 参数描述 */
  description?: string

  /** 是否必填参数 */
  required?: boolean

  /** 参数验证规则 */
  validation?: {
    /** 最小值/最小长度 */
    min?: number
    /** 最大值/最大长度 */
    max?: number
    /** 正则表达式 */
    pattern?: string
    /** 枚举值 */
    enum?: any[]
  }
}

// ==================== 增强版配置系统 ====================

/**
 * 增强版数据源配置
 * 继承现有配置，增加版本管理和动态参数支持
 */
export interface EnhancedDataSourceConfiguration extends LegacyDataSourceConfiguration {
  /** 配置版本标识 */
  version: string

  /** 动态参数定义（预留） */
  dynamicParams?: DynamicParam[]

  /** 增强功能开关 */
  enhancedFeatures?: EnhancedFeatureFlags

  /** 配置元数据 */
  metadata?: ConfigurationMetadata
}

/**
 * 增强功能开关
 */
export interface EnhancedFeatureFlags {
  /** 启用HTTP数组格式 */
  httpArrayFormat: boolean

  /** 启用动态参数支持 */
  dynamicParameterSupport: boolean

  /** 启用安全脚本执行 */
  secureScriptExecution: boolean

  /** 启用配置验证 */
  configurationValidation: boolean

  /** 启用性能监控 */
  performanceMonitoring: boolean
}

/**
 * 配置元数据
 */
export interface ConfigurationMetadata {
  /** 配置名称 */
  name?: string

  /** 配置描述 */
  description?: string

  /** 配置创建者 */
  author?: string

  /** 配置版本历史 */
  versionHistory?: ConfigurationVersion[]

  /** 配置标签 */
  tags?: string[]
}

/**
 * 配置版本信息
 */
export interface ConfigurationVersion {
  /** 版本号 */
  version: string

  /** 变更时间 */
  timestamp: number

  /** 变更说明 */
  changelog: string

  /** 变更作者 */
  author?: string
}

// ==================== 配置适配器系统 ====================

/**
 * 配置版本适配器
 * 处理新旧配置格式的自动转换
 */
export interface ConfigurationAdapter {
  /**
   * 检测配置版本
   * @param config 配置对象
   * @returns 版本标识
   */
  detectVersion(config: any): 'v1.0' | 'v2.0'

  /**
   * 适配配置到指定版本
   * @param config 源配置
   * @param targetVersion 目标版本
   * @returns 适配后的配置
   */
  adaptToVersion(config: any, targetVersion: 'v1.0' | 'v2.0'): any

  /**
   * v1升级到v2（无损升级）
   * @param v1Config v1格式配置
   * @returns v2格式配置
   */
  upgradeV1ToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration

  /**
   * v2降级到v1（功能裁剪）
   * @param v2Config v2格式配置
   * @returns v1格式配置
   */
  downgradeV2ToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration
}

// ==================== 类型工具和辅助函数 ====================

/**
 * 类型守卫：检查是否为增强版配置
 */
export function isEnhancedConfiguration(config: any): config is EnhancedDataSourceConfiguration {
  return config && typeof config.version === 'string' && config.version.startsWith('2.')
}

/**
 * 类型守卫：检查是否为泛型数据项配置
 */
export function isGenericDataItemConfig(item: any): item is DataItemConfig {
  return item && typeof item.type === 'string' && typeof item.id === 'string' && item.config
}

/**
 * 类型守卫：检查是否为增强版HTTP配置
 */
export function isEnhancedHttpConfig(config: any): config is EnhancedHttpDataItemConfig {
  return config && Array.isArray(config.headers) && Array.isArray(config.params)
}

// ==================== 向后兼容性保证 ====================

/**
 * 配置类型版本枚举
 */
export enum ConfigurationVersionEnum {
  V1_0 = 'v1.0',
  V2_0 = 'v2.0'
}

/**
 * 默认的增强功能开关配置
 */
export const DEFAULT_ENHANCED_FEATURES: EnhancedFeatureFlags = {
  httpArrayFormat: true,
  dynamicParameterSupport: true,
  secureScriptExecution: true,
  configurationValidation: true,
  performanceMonitoring: true
}

// ==================== 导出汇总 ====================

export type {
  // 泛型配置类型
  DataItemConfig,
  DataItemMetadata,

  // 具体数据项类型
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  HttpHeader,
  HttpParam,
  HttpBody,

  // 动态参数系统
  DynamicParam,

  // 增强配置系统
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,

  // 适配器系统
  ConfigurationAdapter
}
