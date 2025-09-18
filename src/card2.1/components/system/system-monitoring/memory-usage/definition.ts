import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 内存使用率组件定义
 * @summary 显示系统内存使用率百分比，支持实时监控
 */
export default {
  type: 'memory-usage',
  name: '内存使用率',
  description: '显示系统内存使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="7" y1="7" x2="7" y2="13"/><line x1="11" y1="7" x2="11" y2="13"/><line x1="15" y1="7" x2="15" y2="13"/></svg>',
  component,
  category: '系统/系统监控',
  version: '2.1.0',
  tags: ['系统', '监控', '内存', '性能'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'systemMetrics',
      name: '系统指标数据',
      description: '获取系统内存使用率数据',
      supportedTypes: ['api'],
      required: true,
      example: {
        memory_usage: 82.7
      }
    }
  ]
} as ComponentDefinition;