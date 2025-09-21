import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 设备在线趋势组件定义
 * 显示设备在线/离线数量趋势图表和在线率统计
 */
export default {
  type: 'online-trend',
  name: $t('widget-library.components.onlineTrend'),
  description: '显示设备在线/离线数量趋势图表，包含在线率统计和实时数据可视化',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2l1 7c0 .55.45 1 1 1s1-.45 1-1l1-7h2v-2H3v2zm11-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4-4h2v6h-2v-6zm-8-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0-6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><circle cx="12" cy="8" r="2" fill="#22c55e"/><circle cx="18" cy="12" r="1.5" fill="#22c55e"/><circle cx="6" cy="16" r="1.5" fill="#f59e0b"/></svg>',
  component,
  category: $t('widget-library.subCategories.deviceStatus'),
  version: '2.1.0',
  tags: ['设备状态', '趋势图表', '在线率'],
  permission: '不限'
} as ComponentDefinition