/**
 * Card2.1 组件交互系统类型定义
 * 定义组件如何响应外部交互的类型系统
 */

// 交互事件类型 - 简化为3种核心事件
export type InteractionEventType =
  | 'click' // 点击事件
  | 'hover' // 悬停事件
  | 'dataChange' // 数据变化事件（属性改变时）

// 交互响应动作类型 - 简化为2种核心动作
export type InteractionActionType =
  | 'jump' // URL跳转（包含外部URL和内部菜单）
  | 'modify' // 修改目标组件属性

// 🔥 为兼容性保留的映射类型（内部使用）
export type LegacyInteractionActionType =
  | 'navigateToUrl' // 映射到 jump
  | 'updateComponentData' // 映射到 modify

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

// 交互响应配置 - 简化版
export interface InteractionResponse {
  action: InteractionActionType

  // 根据动作类型的具体配置
  jumpConfig?: JumpConfig // jump动作的配置
  modifyConfig?: ModifyConfig // modify动作的配置

  // 通用属性
  delay?: number // 延迟时间（毫秒）

  // 🔥 为兼容性保留的旧字段（已废弃，仅供内部映射使用）
  value?: any
  target?: string
  windowFeatures?: string
  targetComponentId?: string
  targetProperty?: string
  updateValue?: any
  updateMode?: 'replace' | 'append' | 'prepend'
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

// 数据变化条件 - 简化版
export interface DataChangeCondition {
  property?: string // 属性名
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains'
  value: any // 比较值
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

// 条件配置
export interface ConditionConfig {
  type: 'comparison' | 'range' | 'expression' // 条件类型
  field?: string // 监听的字段名
  operator?: ComparisonOperator // 比较运算符
  value?: any // 比较值
  minValue?: any // 范围条件的最小值
  maxValue?: any // 范围条件的最大值
  expression?: string // 自定义表达式
}

// 比较运算符
export type ComparisonOperator =
  | 'equals' // 等于 (==)
  | 'notEquals' // 不等于 (!=)
  | 'greaterThan' // 大于 (>)
  | 'greaterThanOrEqual' // 大于等于 (>=)
  | 'lessThan' // 小于 (<)
  | 'lessThanOrEqual' // 小于等于 (<=)
  | 'contains' // 包含
  | 'startsWith' // 以...开始
  | 'endsWith' // 以...结束

// 扩展的交互响应配置，支持跨组件动作
export interface CrossComponentResponse extends InteractionResponse {
  targetComponentId: string // 目标组件ID
  targetProperty?: string // 目标属性名（用于数据修改）
}

// 闪烁配置
export interface FlashConfig {
  color: string // 闪烁颜色
  duration: number // 持续时间
  times: number // 闪烁次数
}

// URL跳转配置
export interface NavigationConfig {
  url: string // 目标URL
  target?: '_blank' | '_self' | '_parent' | '_top' // 打开方式
}

// 数据更新配置
export interface DataUpdateConfig {
  targetProperty: string // 目标属性
  updateValue: any // 更新值
  updateMode?: 'replace' | 'append' | 'prepend' // 更新模式
}

// ============ 组件交互配置类型接口 ============

// 组件交互能力声明
export interface ComponentInteractionCapability {
  /** 组件支持的事件类型 */
  supportedEvents: InteractionEventType[]

  /** 组件支持的动作类型 */
  supportedActions: InteractionActionType[]

  /** 默认交互权限 */
  defaultPermissions: {
    allowExternalControl: boolean
    requirePermissionCheck: boolean
  }

  /** 可被其他组件监听的属性列表 */
  listenableProperties: string[]
}

// 交互配置示例
export interface InteractionExample {
  /** 示例名称 */
  name: string

  /** 示例描述 */
  description: string

  /** 示例场景 */
  scenario: 'click-jump' | 'hover-modify' | 'data-change-action'

  /** 示例配置 */
  config: InteractionConfig

  /** 适用组件类型 */
  applicableComponents?: string[]
}

// 组件完整交互定义（用于组件index.ts）
export interface ComponentInteractionDefinition {
  /** 交互能力声明 */
  capability: ComponentInteractionCapability

  /** 交互配置示例 */
  examples: InteractionExample[]

  /** 属性暴露配置 */
  propertyExposure: {
    componentType: string
    componentName: string
    listenableProperties: Array<{
      name: string
      label: string
      type: 'string' | 'number' | 'boolean' | 'object'
      description?: string
      group?: string
    }>
  }
}
