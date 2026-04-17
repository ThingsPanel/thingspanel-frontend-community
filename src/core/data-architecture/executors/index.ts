/**
 * 多层级执行器链导出索引
 * 4层数据处理管道的统一导出入口
 */

// 第一层：数据项获取器
export {
  DataItemFetcher,
  type IDataItemFetcher,
  type DataItem,
  type JsonDataItemConfig,
  type HttpDataItemConfig,
  type WebSocketDataItemConfig,
  type ScriptDataItemConfig
} from './DataItemFetcher'

// 第二层：数据项处理器
export {
  DataItemProcessor,
  type IDataItemProcessor,
  type ProcessingConfig
} from '@/core/data-architecture/executors/DataItemProcessor'

// 第三层：数据源合并器
export {
  DataSourceMerger,
  type IDataSourceMerger,
  type MergeStrategy
} from '@/core/data-architecture/executors/DataSourceMerger'

// 第四层：多源整合器
export {
  MultiSourceIntegrator,
  type IMultiSourceIntegrator,
  type ComponentData,
  type DataSourceResult
} from './MultiSourceIntegrator'

// 主协调类：多层级执行器链
export {
  MultiLayerExecutorChain,
  type IMultiLayerExecutorChain,
  type DataSourceConfiguration,
  type ExecutionState,
  type ExecutionResult
} from './MultiLayerExecutorChain'

// 导入用于工厂函数
import { MultiLayerExecutorChain } from '@/core/data-architecture/executors/MultiLayerExecutorChain'

// 便捷工厂函数
export function createExecutorChain(): MultiLayerExecutorChain {
  return new MultiLayerExecutorChain()
}

// 类型工具
export type AllDataItemTypes = 'json' | 'http' | 'websocket' | 'script'
export type AllMergeStrategyTypes = 'object' | 'array' | 'script'

// 版本信息
export const EXECUTOR_CHAIN_VERSION = '1.0.0'
