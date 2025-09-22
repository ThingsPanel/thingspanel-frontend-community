import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 系统指标历史组件定义
 * 显示系统CPU、内存、磁盘使用率的历史趋势图表
 */
export default {
  type: 'system-metrics-history',
  name: $t('widget-library.components.systemMetricsHistory'),
  description: '显示系统CPU、内存、磁盘使用率的历史趋势图表，支持多指标对比分析',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3z"/><path d="M7 17l3-3 2 2 5-5 1.4 1.4-6.4 6.4-2-2L7 17z" fill="#06b6d4"/><circle cx="9" cy="13" r="2" fill="#10b981"/><circle cx="14" cy="9" r="2" fill="#3b82f6"/><circle cx="18" cy="6" r="2" fill="#8b5cf6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统监控', '性能指标', '历史趋势'],
  permission: '不限'
} as ComponentDefinition