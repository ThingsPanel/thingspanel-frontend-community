/**
 * Card2.1 组件交互接口标准化
 * 定义所有支持交互的Card2组件必须实现的接口
 */

import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponseResult,
  ComponentInteractionState
} from '../core/interaction-types'

/**
 * 交互能力组件接口
 * 所有支持交互的Card2组件都应该实现此接口
 */
export interface InteractionCapableComponent {
  /**
   * 组件唯一标识符
   */
  componentId: string

  /**
   * 是否允许外部控制
   * 当为false时，组件拒绝所有外部交互
   */
  allowExternalControl?: boolean

  /**
   * 交互白名单
   * 只允许列表中的组件对本组件进行交互
   */
  interactionWhitelist?: string[]

  /**
   * 交互黑名单
   * 拒绝列表中的组件对本组件进行交互
   */
  interactionBlacklist?: string[]

  /**
   * 支持的事件类型
   * 组件声明自己支持哪些交互事件
   */
  supportedEvents?: InteractionEventType[]

  /**
   * 当前交互状态
   */
  interactionState?: ComponentInteractionState

  /**
   * 交互配置列表
   */
  interactionConfigs?: InteractionConfig[]

  /**
   * 是否显示交互指示器
   */
  showInteractionIndicator?: boolean
}

/**
 * 交互组件标准Props
 * 所有交互组件都应该接受这些props
 */
export interface InteractionProps {
  /**
   * 组件ID - 由Visual Editor传入
   */
  componentId?: string

  /**
   * 交互配置列表 - 从配置系统传入
   */
  interactionConfigs?: InteractionConfig[]

  /**
   * 是否允许外部控制
   */
  allowExternalControl?: boolean

  /**
   * 交互权限配置
   */
  interactionPermissions?: {
    whitelist?: string[]
    blacklist?: string[]
    allowedEvents?: InteractionEventType[]
  }

  /**
   * 是否显示交互指示器
   */
  showInteractionIndicator?: boolean

  /**
   * 是否在预览模式
   * 预览模式下激活交互，编辑模式下禁用
   */
  previewMode?: boolean
}

/**
 * 交互组件标准事件
 * 所有交互组件都应该发出这些事件
 */
export interface InteractionEmits {
  /**
   * 交互状态变化
   */
  (e: 'interaction-state-change', state: ComponentInteractionState): void

  /**
   * 交互事件触发
   */
  (e: 'interaction-event', eventType: InteractionEventType, data?: any): void

  /**
   * 交互执行结果
   */
  (e: 'interaction-result', result: InteractionResponseResult): void

  /**
   * 交互错误
   */
  (e: 'interaction-error', error: { message: string; code?: string; details?: any }): void

  /**
   * 交互被拒绝
   */
  (
    e: 'interaction-rejected',
    reason: {
      sourceComponentId?: string
      eventType: InteractionEventType
      reason: 'permission_denied' | 'event_not_supported' | 'external_control_disabled'
      message: string
    }
  ): void
}

/**
 * 交互权限检查结果
 */
export interface InteractionPermissionCheck {
  /**
   * 是否允许交互
   */
  allowed: boolean

  /**
   * 拒绝原因
   */
  reason?: string

  /**
   * 拒绝代码
   */
  code?: 'EXTERNAL_CONTROL_DISABLED' | 'COMPONENT_BLACKLISTED' | 'COMPONENT_NOT_WHITELISTED' | 'EVENT_NOT_SUPPORTED'
}

/**
 * 交互上下文信息
 */
export interface InteractionContext {
  /**
   * 源组件ID（触发交互的组件）
   */
  sourceComponentId?: string

  /**
   * 目标组件ID（接收交互的组件）
   */
  targetComponentId: string

  /**
   * 事件类型
   */
  eventType: InteractionEventType

  /**
   * 事件数据
   */
  eventData?: any

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 是否为用户直接操作
   */
  isUserAction: boolean
}

/**
 * 交互能力组件配置
 */
export interface InteractionCapabilityConfig {
  /**
   * 是否启用交互能力
   */
  enabled: boolean

  /**
   * 默认权限设置
   */
  defaultPermissions: {
    allowExternalControl: boolean
    supportedEvents: InteractionEventType[]
  }

  /**
   * 是否启用交互调试
   */
  enableDebug: boolean

  /**
   * 性能配置
   */
  performance: {
    /**
     * 事件防抖时间（毫秒）
     */
    debounceTime: number

    /**
     * 最大同时执行的交互数量
     */
    maxConcurrentInteractions: number
  }
}

/**
 * 交互组件工厂配置
 */
export interface InteractionComponentFactory {
  /**
   * 创建交互能力的组件包装器
   */
  createInteractionWrapper<T extends Record<string, any>>(
    component: T,
    config?: Partial<InteractionCapabilityConfig>
  ): T & InteractionCapableComponent

  /**
   * 验证组件是否支持交互
   */
  validateInteractionSupport(component: any): boolean

  /**
   * 获取组件支持的事件类型
   */
  getSupportedEvents(component: any): InteractionEventType[]
}
