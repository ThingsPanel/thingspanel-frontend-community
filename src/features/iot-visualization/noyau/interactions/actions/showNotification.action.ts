/**
 * 显示通知动作处理器
 * 用于显示系统通知消息
 */

import type { InteractionContext, ActionMetadata, ShowNotificationParams } from '../../types'
import { BaseInteractionActionHandler } from '../interface'

/**
 * 显示通知动作处理器
 * 注意：实际的通知显示需要在 Vue 层实现（使用 Naive UI）
 */
export class ShowNotificationActionHandler extends BaseInteractionActionHandler {
  readonly type = 'showNotification' as const

  async execute(context: InteractionContext): Promise<void> {
    const params = context.response.params as ShowNotificationParams

    if (!params?.title) {
      throw new Error('缺少通知标题')
    }

    // 通过 extra 上下文传递通知配置
    // 实际的通知显示由 Vue 层的交互引擎处理
    if (context.extra?.notificationHandler) {
      const handler = context.extra.notificationHandler as (config: any) => void
      handler({
        title: params.title,
        message: params.message || '',
        type: params.type || 'info',
        duration: params.duration || 3000
      })
    } else {
      // 回退方案：使用浏览器原生通知
      console.log(`[Notification] ${params.title}: ${params.message || ''}`)
    }
  }

  getMetadata(): ActionMetadata {
    return this.createMetadata({
      displayName: '显示通知',
      description: '显示系统通知消息',
      category: 'notification',
      icon: 'i-carbon-notification',
      params: [
        this.createParam({
          key: 'title',
          label: '标题',
          type: 'string',
          required: true,
          description: '通知标题'
        }),
        this.createParam({
          key: 'message',
          label: '消息内容',
          type: 'string',
          required: false,
          description: '通知的详细内容'
        }),
        this.createParam({
          key: 'type',
          label: '通知类型',
          type: 'string',
          required: false,
          defaultValue: 'info',
          description: '通知的类型样式',
          options: [
            { label: '信息', value: 'info' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '错误', value: 'error' }
          ]
        }),
        this.createParam({
          key: 'duration',
          label: '显示时长',
          type: 'number',
          required: false,
          defaultValue: 3000,
          description: '通知显示时长（毫秒），0 表示不自动关闭'
        })
      ]
    })
  }
}
