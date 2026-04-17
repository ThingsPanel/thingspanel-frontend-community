/**
 * 数据架构接口定义
 * 明确三个数据层的职责边界，为渐进式重构提供指导
 */

// 编辑器大数据管理
export type {
  IEditorDataManager,
  EditorData,
  EditorDataChangeEvent
} from '@/core/data-architecture/interfaces/IEditorDataManager'

// 组件配置管理
export type {
  IComponentConfigManager,
  WidgetConfiguration,
  ConfigLayer,
  BaseConfig,
  ComponentConfig,
  DataSourceConfig,
  InteractionConfig,
  ConfigChangeEvent,
  ConfigValidationResult
} from './IComponentConfigManager'

// 运行时数据管理
export type {
  IComponentDataManager,
  ComponentDataRequirement,
  DataSourceDefinition,
  DataSourceType,
  DataExecutionResult,
  ComponentDataState,
  DataUpdateEvent
} from './IComponentDataManager'

// 简化数据桥接器 (新架构)
export { SimpleDataBridge, simpleDataBridge, createSimpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

export type {
  SimpleDataSourceConfig,
  DataResult,
  ComponentDataRequirement as SimpleComponentDataRequirement,
  DataUpdateCallback
} from '../SimpleDataBridge'

// 配置转换适配器
export {
  convertToSimpleDataRequirement,
  shouldConvertConfig,
  extractComponentType,
  batchConvertConfigs
} from '../ConfigToSimpleDataAdapter'

// Visual Editor 桥接器
export {
  visualEditorBridge,
  VisualEditorBridge,
  getVisualEditorBridge
} from '@/core/data-architecture/VisualEditorBridge'

/**
 * 数据架构设计原则：
 *
 * 1. **职责分离**：三个数据层各司其职，不互相调用
 *    - EditorDataManager：管理组件树和画布配置
 *    - ComponentConfigManager：管理组件四层配置
 *    - ComponentDataManager：管理运行时数据
 *
 * 2. **事件驱动**：层间通过事件通信，不直接调用方法
 *    - 配置变更 → 发出事件 → 数据层监听并更新
 *    - 数据更新 → 发出事件 → UI层监听并重渲染
 *
 * 3. **简单直接**：避免复杂的状态管理和依赖链
 *    - 不做轮询、连接池等重型功能
 *    - 错误容忍，不阻塞界面
 *    - 缓存策略简单明了
 *
 * 4. **渐进重构**：接口先行，实现逐步替换
 *    - 先定义清晰接口
 *    - 新实现与旧系统并存
 *    - 逐步切换到新架构
 */
