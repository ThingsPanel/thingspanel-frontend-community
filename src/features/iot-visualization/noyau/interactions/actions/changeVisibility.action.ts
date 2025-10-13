/**
 * 改变可见性动作处理器
 * 用于显示/隐藏组件
 */

import type { InteractionContext, ActionMetadata, ChangeVisibilityParams } from '../../types'
import { BaseInteractionActionHandler } from '../interface'

/**
 * 改变可见性动作处理器
 */
export class ChangeVisibilityActionHandler extends BaseInteractionActionHandler {
  readonly type = 'changeVisibility' as const

  async execute(context: InteractionContext): Promise<void> {
    const params = context.response.params as ChangeVisibilityParams

    if (!params?.targetNodeId) {
      throw new Error('缺少目标节点 ID')
    }

    const targetNode = context.getNode(params.targetNodeId)
    if (!targetNode) {
      throw new Error(`未找到目标节点: ${params.targetNodeId}`)
    }

    // 更新可见性
    context.updateNode(params.targetNodeId, {
      metadata: {
        ...targetNode.metadata,
        visible: params.visible
      }
    })
  }

  getMetadata(): ActionMetadata {
    return this.createMetadata({
      displayName: '改变可见性',
      description: '显示或隐藏指定组件',
      category: 'ui',
      icon: 'i-carbon-view',
      requiresTarget: true,
      params: [
        this.createParam({
          key: 'targetNodeId',
          label: '目标组件',
          type: 'nodeId',
          required: true,
          description: '要改变可见性的目标组件'
        }),
        this.createParam({
          key: 'visible',
          label: '可见',
          type: 'boolean',
          required: true,
          defaultValue: true,
          description: '是否显示组件',
          options: [
            { label: '显示', value: true },
            { label: '隐藏', value: false }
          ]
        }),
        this.createParam({
          key: 'animation',
          label: '动画效果',
          type: 'string',
          required: false,
          defaultValue: 'none',
          description: '显示/隐藏时的动画效果',
          options: [
            { label: '无动画', value: 'none' },
            { label: '淡入淡出', value: 'fade' },
            { label: '滑动', value: 'slide' }
          ]
        }),
        this.createParam({
          key: 'duration',
          label: '动画时长',
          type: 'number',
          required: false,
          defaultValue: 300,
          description: '动画持续时间（毫秒）'
        })
      ]
    })
  }
}
