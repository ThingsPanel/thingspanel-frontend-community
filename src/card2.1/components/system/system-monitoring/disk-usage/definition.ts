import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 磁盘使用率组件定义
 * @summary 显示系统磁盘使用率百分比，支持实时监控
 */
export default {
  type: 'disk-usage',
  name: '磁盘使用率',
  description: '显示系统磁盘使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>',
  component,
  category: '系统/系统监控',
  version: '2.1.0',
  tags: ['系统', '监控', '磁盘', '存储'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'systemMetrics',
      name: '系统指标数据',
      description: '获取系统磁盘使用率数据',
      supportedTypes: ['api'],
      required: true,
      example: {
        disk_usage: 78.2
      }
    }
  ]
} as ComponentDefinition;