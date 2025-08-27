/**
 * 数据架构类型系统导出索引
 * 统一导出现有类型和增强版类型
 */

// ==================== 现有类型系统导出 ====================
// 保持现有导出不变，确保向后兼容性
export type {
  // 执行器链类型
  DataItem,
  JsonDataItemConfig,
  HttpDataItemConfig,
  WebSocketDataItemConfig,
  ScriptDataItemConfig,
  ProcessingConfig,
  MergeStrategy,
  DataSourceConfiguration,
  ExecutionState,
  ExecutionResult,

  // 执行器接口
  IDataItemFetcher,
  IDataItemProcessor,
  IDataSourceMerger,
  IMultiSourceIntegrator,
  IMultiLayerExecutorChain,

  // 数据类型
  ComponentData,
  DataSourceResult,
  AllDataItemTypes,
  AllMergeStrategyTypes
} from '../executors'

// ==================== 增强版类型系统导出 ====================
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
} from './enhanced-types'

// ==================== 类型守卫和工具导出 ====================
export { isEnhancedConfiguration, isGenericDataItemConfig, isEnhancedHttpConfig } from './enhanced-types'

// ==================== 默认配置导出 ====================
export { DEFAULT_ENHANCED_FEATURES, ConfigurationVersionEnum } from './enhanced-types'

// ==================== 类型系统版本信息 ====================
export const TYPE_SYSTEM_VERSION = {
  LEGACY: '1.0.0',
  ENHANCED: '2.0.0',
  CURRENT: '2.0.0'
} as const

/**
 * 支持的配置版本列表
 */
export const SUPPORTED_CONFIG_VERSIONS = ['1.0.0', '2.0.0'] as const

/**
 * 类型系统特性标志
 */
export const TYPE_SYSTEM_FEATURES = {
  GENERIC_DATA_ITEMS: true,
  DYNAMIC_PARAMETERS: true,
  HTTP_ARRAY_FORMAT: true,
  VERSION_MANAGEMENT: true,
  BACKWARD_COMPATIBILITY: true
} as const
