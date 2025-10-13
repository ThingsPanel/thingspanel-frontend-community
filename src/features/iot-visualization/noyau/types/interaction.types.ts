/**
 * 交互系统类型定义
 * 定义交互引擎的契约和类型
 */

import type { ICanvasNode, InteractionAction, InteractionEvent } from './canvas.types'

/**
 * 交互动作处理器接口
 * 每种交互动作必须实现此接口
 */
export interface IInteractionActionHandler {
  /** 动作类型 */
  readonly type: InteractionAction

  /** 执行动作 */
  execute(context: InteractionContext): Promise<void>

  /** 验证动作参数 */
  validate(params: Record<string, any>): ValidationResult

  /** 获取动作元数据 */
  getMetadata(): ActionMetadata
}

/**
 * 交互上下文
 * 传递给动作处理器的完整上下文信息
 */
export interface InteractionContext {
  /** 触发交互的节点 */
  sourceNode: ICanvasNode

  /** 交互响应配置 */
  response: IInteractionResponseConfig

  /** 事件对象（如果是 DOM 事件触发） */
  event?: Event

  /** 额外的上下文数据 */
  extra?: Record<string, any>

  /** 获取其他节点的引用 */
  getNode: (nodeId: string) => ICanvasNode | undefined

  /** 更新节点数据 */
  updateNode: (nodeId: string, updates: Partial<ICanvasNode>) => void

  /** 触发其他节点的交互 */
  triggerInteraction: (nodeId: string, eventType: InteractionEvent) => void
}

/**
 * 交互响应配置
 */
export interface IInteractionResponseConfig {
  /** 动作类型 */
  action: InteractionAction

  /** 动作名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 延迟执行（毫秒） */
  delay: number

  /** 动作参数 */
  params?: Record<string, any>

  /** 条件表达式（JavaScript，返回 boolean） */
  condition?: string

  /** 目标节点 ID（如果动作需要目标） */
  targetNodeId?: string
}

/**
 * 动作元数据
 */
export interface ActionMetadata {
  /** 动作类型 */
  type: InteractionAction

  /** 显示名称 */
  displayName: string

  /** 描述 */
  description: string

  /** 分类 */
  category: ActionCategory

  /** 图标 */
  icon?: string

  /** 参数定义 */
  params: ActionParamDefinition[]

  /** 是否需要目标节点 */
  requiresTarget: boolean
}

/**
 * 动作分类
 */
export type ActionCategory =
  | 'navigation' // 导航
  | 'data' // 数据操作
  | 'ui' // UI 控制
  | 'animation' // 动画效果
  | 'notification' // 通知
  | 'custom' // 自定义

/**
 * 动作参数定义
 */
export interface ActionParamDefinition {
  /** 参数键 */
  key: string

  /** 参数名称 */
  label: string

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'color' | 'url' | 'expression' | 'nodeId'

  /** 是否必填 */
  required: boolean

  /** 默认值 */
  defaultValue?: any

  /** 描述 */
  description?: string

  /** 选项列表（用于枚举类型） */
  options?: Array<{ label: string; value: any }>
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean

  /** 错误信息列表 */
  errors: string[]
}

/**
 * 交互配置
 * 描述一个节点的完整交互配置
 */
export interface NodeInteractionConfig {
  /** 节点 ID */
  nodeId: string

  /** 交互定义列表 */
  interactions: IInteractionDefinition[]
}

/**
 * 交互定义
 */
export interface IInteractionDefinition {
  /** 交互唯一标识 */
  id: string

  /** 交互名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 触发事件 */
  event: InteractionEvent

  /** 响应动作列表 */
  responses: IInteractionResponseConfig[]

  /** 监听的属性（用于数据变化触发） */
  watchedProperty?: string

  /** 防抖时间（毫秒） */
  debounce?: number

  /** 节流时间（毫秒） */
  throttle?: number
}

/**
 * 交互引擎接口
 */
export interface IInteractionEngine {
  /** 注册动作处理器 */
  registerAction(handler: IInteractionActionHandler): void

  /** 触发交互 */
  trigger(
    sourceNode: ICanvasNode,
    eventType: InteractionEvent,
    event?: Event,
    extra?: Record<string, any>
  ): Promise<void>

  /** 获取所有可用的动作类型 */
  getAvailableActions(): ActionMetadata[]

  /** 获取特定动作的元数据 */
  getActionMetadata(actionType: InteractionAction): ActionMetadata | undefined

  /** 验证交互配置 */
  validateInteraction(interaction: IInteractionDefinition): ValidationResult

  /** 销毁引擎 */
  destroy(): void
}

/**
 * 交互执行结果
 */
export interface InteractionExecutionResult {
  /** 是否成功 */
  success: boolean

  /** 执行的动作数量 */
  actionCount: number

  /** 错误列表 */
  errors: Array<{
    action: InteractionAction
    message: string
  }>

  /** 执行时间（毫秒） */
  duration: number
}

/**
 * 交互事件监听器
 */
export type InteractionEventListener = (
  nodeId: string,
  eventType: InteractionEvent,
  result: InteractionExecutionResult
) => void

/**
 * 条件评估器
 * 用于评估交互响应的条件表达式
 */
export interface IConditionEvaluator {
  /** 评估表达式 */
  evaluate(expression: string, context: ConditionContext): boolean

  /** 验证表达式语法 */
  validate(expression: string): ValidationResult
}

/**
 * 条件评估上下文
 */
export interface ConditionContext {
  /** 当前节点 */
  node: ICanvasNode

  /** 事件对象 */
  event?: Event

  /** 额外数据 */
  extra?: Record<string, any>

  /** 环境变量 */
  env?: Record<string, any>
}

/**
 * 内置动作类型定义
 */

/** 导航动作参数 */
export interface NavigateToUrlParams {
  url: string
  target?: '_self' | '_blank' | '_parent' | '_top'
}

/** 更新组件数据动作参数 */
export interface UpdateComponentDataParams {
  targetNodeId: string
  dataKey: string
  value: any
  /** 值表达式（JavaScript，用于动态计算值） */
  valueExpression?: string
}

/** 改变可见性动作参数 */
export interface ChangeVisibilityParams {
  targetNodeId: string
  visible: boolean
  /** 动画效果 */
  animation?: 'fade' | 'slide' | 'none'
  /** 动画持续时间（毫秒） */
  duration?: number
}

/** 改变颜色动作参数 */
export interface ChangeColorParams {
  targetNodeId: string
  property: 'backgroundColor' | 'borderColor' | 'color'
  color: string
  /** 过渡持续时间（毫秒） */
  duration?: number
}

/** 触发动画动作参数 */
export interface TriggerAnimationParams {
  targetNodeId: string
  animation: 'bounce' | 'shake' | 'pulse' | 'flash' | 'swing'
  duration?: number
  iterations?: number
}

/** 显示通知动作参数 */
export interface ShowNotificationParams {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

/** 发射事件动作参数 */
export interface EmitEventParams {
  eventName: string
  payload?: any
}

/** 打开/关闭模态框动作参数 */
export interface ModalParams {
  modalId?: string
  title?: string
  content?: string
  width?: number | string
}
