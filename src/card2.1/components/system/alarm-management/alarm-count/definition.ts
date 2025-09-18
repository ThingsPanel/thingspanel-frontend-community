import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 告警统计组件定义
 * @summary 显示系统告警总数统计
 */
export default {
  type: 'alarm-count',
  name: '告警统计',
  description: '显示系统当前的告警总数统计',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><bell/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  component,
  category: '系统/告警管理',
  version: '2.1.0',
  tags: ['系统', '告警', '统计', '监控'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'alarmData',
      name: '告警统计数据',
      description: '获取系统告警总数统计信息',
      supportedTypes: ['api'],
      required: true,
      example: {
        alarm_device_total: 15
      }
    }
  ]
} as ComponentDefinition;