/**
 * 导航动作处理器
 * 用于页面跳转和 URL 导航
 */

import type { InteractionContext, ActionMetadata, NavigateToUrlParams } from '../../types'
import { BaseInteractionActionHandler } from '../interface'

/**
 * 导航动作处理器
 */
export class NavigateToActionHandler extends BaseInteractionActionHandler {
  readonly type = 'navigateToUrl' as const

  async execute(context: InteractionContext): Promise<void> {
    const params = context.response.params as NavigateToUrlParams

    if (!params?.url) {
      throw new Error('缺少 URL 参数')
    }

    const target = params.target || '_self'

    // 执行导航
    if (target === '_self') {
      window.location.href = params.url
    } else {
      window.open(params.url, target)
    }
  }

  getMetadata(): ActionMetadata {
    return this.createMetadata({
      displayName: '跳转到 URL',
      description: '导航到指定的 URL 地址',
      category: 'navigation',
      icon: 'i-carbon-launch',
      params: [
        this.createParam({
          key: 'url',
          label: 'URL 地址',
          type: 'url',
          required: true,
          description: '要跳转的目标 URL'
        }),
        this.createParam({
          key: 'target',
          label: '打开方式',
          type: 'string',
          required: false,
          defaultValue: '_self',
          description: '页面打开方式',
          options: [
            { label: '当前窗口', value: '_self' },
            { label: '新窗口', value: '_blank' },
            { label: '父窗口', value: '_parent' },
            { label: '顶层窗口', value: '_top' }
          ]
        })
      ]
    })
  }
}
