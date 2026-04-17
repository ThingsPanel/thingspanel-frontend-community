/**
 * 数据架构核心模块导出
 * 包含多层级执行器链、增强版类型系统和配置适配器
 *
 * 版本说明：
 * - v1.0: 原始执行器链和配置系统
 * - v2.0: 增强版泛型类型系统，支持动态参数和版本管理
 */

// 多层级执行器链 (v1.0)
export * from '@/core/data-architecture/executors'

// 增强版类型系统 (v2.0)
export * from '@/core/data-architecture/types'

// 配置适配器系统
export * from '@/core/data-architecture/adapters'

// 配置生成模块
export * from '@/core/data-architecture/config-generation'

// 便捷功能导出
export {
  ExampleConfigGenerator,
  ExecutorChainUsageExample,
  exampleRunner,
  configGenerator
} from './executors/example-usage'

// 简易配置系统 (SUBTASK-010)
export {
  ConfigurationManager,
  configurationManager,
  type ConfigurationTemplate
} from '@/core/data-architecture/services/ConfigurationManager'

// 简易配置编辑器组件
export { default as SimpleConfigurationEditor } from '@/core/data-architecture/components/SimpleConfigurationEditor.vue'

// 版本信息
export { EXECUTOR_CHAIN_VERSION } from '@/core/data-architecture/executors'
export { TYPE_SYSTEM_VERSION, SUPPORTED_CONFIG_VERSIONS } from '@/core/data-architecture/types'
export { ADAPTER_VERSION } from '@/core/data-architecture/adapters'

// 数据架构系统版本信息
export const DATA_ARCHITECTURE_VERSION = {
  EXECUTORS: '1.0.0', // 执行器链版本
  TYPES: '2.0.0', // 类型系统版本
  ADAPTERS: '1.0.0', // 适配器版本
  OVERALL: '2.0.0' // 整体系统版本
} as const

// 类型重导出
export type {
  // 执行器链相关类型
  DataSourceConfiguration,
  ExecutionState,
  ExecutionResult,
  ComponentData,
  DataItem,
  MergeStrategy,
  ProcessingConfig,

  // 通用类型
  AllDataItemTypes,
  AllMergeStrategyTypes
} from './executors'

// 原有核心组件 (仅在需要时导出)
// export { UnifiedDataExecutor } from '@/core/data-architecture/UnifiedDataExecutor'
