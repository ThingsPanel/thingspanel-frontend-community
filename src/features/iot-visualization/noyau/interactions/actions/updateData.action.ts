/**
 * 更新数据动作处理器
 * 用于更新其他组件的数据
 */

import type { InteractionContext, ActionMetadata, UpdateComponentDataParams } from '../../types'
import { BaseInteractionActionHandler } from '../interface'

/**
 * 更新组件数据动作处理器
 */
export class UpdateComponentDataActionHandler extends BaseInteractionActionHandler {
  readonly type = 'updateComponentData' as const

  async execute(context: InteractionContext): Promise<void> {
    const params = context.response.params as UpdateComponentDataParams

    if (!params?.targetNodeId) {
      throw new Error('缺少目标节点 ID')
    }

    if (!params?.dataKey) {
      throw new Error('缺少数据键')
    }

    // 计算值
    let value = params.value

    // 如果提供了值表达式，执行表达式计算
    if (params.valueExpression) {
      try {
        const evaluator = new Function(
          'sourceNode',
          'targetNode',
          'event',
          `return ${params.valueExpression}`
        )

        const targetNode = context.getNode(params.targetNodeId)
        value = evaluator(context.sourceNode, targetNode, context.event)
      } catch (error) {
        console.error('[UpdateComponentData] 值表达式执行失败:', error)
        throw new Error('值表达式执行失败')
      }
    }

    // 更新目标节点的数据
    context.updateNode(params.targetNodeId, {
      data: {
        ...context.getNode(params.targetNodeId)?.data,
        [params.dataKey]: value
      }
    })
  }

  getMetadata(): ActionMetadata {
    return this.createMetadata({
      displayName: '更新组件数据',
      description: '更新指定组件的数据值',
      category: 'data',
      icon: 'i-carbon-data-base',
      requiresTarget: true,
      params: [
        this.createParam({
          key: 'targetNodeId',
          label: '目标组件',
          type: 'nodeId',
          required: true,
          description: '要更新数据的目标组件'
        }),
        this.createParam({
          key: 'dataKey',
          label: '数据键',
          type: 'string',
          required: true,
          description: '要更新的数据字段名称'
        }),
        this.createParam({
          key: 'value',
          label: '新值',
          type: 'string',
          required: false,
          description: '要设置的新值（如果不使用表达式）'
        }),
        this.createParam({
          key: 'valueExpression',
          label: '值表达式',
          type: 'expression',
          required: false,
          description: 'JavaScript 表达式，用于动态计算值'
        })
      ]
    })
  }
}
