import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { OffLineIcon } from './icon'

// 异步加载组件
const OffLineCard = defineAsyncComponent(() => import('./OffLineCard.vue'))

// 组件定义
const offLineDefinition: ComponentDefinition = {
  type: 'off-line',
  name: '离线设备',
  description: '显示离线设备数量的卡片组件',
  category: 'card21',
  icon: OffLineIcon,
  component: OffLineCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '离线设备',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '台',
      description: '设备单位'
    },
    colors: {
      type: 'array',
      default: ['#56cdf3', '#719de3'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'fa-ban',
      description: '离线设备图标'
    }
  }
}

export default offLineDefinition
