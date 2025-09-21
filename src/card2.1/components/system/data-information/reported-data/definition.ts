import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 设备上报数据组件定义
 * 显示最新的设备遥测数据，支持实时刷新和数据展示
 */
export default {
  type: 'reported-data',
  name: $t('widget-library.components.reportedData'),
  description: '显示设备最新上报的遥测数据，支持实时刷新和在线状态展示',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h8v-2h-8V9h8V7h-8V5h8V3h-8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2h-8z"/><circle cx="17" cy="8" r="2" fill="#10b981"/><circle cx="19" cy="14" r="1.5" fill="#3b82f6"/></svg>',
  component,
  category: $t('widget-library.subCategories.dataInformation'),
  version: '2.1.0',
  tags: ['设备数据', '遥测', '实时监控'],
  permission: '不限'
} as ComponentDefinition