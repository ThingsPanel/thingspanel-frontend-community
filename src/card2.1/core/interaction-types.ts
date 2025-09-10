/**
 * Card2.1 组件交互系统类型定义
 * 定义组件如何响应外部交互的类型系统
 * 优化后的简洁版本，移除了冗余和过时的类型定义
 */

// ============ 核心交互类型 ============

/**
 * 交互事件类型
 * 简化为3种核心事件类型
 */
export type InteractionEventType =
  | 'click' // 点击事件
  | 'hover' // 悬停事件
  | 'dataChange' // 数据变化事件（属性改变时）

/**
 * 交互响应动作类型
 * 简化为2种核心动作类型
 */
export type InteractionActionType =
  | 'jump' // URL跳转（包含外部URL和内部菜单）
  | 'modify' // 修改目标组件属性


// 跳转类型枚举
export type JumpType = 'external' | 'internal'

// URL跳转配置
export interface JumpConfig {
  jumpType: JumpType // 跳转类型：external(外部URL) | internal(内部菜单)
  url?: string // 外部URL地址
  internalPath?: string // 内部菜单路径
  target?: '_self' | '_blank' | '_parent' | '_top' // 跳转目标
  windowFeatures?: string // 新窗口特性配置
}

// 属性修改配置
export interface ModifyConfig {
  targetComponentId: string // 目标组件ID
  targetProperty: string // 目标属性名
  updateValue: any // 更新值
  updateMode?: 'replace' | 'append' | 'prepend' // 更新模式
}

/**
 * 交互响应配置
 * 清理后的简化版本，移除了冗余的兼容性字段
 */
export interface InteractionResponse {
  /** 交互动作类型 */
  action: InteractionActionType
  /** URL跳转配置（当action为'jump'时） */
  jumpConfig?: JumpConfig
  /** 属性修改配置（当action为'modify'时） */
  modifyConfig?: ModifyConfig
  /** 延迟执行时间（毫秒） */
  delay?: number
  /** 响应配置名称 */
  name?: string
  /** 是否启用此响应 */
  enabled?: boolean
}

// 交互触发类型 - 区分是节点触发还是组件内部触发
export type InteractionTriggerType =
  | 'node' // 节点级别触发（整个节点响应事件）
  | 'component' // 组件内部触发（组件内部元素响应事件）

// 简化的交互配置
export interface InteractionConfig {
  event: InteractionEventType
  responses: InteractionResponse[]
  enabled?: boolean // 是否启用此交互
  priority?: number // 优先级，数字越大优先级越高
  name?: string // 交互配置名称

  // dataChange事件专用配置
  watchedProperty?: string // 被监听的组件属性名（仅dataChange事件使用）
  condition?: DataChangeCondition // 条件配置（仅dataChange事件使用）
}

/**
 * 数据变化条件配置
 * 统一的条件配置系统
 */
export interface DataChangeCondition {
  /** 监听的属性名 */
  property?: string
  /** 比较运算符 */
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'contains' | 'startsWith' | 'endsWith'
  /** 比较值 */
  value: any
  /** 范围最小值（用于范围比较） */
  minValue?: any
  /** 范围最大值（用于范围比较） */
  maxValue?: any
}

// 组件交互状态
export interface ComponentInteractionState {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  width?: string | number
  height?: string | number
  opacity?: number
  transform?: string
  visibility?: 'visible' | 'hidden'
  content?: any
  isAnimating?: boolean
}

// 交互管理器接口
export interface IInteractionManager {
  // 注册组件的交互配置
  registerComponent(componentId: string, configs: InteractionResponse[]): void

  // 移除组件的交互配置
  unregisterComponent(componentId: string): void

  // 触发交互事件
  triggerEvent(componentId: string, event: InteractionEventType, data?: any): void

  // 获取组件的交互状态
  getComponentState(componentId: string): ComponentInteractionState | undefined

  // 重置组件的交互状态
  resetComponentState(componentId: string): void

  // 批量更新多个组件的交互配置
  updateComponentConfigs(componentId: string, configs: InteractionResponse[]): void
}

// 交互事件数据
export interface InteractionEventData {
  source?: string // 事件来源
  timestamp: Date // 事件时间戳
  data?: any // 额外数据
  position?: { x: number; y: number } // 事件位置
}

// 交互响应结果
export interface InteractionResponseResult {
  success: boolean
  componentId: string
  action: InteractionActionType
  oldValue?: any
  newValue?: any
  error?: string
}


// ============ 类型别名和简化接口 ============

/**
 * 比较运算符类型别名
 * 从DataChangeCondition中提取的运算符类型
 */
export type ComparisonOperator = DataChangeCondition['operator']

/**
 * 交互触发器类型
 * 区分节点级别和组件级别的触发
 */
export type InteractionTrigger = 'node' | 'component'

/**
 * 交互事件简化类型
 * 常用的事件数据接口
 */
export interface InteractionEvent {
  /** 事件类型 */
  type: InteractionEventType
  /** 事件来源组件ID */
  sourceId: string
  /** 事件时间戳 */
  timestamp: Date
  /** 事件附加数据 */
  data?: any
}

/**
 * 交互响应简化类型
 * 常用的响应结果接口
 */
export interface InteractionResult {
  /** 是否成功执行 */
  success: boolean
  /** 执行的动作类型 */
  action: InteractionActionType
  /** 目标组件ID */
  targetId?: string
  /** 错误信息（如果失败） */
  error?: string
}

// ============ 简化的组件交互能力定义 ============

/**
 * 组件交互能力声明（简化版本）
 * 移除了冗余的示例和重复的属性暴露配置
 */
export interface ComponentInteractionCapability {
  /** 组件支持的事件类型 */
  supportedEvents: InteractionEventType[]
  /** 组件支持的动作类型 */
  supportedActions: InteractionActionType[]
  /** 可被其他组件监听的属性列表 */
  listenableProperties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object'
    description?: string
  }>
}
