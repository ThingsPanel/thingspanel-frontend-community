import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { MemoryUsageIcon } from './icon'

// 异步加载组件
const MemoryUsageCard = defineAsyncComponent(() => import('./MemoryUsageCard.vue'))

// 组件定义
const memoryUsageDefinition: ComponentDefinition = {
  type: 'memory-usage',
  name: '内存使用率',
  description: '显示系统内存使用率的卡片组件',
  category: 'card21',
  icon: MemoryUsageIcon,
  component: MemoryUsageCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '内存使用率',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '%',
      description: '使用率单位'
    },
    colors: {
      type: 'array',
      default: ['#56cdf3', '#719de3'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'ant-design:alert-outlined',
      description: '内存图标'
    },
    refreshInterval: {
      type: 'number',
      default: 30000,
      description: '数据刷新间隔（毫秒）'
    }
  }
}

export default memoryUsageDefinition
