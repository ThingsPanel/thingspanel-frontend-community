import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { CpuUsageIcon } from './icon'

// 异步加载组件
const CpuUsageCard = defineAsyncComponent(() => import('./CpuUsageCard.vue'))

// 组件定义
const cpuUsageDefinition: ComponentDefinition = {
  type: 'cpu-usage',
  name: 'CPU使用率',
  description: '显示系统CPU使用率的卡片组件',
  category: 'card21',
  icon: CpuUsageIcon,
  component: CpuUsageCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: 'CPU使用率',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '%',
      description: '使用率单位'
    },
    colors: {
      type: 'array',
      default: ['#4ade80', '#22c55e'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'fa-microchip',
      description: 'CPU图标'
    },
    refreshInterval: {
      type: 'number',
      default: 30000,
      description: '数据刷新间隔（毫秒）'
    }
  }
}

export default cpuUsageDefinition
