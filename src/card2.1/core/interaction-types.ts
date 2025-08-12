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
  | 'custom' // 自定义动作

// 交互响应配置
export interface InteractionResponse {
  action: InteractionActionType
  value: any
  duration?: number // 动画持续时间（毫秒）
  easing?: string // 缓动函数
  delay?: number // 延迟时间（毫秒）
}

// 交互配置
export interface InteractionConfig {
  event: InteractionEventType
  responses: InteractionResponse[]
  enabled?: boolean // 是否启用此交互
  priority?: number // 优先级，数字越大优先级越高
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
