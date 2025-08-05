import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { OnLineIcon } from './icon'

// 异步加载组件
const OnLineCard = defineAsyncComponent(() => import('./OnLineCard.vue'))

// 组件定义
const onLineDefinition: ComponentDefinition = {
  type: 'on-line',
  name: '在线设备',
  description: '显示在线设备数量的卡片组件',
  category: 'card21',
  icon: OnLineIcon,
  component: OnLineCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '在线设备',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '台',
      description: '设备单位'
    },
    colors: {
      type: 'array',
      default: ['#865ec0', '#5144b4'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'fa-wifi',
      description: '在线设备图标'
    }
  }
}

export default onLineDefinition
