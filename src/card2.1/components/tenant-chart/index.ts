import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { TenantChartIcon } from './icon'

// 异步加载组件
const TenantChartCard = defineAsyncComponent(() => import('./TenantChartCard.vue'))

// 组件定义
const tenantChartDefinition: ComponentDefinition = {
  type: 'tenant-chart',
  name: '租户图表',
  description: '显示租户统计信息的图表组件',
  category: 'card21',
  icon: TenantChartIcon,
  component: TenantChartCard,
  // 注意：该组件没有 configForm，所以不创建配置组件
  // 注意：该组件没有 preset.dataSource，所以不定义数据源配置
  properties: {
    title: {
      type: 'string',
      default: '租户图表',
      description: '卡片标题'
    },
    showStats: {
      type: 'boolean',
      default: true,
      description: '是否显示统计信息'
    },
    showChart: {
      type: 'boolean',
      default: true,
      description: '是否显示图表'
    },
    chartType: {
      type: 'string',
      default: 'bar',
      description: '图表类型'
    },
    barColor: {
      type: 'string',
      default: '#4bc0c0',
      description: '柱状图颜色'
    }
  }
}

export default tenantChartDefinition
