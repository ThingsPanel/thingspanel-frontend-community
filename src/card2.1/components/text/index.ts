/**
 * Text 组件注册
 * 简洁的组件定义
 */

import { defineAsyncComponent } from 'vue'
import type { CardComponent } from '../../core/types'

// 异步加载组件
const TextCard = defineAsyncComponent(() => import('./TextCard.vue'))
const TextConfig = defineAsyncComponent(() => import('./TextConfig.vue'))

// 组件定义
export const textComponent: CardComponent = {
  id: 'text',
  name: '文本组件',
  component: TextCard,
  config: TextConfig,
  poster: '' // 暂时为空，后续可以添加预览图
}

// 默认导出
export default textComponent
