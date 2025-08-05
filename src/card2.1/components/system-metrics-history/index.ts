import type { ComponentDefinition } from '../../core/types'
import SystemMetricsHistoryIcon from './icon'
import SystemMetricsHistoryCard from './SystemMetricsHistoryCard.vue'

const systemMetricsHistoryDefinition: ComponentDefinition = {
  type: 'system-metrics-history',
  name: '系统指标历史',
  description: '显示系统CPU、内存、磁盘使用率的历史趋势图',
  category: 'card21',
  icon: SystemMetricsHistoryIcon,
  component: SystemMetricsHistoryCard,
  properties: {
    title: { type: 'string', default: '系统指标历史', description: '卡片标题' },
    showLegend: { type: 'boolean', default: true, description: '是否显示图例' },
    showArea: { type: 'boolean', default: true, description: '是否显示区域填充' },
    smoothLine: { type: 'boolean', default: true, description: '是否使用平滑曲线' },
    refreshInterval: { type: 'number', default: 30000, description: '数据刷新间隔(毫秒)' }
  }
}

export default systemMetricsHistoryDefinition
