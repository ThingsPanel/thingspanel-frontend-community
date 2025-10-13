/**
 * 交互引擎
 * 负责解析和执行所有交互事件的引擎
 */

import type {
  IInteractionEngine,
  IInteractionActionHandler,
  ICanvasNode,
  InteractionEvent,
  InteractionAction,
  ActionMetadata,
  InteractionExecutionResult,
  ValidationResult,
  IInteractionDefinition,
  InteractionEventListener
} from '../types'
import { ConditionEvaluator } from './interface'

// 导入内置动作处理器
import { NavigateToActionHandler } from './actions/navigateTo.action'
import { UpdateComponentDataActionHandler } from './actions/updateData.action'
import { ChangeVisibilityActionHandler } from './actions/changeVisibility.action'
import { ShowNotificationActionHandler } from './actions/showNotification.action'

/**
 * 交互引擎实现
 */
export class InteractionEngine implements IInteractionEngine {
  /** 动作处理器注册表 */
  private handlers: Map<InteractionAction, IInteractionActionHandler> = new Map()

  /** 条件评估器 */
  private conditionEvaluator = new ConditionEvaluator()

  /** 事件监听器 */
  private eventListeners: Set<InteractionEventListener> = new Set()

  /** 防抖/节流定时器 */
  private timers: Map<string, number> = new Map()

  constructor() {
    // 注册内置动作处理器
    this.registerDefaultHandlers()
  }

  /**
   * 注册默认的动作处理器
   */
  private registerDefaultHandlers(): void {
    this.registerAction(new NavigateToActionHandler())
    this.registerAction(new UpdateComponentDataActionHandler())
    this.registerAction(new ChangeVisibilityActionHandler())
    this.registerAction(new ShowNotificationActionHandler())
  }

  /**
   * 注册动作处理器
   */
  registerAction(handler: IInteractionActionHandler): void {
    this.handlers.set(handler.type, handler)
  }

  /**
   * 触发交互
   */
  async trigger(
    sourceNode: ICanvasNode,
    eventType: InteractionEvent,
    event?: Event,
    extra?: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now()
    let actionCount = 0
    const errors: Array<{ action: InteractionAction; message: string }> = []

    try {
      // 获取节点的交互配置
      const interactions = sourceNode.interactions?.filter(
        interaction => interaction.enabled && interaction.event === eventType
      )

      if (!interactions || interactions.length === 0) {
        return
      }

      // 执行每个交互定义
      for (const interaction of interactions) {
        try {
          // 检查防抖/节流
          if (!this.shouldTrigger(sourceNode.id, interaction)) {
            continue
          }

          // 执行交互响应
          for (const response of interaction.responses) {
            if (!response.enabled) continue

            try {
              // 检查条件
              if (response.condition) {
                const conditionMet = this.conditionEvaluator.evaluate(response.condition, {
                  node: sourceNode,
                  event,
                  extra
                })

                if (!conditionMet) {
                  continue
                }
              }

              // 延迟执行
              if (response.delay > 0) {
                await this.delay(response.delay)
              }

              // 获取动作处理器
              const handler = this.handlers.get(response.action)
              if (!handler) {
                throw new Error(`未找到动作处理器: ${response.action}`)
              }

              // 验证参数
              const validation = handler.validate(response.params || {})
              if (!validation.valid) {
                throw new Error(`参数验证失败: ${validation.errors.join(', ')}`)
              }

              // 创建上下文（需要从外部传入 getNode 和 updateNode）
              const context = {
                sourceNode,
                response,
                event,
                extra,
                getNode: extra?.getNode || (() => undefined),
                updateNode: extra?.updateNode || (() => {}),
                triggerInteraction: extra?.triggerInteraction || (() => {})
              }

              // 执行动作
              await handler.execute(context)
              actionCount++
            } catch (error) {
              errors.push({
                action: response.action,
                message: error instanceof Error ? error.message : String(error)
              })
              console.error(`[InteractionEngine] 动作执行失败:`, {
                nodeId: sourceNode.id,
                action: response.action,
                error
              })
            }
          }
        } catch (error) {
          console.error(`[InteractionEngine] 交互执行失败:`, {
            nodeId: sourceNode.id,
            interactionId: interaction.id,
            error
          })
        }
      }
    } finally {
      // 构建执行结果
      const result: InteractionExecutionResult = {
        success: errors.length === 0,
        actionCount,
        errors,
        duration: Date.now() - startTime
      }

      // 通知事件监听器
      this.notifyListeners(sourceNode.id, eventType, result)
    }
  }

