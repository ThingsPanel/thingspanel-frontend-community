/**
 * Card2.1 统一类型导出
 * 提供完整、一致的类型系统，支持组件开发和编辑器集成
 * 
 * 使用方式：
 * import type { ComponentDefinition, Setting, DataSourceRequirement } from '@/card2.1/types'
 */

// ============ 核心类型系统 ============
// 从重构后的核心类型文件导入
export type {
  // 基础类型
  ComponentPermission,
  Position,
  Size,
  MetricItem,

  // 布局系统类型
  LayoutItem,
  CanvasItem,
  RendererType,

  // 数据源系统类型
  DataFieldType,
  DataValidationRule,
  DataSourceRequirement,
  StaticParamRequirement,

  // 组件定义系统
  ComponentDefinition,
  ComponentInstance,
  WidgetConfiguration,
  RendererConfig,
  PanelConfig,

  // 数据系统类型
  DataSourceInfo,
  DataUpdateEvent,
  ComponentLifecycleHooks,

  // 注册系统类型
  IComponentRegistry,
  IConfigComponent,
  IComponentDefinition
} from '../core/types'

// ============ 设置配置类型系统 ============
export type {
  // 设置项配置
  Setting,
  CustomConfig,
  DataConfig,
  TargetComponent,
  ComponentSettingConfig,

  // 控件类型和验证
  SettingValidationRule,
  EnhancedSetting,
  PropertyDataTypeFromSetting,

  // 整合的配置系统（从config-types.ts合并）
  ConfigMode,
  SettingGroup,
  TSConfig,
  ConfigValues,
  EnhancedComponentSettingConfig
} from './setting-config'

// 导出枚举
export { SettingControlType } from './setting-config'

// 导出设置配置工具函数
export {
  createSetting,
  createCustomConfig,
  inferPropertyDataType
} from './setting-config'

// ============ 类型工具函数系统 ============

export {
  // 类型转换工具
  generateDefaultConfigFromSettings,
  groupSettingsByGroup,
  inferTSTypeFromControlType,
  getDefaultValueForFieldType,
  
  // 配置对象操作工具
  deepMergeConfig,
  extractFieldValue,
  setFieldValue,
  
  // 组件定义操作工具
  createComponentSettingConfig,
  extractDataSourceRequirements,
  extractStaticParamRequirements,
  supportsDataSourceType,
  
  // 数据源和字段映射工具
  createFieldMapping,
  mergeFieldMappings,
  
  // 交互配置工具
  createClickJumpInteraction,
  createModifyInteraction,
  
  // 分组和分类工具
  inferCategoryFromPath,
  createSettingGroup,
  
  // 开发辅助工具
  generateTSInterfaceFromDefinition,
  validateComponentConfig,
  
  // 工具函数集合
  TypeUtils
} from './utils'

// ============ 交互系统类型 ============
export type {
  ComponentInteractionDefinition,
  InteractionCapability,
  InteractionEvent,
  InteractionTrigger,
  InteractionAction,
  InteractionContext
} from '../core/interaction-types'

// ============ 数据绑定类型（简化版） ============
// 使用简化的数据绑定类型，保持向后兼容性
export type {
  DataFieldRequirement,
  ComponentDataRequirement,
  ReactiveDataBinding,
  DataSource,
  DataSourceType
} from '../core/data-binding/types'

// ============ 类型工具函数 ============

/**
 * 提取组件定义的配置类型
 * 用于类型安全地访问组件的配置对象
 */
export type ExtractConfigType<T extends ComponentDefinition> = T extends ComponentDefinition<infer Config> 
  ? Config 
  : Record<string, any>

/**
 * 提取自定义配置的 customize 类型
 * 用于类型安全地访问组件的自定义配置
 */
export type ExtractCustomizeType<T extends CustomConfig> = T extends CustomConfig<infer Customize>
  ? Customize
  : Record<string, any>

/**
 * 组件设置配置的类型推导
 * 根据设置项配置推导出完整的组件配置类型
 */
export type InferConfigFromSettings<T extends readonly Setting[]> = {
  [K in T[number] as K['field']]: K['defaultValue'] extends infer V 
    ? V extends undefined 
      ? any 
      : V
    : any
}

// ============ 类型断言工具 ============

/**
 * 检查对象是否为有效的组件定义
 * @param obj 待检查的对象
 * @returns 是否为组件定义
 */
export function isComponentDefinition(obj: any): obj is ComponentDefinition {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         typeof obj.name === 'string' &&
         obj.component
}

/**
 * 检查对象是否为有效的设置项配置
 * @param obj 待检查的对象
 * @returns 是否为设置项配置
 */
export function isSetting(obj: any): obj is Setting {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         typeof obj.label === 'string' &&
         typeof obj.field === 'string'
}

/**
 * 检查对象是否为有效的数据源需求
 * @param obj 待检查的对象
 * @returns 是否为数据源需求
 */
export function isDataSourceRequirement(obj: any): obj is DataSourceRequirement {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.key === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.description === 'string' &&
         Array.isArray(obj.supportedTypes)
}

// ============ 类型验证系统 ============

export type {
  ValidationResult
} from './validation'

export {
  // 基础类型验证
  isValidDataFieldType,
  validateDataValidationRule,

  // 组件类型验证
  validateDataSourceRequirement,
  validateStaticParamRequirement,
  validateSetting,
  validateComponentDefinition,
  validateComponentDefinitions,

  // 类型断言工具
  isValidComponentDefinition,
  isValidDataSourceRequirement,
  isValidSetting,

  // 开发工具
  devModeValidationWarning
} from './validation'

// ============ 开发工具类型（保持向后兼容） ============

/**
 * 开发模式下的组件定义验证结果
 * @deprecated 使用 ValidationResult 替代
 */
export interface ComponentValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 验证错误列表 */
  errors: string[]
  /** 警告列表 */
  warnings: string[]
  /** 组件类型 */
  componentType: string
}

/**
 * 组件注册统计信息
 */
export interface ComponentRegistryStats {
  /** 总组件数量 */
  total: number
  /** 按分类分组的组件数量 */
  byCategory: Record<string, number>
  /** 按数据源类型分组的组件数量 */
  byDataSource: Record<string, number>
  /** 有效组件数量 */
  valid: number
  /** 无效组件数量 */
  invalid: number
}

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