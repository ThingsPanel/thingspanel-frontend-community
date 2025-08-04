import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { $t } from '@/locales'
import { AccessIcon } from './icon'

// 异步加载组件
const AccessCard = defineAsyncComponent(() => import('./AccessCard.vue'))

// 组件定义
const accessDefinition: ComponentDefinition = {
  type: 'access',
  name: '设备总数',
  description: '显示设备总数的卡片组件，支持渐变背景和数字动画',
  category: 'card21',
  icon: AccessIcon,
  component: AccessCard,
  properties: {
    title: {
      type: 'string',
      default: $t('card.deviceTotal'),
      description: '显示标题'
    },
    unit: {
      type: 'string',
      default: $t('card.deviceUnit'),
      description: '数值单位'
    },
    icon: {
      type: 'string',
      default: 'ant-design:bar-chart-outlined',
      description: '显示图标'
    },
    colors: {
      type: 'array',
      default: ['#ec4786', '#b955a4'],
      description: '渐变颜色配置'
    }
  }
}

// 调试信息
console.log('🔧 accessDefinition 图标信息:', {
  type: accessDefinition.type,
  icon: accessDefinition.icon,
  iconType: typeof accessDefinition.icon,
  hasIcon: !!accessDefinition.icon
})

export default accessDefinition 