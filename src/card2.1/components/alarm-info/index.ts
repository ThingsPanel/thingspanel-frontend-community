import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'

import { AlarmInfoIcon } from './icon'

// 异步加载组件
const AlarmInfoCard = defineAsyncComponent(() => import('./AlarmInfoCard.vue'))

// 告警信息组件不需要数据源配置，直接调用API

// 组件定义
const alarmInfoDefinition: ComponentDefinition = {
  type: 'alarm-info',
  name: '告警信息',
  description: '显示系统告警信息列表',
  category: 'card21',
  mainCategory: '系统',
  subCategory: '系统组件',
  icon: AlarmInfoIcon,
  component: AlarmInfoCard
}

export default alarmInfoDefinition
