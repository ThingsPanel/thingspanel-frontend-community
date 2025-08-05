import type { ComponentDefinition } from '../../core/types'
import OnlineTrendIcon from './icon'
import OnlineTrendCard from './OnlineTrendCard.vue'

const onlineTrendDefinition: ComponentDefinition = {
  type: 'online-trend',
  name: '在线趋势',
  description: '显示设备在线/离线趋势图表',
  category: 'card21',
  icon: OnlineTrendIcon,
  component: OnlineTrendCard,
  properties: {
    title: { type: 'string', default: '在线趋势', description: '卡片标题' },
    showOnlineRate: { type: 'boolean', default: true, description: '是否显示在线率' },
    showLegend: { type: 'boolean', default: true, description: '是否显示图例' },
    smoothLine: { type: 'boolean', default: true, description: '是否使用平滑曲线' },
    showArea: { type: 'boolean', default: true, description: '是否显示区域填充' },
    refreshInterval: { type: 'number', default: 30000, description: '数据刷新间隔(毫秒)' }
  }
}

export default onlineTrendDefinition