  /**
   * 获取所有可用的动作类型
   */
  getAvailableActions(): ActionMetadata[] {
    return Array.from(this.handlers.values()).map(handler => handler.getMetadata())
  }

  /**
   * 获取特定动作的元数据
   */
  getActionMetadata(actionType: InteractionAction): ActionMetadata | undefined {
    const handler = this.handlers.get(actionType)
    return handler?.getMetadata()
  }

  /**
   * 验证交互配置
   */
  validateInteraction(interaction: IInteractionDefinition): ValidationResult {
    const errors: string[] = []

    // 验证基础字段
    if (!interaction.name) {
      errors.push('交互名称不能为空')
    }

    if (!interaction.event) {
      errors.push('交互事件不能为空')
    }

    // 验证响应动作
    if (!interaction.responses || interaction.responses.length === 0) {
      errors.push('至少需要一个响应动作')
    } else {
      interaction.responses.forEach((response, index) => {
        // 检查动作是否存在
        const handler = this.handlers.get(response.action)
        if (!handler) {
          errors.push(`响应 ${index + 1}: 未知的动作类型 ${response.action}`)
          return
        }

        // 验证动作参数
        const validation = handler.validate(response.params || {})
        if (!validation.valid) {
          errors.push(`响应 ${index + 1} (${response.action}): ${validation.errors.join(', ')}`)
        }

        // 验证条件表达式
        if (response.condition) {
          const conditionValidation = this.conditionEvaluator.validate(response.condition)
          if (!conditionValidation.valid) {
            errors.push(
              `响应 ${index + 1} 条件表达式无效: ${conditionValidation.errors.join(', ')}`
            )
          }
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 订阅交互事件
   */
  on(listener: InteractionEventListener): () => void {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    // 清除所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()

    // 清空监听器
    this.eventListeners.clear()

    // 清空处理器
    this.handlers.clear()
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否应该触发交互（防抖/节流）
   */
  private shouldTrigger(nodeId: string, interaction: IInteractionDefinition): boolean {
    const key = `${nodeId}-${interaction.id}`

    // 如果没有配置防抖或节流，直接触发
    if (!interaction.debounce && !interaction.throttle) {
      return true
    }

    const now = Date.now()
    const lastTriggerTime = this.timers.get(key)

    // 节流：如果在节流时间内，不触发
    if (interaction.throttle && lastTriggerTime) {
      const elapsed = now - lastTriggerTime
      if (elapsed < interaction.throttle) {
        return false
      }
    }

    // 更新触发时间
    this.timers.set(key, now)

    // 防抖：清除之前的定时器
    if (interaction.debounce) {
      const existingTimer = this.timers.get(`${key}-debounce`)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // 设置新的防抖定时器
      const timer = window.setTimeout(() => {
        this.timers.delete(`${key}-debounce`)
      }, interaction.debounce)

      this.timers.set(`${key}-debounce`, timer)
    }

    return true
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(
    nodeId: string,
    eventType: InteractionEvent,
    result: InteractionExecutionResult
  ): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(nodeId, eventType, result)
      } catch (error) {
        console.error('[InteractionEngine] 事件监听器执行失败:', error)
      }
    })
  }
}

/**
 * 创建交互引擎实例
 */
export function createInteractionEngine(): InteractionEngine {
  return new InteractionEngine()
}
