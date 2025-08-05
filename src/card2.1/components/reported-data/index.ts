import type { ComponentDefinition } from '../../core/types'
import ReportedDataIcon from './icon'
import ReportedDataCard from './ReportedDataCard.vue'

const reportedDataDefinition: ComponentDefinition = {
  type: 'reported-data',
  name: '上报数据',
  description: '显示设备最新上报的遥测数据',
  category: 'card21',
  icon: ReportedDataIcon,
  component: ReportedDataCard,
  properties: {
    title: { type: 'string', default: '上报数据', description: '卡片标题' },
    refreshInterval: { type: 'number', default: 6000, description: '数据刷新间隔(毫秒)' },
    maxDevices: { type: 'number', default: 5, description: '最大显示设备数量' },
    showOnlineStatus: { type: 'boolean', default: true, description: '是否显示在线状态' },
    showLastPushTime: { type: 'boolean', default: true, description: '是否显示最后推送时间' }
  }
}

export default reportedDataDefinition
