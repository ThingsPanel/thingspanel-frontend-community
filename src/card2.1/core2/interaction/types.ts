/**
 * 交互系统类型定义
 * 简化的交互类型系统，专注于核心功能
 */

import type { Component } from 'vue'

/**
 * 交互事件类型
 */
export type InteractionEventType =
  | 'click'
  | 'dblclick'
  | 'mouseenter'
  | 'mouseleave'
  | 'focus'
  | 'blur'
  | 'change'
  | 'input'

/**
 * 交互动作类型
 */
export type InteractionActionType =
  | 'navigate'
  | 'showMessage'
  | 'updateData'
  | 'toggleVisibility'
  | 'custom'

/**
 * 交互动作配置
 */
export interface InteractionAction {
  type: InteractionActionType
  target?: string // 目标组件ID或页面路径
  message?: string // 消息内容
  data?: Record<string, any> // 更新数据
  visible?: boolean // 显示/隐藏状态
  customHandler?: () => void // 自定义处理函数
}

/**
 * 交互事件配置
 */
export interface InteractionEvent {
  type: InteractionEventType
  actions: InteractionAction[]
  preventDefault?: boolean
  stopPropagation?: boolean
}

/**
 * 交互配置
 */
export interface InteractionConfig {
  events: Record<string, InteractionEvent>
  targetComponent?: string // 目标组件类型
}

/**
 * 交互管理器配置
 */
export interface InteractionManagerConfig {
  enableLogging?: boolean
  enableDebugMode?: boolean
  defaultPreventDefault?: boolean
  defaultStopPropagation?: boolean
}

/**
 * 交互状态
 */
export interface InteractionState {
  isEnabled: boolean
  activeEvents: Set<string>
  eventHistory: Array<{
    event: InteractionEventType
    target: string
    timestamp: number
  }>
}

/**
 * 交互上下文
 */
export interface InteractionContext {
  componentId: string
  componentType: string
  componentData: Record<string, any>
  globalData: Record<string, any>
}

/**
 * 交互处理器函数
 */
export type InteractionHandler = (
  event: Event,
  context: InteractionContext,
  action: InteractionAction
) => void | Promise<void>

/**
 * 交互处理器注册
 */
export interface InteractionHandlerRegistration {
  type: InteractionActionType
  handler: InteractionHandler
  priority?: number
}

/**
 * 交互系统统计信息
 */
export interface InteractionStats {
  totalEvents: number
  activeComponents: number
  registeredHandlers: number
  eventDistribution: Record<string, number>
}