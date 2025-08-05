import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { AlarmCountIcon } from './icon'

// 异步加载组件
const AlarmCountCard = defineAsyncComponent(() => import('./AlarmCountCard.vue'))

// 组件定义
const alarmCountDefinition: ComponentDefinition = {
  type: 'alarm-count',
  name: '告警数量',
  description: '显示系统告警数量的卡片组件',
  category: 'card21',
  icon: AlarmCountIcon,
  component: AlarmCountCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '告警数量',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '条',
      description: '数量单位'
    },
    colors: {
      type: 'array',
      default: ['#f97316', '#ef4444'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'fa-bell',
      description: '告警图标'
    }
  }
}

export default alarmCountDefinition
