import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { DiskUsageIcon } from './icon'

// 异步加载组件
const DiskUsageCard = defineAsyncComponent(() => import('./DiskUsageCard.vue'))

// 组件定义
const diskUsageDefinition: ComponentDefinition = {
  type: 'disk-usage',
  name: '磁盘使用率',
  description: '显示系统磁盘使用率的卡片组件',
  category: 'card21',
  icon: DiskUsageIcon,
  component: DiskUsageCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '磁盘使用率',
      description: '卡片标题'
    },
    unit: {
      type: 'string',
      default: '%',
      description: '使用率单位'
    },
    colors: {
      type: 'array',
      default: ['#fb923c', '#f97316'],
      description: '渐变背景颜色'
    },
    icon: {
      type: 'string',
      default: 'ant-design:hdd-outlined',
      description: '磁盘图标'
    },
    refreshInterval: {
      type: 'number',
      default: 30000,
      description: '数据刷新间隔（毫秒）'
    }
  }
}

export default diskUsageDefinition
