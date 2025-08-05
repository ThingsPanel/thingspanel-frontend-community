import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { NewsIcon } from './icon'

// 异步加载组件
const NewsCard = defineAsyncComponent(() => import('./NewsCard.vue'))

// 组件定义
const newsDefinition: ComponentDefinition = {
  type: 'news',
  name: '消息总数',
  description: '显示消息总数的卡片组件',
  category: 'card21',
  icon: NewsIcon,
  component: NewsCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '消息总数',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '条',
      description: '消息单位'
    },
    colors: {
      type: 'array',
      default: ['#fcbc25', '#f68057'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'fa-envelope',
      description: '消息图标'
    }
  }
}

export default newsDefinition
