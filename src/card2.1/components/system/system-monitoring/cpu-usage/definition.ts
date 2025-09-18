import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description CPU 使用率组件定义
 * @summary 显示系统 CPU 使用率百分比，支持实时监控
 */
export default {
  type: 'cpu-usage',
  name: 'CPU 使用率',
  description: '显示系统 CPU 使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  component,
  category: '系统/系统监控',
  version: '2.1.0',
  tags: ['系统', '监控', 'CPU', '性能'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'systemMetrics',
      name: '系统指标数据',
      description: '获取系统 CPU 使用率数据',
      supportedTypes: ['api'],
      required: true,
      example: {
        cpu_usage: 65.3
      }
    }
  ]
} as ComponentDefinition;