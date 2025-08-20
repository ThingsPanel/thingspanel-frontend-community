/**
 * Card2.1 组件交互系统类型定义
 * 定义组件如何响应外部交互的类型系统
 */

// 交互事件类型
export type InteractionEventType =
  | 'click' // 点击事件
  | 'hover' // 悬停事件
  | 'focus' // 聚焦事件
  | 'blur' // 失焦事件
  | 'visibility' // 🔥 新增：显示时/隐藏时事件
  | 'dataChange' // 数据变化事件（属性改变时）
  | 'conditional' // 条件触发事件
  | 'crossComponent' // 跨组件事件
  | 'custom' // 自定义事件

// 交互响应动作类型
export type InteractionActionType =
  | 'changeBackgroundColor' // 改变背景颜色
  | 'changeTextColor' // 改变文字颜色
  | 'changeBorderColor' // 改变边框颜色
  | 'changeSize' // 改变大小
  | 'changeOpacity' // 改变透明度
  | 'changeTransform' // 改变变换（旋转、缩放等）
  | 'changeVisibility' // 改变可见性
  | 'changeContent' // 改变内容
  | 'triggerAnimation' // 触发动画
  | 'navigateToUrl' // 跳转到指定URL
  | 'updateComponentData' // 修改目标组件数据
  | 'flashColor' // 闪烁颜色效果
  | 'conditionalStyle' // 条件样式变化
  | 'callFunction' // 调用函数
  | 'custom' // 自定义动作

// 交互响应配置
export interface InteractionResponse {
  action: InteractionActionType
  value: any
  duration?: number // 动画持续时间（毫秒）
  easing?: string // 缓动函数
  delay?: number // 延迟时间（毫秒）

  // URL跳转相关属性
  target?: string // 跳转目标 (_self, _blank, _parent, _top)
  windowFeatures?: string // 新窗口特性配置

  // 跨组件数据更新相关属性
  targetComponentId?: string // 目标组件ID
  targetProperty?: string // 目标属性名
  updateValue?: any // 更新值
  updateMode?: 'replace' | 'append' | 'prepend' // 更新模式
}

// 交互触发类型 - 区分是节点触发还是组件内部触发
export type InteractionTriggerType =
  | 'node' // 节点级别触发（整个节点响应事件）
  | 'component' // 组件内部触发（组件内部元素响应事件）

// 交互配置
export interface InteractionConfig {
  event: InteractionEventType
  responses: InteractionResponse[]
  triggerType?: InteractionTriggerType // 交互触发类型
  enabled?: boolean // 是否启用此交互
  priority?: number // 优先级，数字越大优先级越高
  name?: string // 交互配置名称
  // 跨组件交互配置
  targetComponentId?: string // 目标组件ID（跨组件交互时使用）
  // 条件触发配置
  condition?: ConditionConfig // 条件配置（条件触发时使用）
  // 🔥 数据变化监听配置（增强版）
  dataPath?: string // 监听的数据路径
  watchedProperty?: string // 被监听的组件属性名
  sourceComponentType?: string // 源组件类型（用于属性验证）
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
