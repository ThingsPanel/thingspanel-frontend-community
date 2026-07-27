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
export type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
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

// ==================== 简化数据源系统类型导出 ====================
export type {
  // 组件数据需求
  ComponentDataRequirement,
  StaticParamRequirement,
  DataSourceRequirement,
  FieldRequirement,

  // 数据源配置
  SimpleDataSourceConfig,
  DataSourceDefinition,
  TriggerConfig,
  TriggerConfigData,

  // 用户输入类型
  UserDataSourceInput,
  DataSourceUserConfig,
  StaticDataSourceConfig,
  ApiDataSourceConfig,
  WebSocketDataSourceConfig,
  ScriptDataSourceConfig,

  // 执行结果
  ExecutionResult as SimpleExecutionResult,
  MappingPreviewResult,
  ValidationResult,

  // 组件数据
  ComponentData as SimpleComponentData,
  StandardComponentProps,

  // 兼容性类型
  VisualEditorCompatibleProps,
  Card21CompatibleProps,

  // 工具类型
  DataSourceType,
  FieldType,
  FieldValueType,
  TriggerType,
  ComponentType
} from './simple-types'

// ==================== 类型守卫和工具导出 ====================
export {
  isEnhancedConfiguration,
  isGenericDataItemConfig,
  isEnhancedHttpConfig
} from '@/core/data-architecture/types/enhanced-types'

// ==================== 默认配置导出 ====================
export { DEFAULT_ENHANCED_FEATURES, ConfigurationVersionEnum } from '@/core/data-architecture/types/enhanced-types'

// 简化数据源系统常量
export { SIMPLE_DATA_SOURCE_CONSTANTS, FIELD_TYPE_MAPPING } from '@/core/data-architecture/types/simple-types'

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

export * from '@/core/data-architecture/types/enhanced-types'
export * from '@/core/data-architecture/types/parameter-editor'
