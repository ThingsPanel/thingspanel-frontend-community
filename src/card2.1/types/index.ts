/**
 * Card2.1 统一类型导出
 * 提供所有Card2.1系统相关的类型定义
 */

// 核心类型
export * from '../core/types'
export * from '../core/config-types'
export * from '../core/interaction-types'
export * from '../core/data-binding/types'

// 设置配置类型
export * from './setting-config'
export * from './interaction-component'

// 重新导出常用类型以简化导入
export type {
  // 组件定义相关
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  ComponentPermission,
  
  // 配置相关
  CustomConfig,
  Setting,
  DataConfig,
  ComponentSettingConfig,
  
  // 布局相关
  Position,
  Size,
  LayoutItem,
  CanvasItem,
  ComponentInstance,
  PanelConfig,
  RendererType,
  
  // 交互相关
  InteractionConfig,
  InteractionEventType,
  InteractionActionType,
  ComponentInteractionDefinition,
  InteractionCapableComponent,
  
  // 数据绑定相关
  DataFieldRequirement,
  ComponentDataRequirement,
  ReactiveDataBinding,
  DataUpdateEvent
} from '../core/types'

// 控件类型枚举
export { SettingControlType } from './setting-config'

// 工具函数
export { 
  createSetting, 
  createCustomConfig, 
  inferPropertyDataType 
} from './setting-config'

/**
 * Card2.1 类型系统版本
 */
export const CARD2_TYPES_VERSION = '2.1.0'

/**
 * 类型系统特性
 */
export const CARD2_TYPE_FEATURES = {
  /** 支持TypeScript严格模式 */
  strictTypeScript: true,
  /** 支持泛型组件配置 */
  genericConfig: true,
  /** 支持多渲染器 */
  multiRenderer: true,
  /** 支持交互系统 */
  interactionSystem: true,
  /** 支持数据绑定 */
  dataBinding: true,
  /** 支持生命周期钩子 */
  lifecycleHooks: true
} as const