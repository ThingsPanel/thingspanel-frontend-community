import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { TenantCountIcon } from './icon'

// 异步加载组件
const TenantCountCard = defineAsyncComponent(() => import('./TenantCountCard.vue'))

// 组件定义
const tenantCountDefinition: ComponentDefinition = {
  type: 'tenant-count',
  name: '租户数量',
  description: '显示系统租户数量的卡片组件',
  category: 'card21',
  icon: TenantCountIcon,
  component: TenantCountCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '租户数量',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '个',
      description: '数量单位'
    },
    colors: {
      type: 'array',
      default: ['#3b82f6', '#60a5fa'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'mdi:account-group',
      description: '租户图标'
    }
  }
}

export default tenantCountDefinition
