import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * 系统指标历史组件定义
 * 显示系统CPU、内存、磁盘使用率的历史趋势图表
 */
export default {
  type: 'system-metrics-history',
  name: 'components.systemMetricsHistory', // 存储翻译键，而不是调用$t()
  description: '显示系统CPU、内存、磁盘使用率的历史趋势图表，支持多指标对比分析',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3z"/><path d="M7 17l3-3 2 2 5-5 1.4 1.4-6.4 6.4-2-2L7 17z" fill="#06b6d4"/><circle cx="9" cy="13" r="2" fill="#10b981"/><circle cx="14" cy="9" r="2" fill="#3b82f6"/><circle cx="18" cy="6" r="2" fill="#8b5cf6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统监控', '性能指标', '历史趋势', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition
