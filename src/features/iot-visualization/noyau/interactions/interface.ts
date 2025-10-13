/**
 * 交互系统接口定义（契约）
 * 定义了交互动作处理器必须实现的接口
 */

import type {
  IInteractionActionHandler,
  InteractionAction,
  InteractionContext,
  ActionMetadata,
  ActionCategory,
  ActionParamDefinition,
  ValidationResult
} from '../types'

/**
 * 抽象交互动作处理器基类
 */
export abstract class BaseInteractionActionHandler implements IInteractionActionHandler {
  abstract readonly type: InteractionAction

  /**
   * 执行动作
   */
  abstract execute(context: InteractionContext): Promise<void>

  /**
   * 获取动作元数据
   */
  abstract getMetadata(): ActionMetadata

  /**
   * 验证动作参数
   */
  validate(params: Record<string, any>): ValidationResult {
    const errors: string[] = []
    const metadata = this.getMetadata()

    // 验证必填参数
    metadata.params.forEach(param => {
      if (param.required && params[param.key] === undefined) {
        errors.push(`缺少必填参数: ${param.label}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 创建动作元数据的辅助方法
   */
  protected createMetadata(options: {
    displayName: string
    description: string
    category: ActionCategory
    params: ActionParamDefinition[]
    requiresTarget?: boolean
    icon?: string
  }): ActionMetadata {
    return {
      type: this.type,
      displayName: options.displayName,
      description: options.description,
      category: options.category,
      icon: options.icon,
      params: options.params,
      requiresTarget: options.requiresTarget || false
    }
  }

  /**
   * 创建参数定义的辅助方法
   */
  protected createParam(options: {
    key: string
    label: string
    type: ActionParamDefinition['type']
    required?: boolean
    defaultValue?: any
    description?: string
    options?: Array<{ label: string; value: any }>
  }): ActionParamDefinition {
    return {
      key: options.key,
      label: options.label,
      type: options.type,
      required: options.required ?? false,
      defaultValue: options.defaultValue,
      description: options.description,
      options: options.options
    }
  }
}

/**
 * 条件评估器实现
 */
export class ConditionEvaluator {
  /**
   * 评估表达式
   */
  evaluate(expression: string, context: any): boolean {
    try {
      // 创建一个函数来评估表达式
      const evaluator = new Function(
        'node',
        'event',
        'extra',
        'env',
        `
        try {
          return Boolean(${expression});
        } catch (error) {
          console.error('[ConditionEvaluator] 表达式执行错误:', error);
          return false;
        }
      `
      )

      return evaluator(context.node, context.event, context.extra, context.env)
    } catch (error) {
      console.error('[ConditionEvaluator] 表达式评估失败:', error)
      return false
    }
  }

  /**
   * 验证表达式语法
   */
  validate(expression: string): ValidationResult {
    const errors: string[] = []

    try {
      // 尝试创建函数来验证语法
      new Function('node', 'event', 'extra', 'env', `return Boolean(${expression})`)
    } catch (error) {
      errors.push(
        `表达式语法错误: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
