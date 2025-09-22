import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 告警统计组件定义
 * @summary 显示系统告警总数统计
 */
export default {
  type: 'alarm-count',
  name: 'widget-library.components.alarmCount', // 存储翻译键，而不是调用$t()
  description: '显示系统当前的告警总数统计',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.1 0-2 .9-2 2v.17c-2.1.4-3.5 2.24-3.5 4.83v4l-2 2v1h15v-1l-2-2V9c0-2.59-1.4-4.43-3.5-4.83V4c0-1.1-.9-2-2-2zm-1 17h2c0 1.1-.9 2-2 2s-2-.9-2-2z"/></svg>',
  component,
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