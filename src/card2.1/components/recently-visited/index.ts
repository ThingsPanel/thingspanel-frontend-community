import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { RecentlyVisitedIcon } from './icon'

// 异步加载组件
const RecentlyVisitedCard = defineAsyncComponent(() => import('./RecentlyVisitedCard.vue'))
const RecentlyVisitedConfig = defineAsyncComponent(() => import('./RecentlyVisitedConfig.vue'))

// 组件定义
const recentlyVisitedDefinition: ComponentDefinition = {
  type: 'recently-visited',
  name: '最近访问',
  description: '显示最近访问的页面',
  category: 'system',
  mainCategory: '系统',
  subCategory: '系统组件',
  icon: RecentlyVisitedIcon,
  component: RecentlyVisitedCard,
  configComponent: RecentlyVisitedConfig,
  properties: {
    title: {
      type: 'string',
      default: '最近访问',
      description: '卡片标题'
    },
    maxItems: {
      type: 'number',
      default: 10,
      description: '最大显示条目数'
    },
    showIcon: {
      type: 'boolean',
      default: true,
      description: '是否显示图标'
    },
    showArrow: {
      type: 'boolean',
      default: true,
      description: '是否显示箭头'
    }
  }
}

export default recentlyVisitedDefinition
