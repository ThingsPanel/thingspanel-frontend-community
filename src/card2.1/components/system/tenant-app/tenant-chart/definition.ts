import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 租户图表组件定义
 * 显示租户用户统计数据和月度新增用户趋势图表
 */
export default {
  type: 'tenant-chart',
  name: $t('widget-library.components.tenantChart'),
  description: '显示租户用户统计数据和月度新增用户趋势图表，包含总用户数、月新增、昨日新增统计',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3z"/><path d="M7 14l2-3 3 3 4-6 1.4 1.8L13 15l-3-3-2 2H7z" fill="#06b6d4"/><circle cx="12" cy="8" r="2" fill="#3b82f6"/><circle cx="16" cy="6" r="2" fill="#10b981"/><circle cx="20" cy="4" r="2" fill="#8b5cf6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['租户统计', '用户增长', '数据图表'],
  permission: '不限'
} as ComponentDefinition