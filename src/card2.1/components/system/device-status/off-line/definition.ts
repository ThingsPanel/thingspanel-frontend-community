import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 离线设备数组件定义
 * @summary 显示当前离线的设备数量，支持实时监控
 */
export default {
  type: 'off-line',
  name: '离线设备数',
  description: '显示当前离线的设备数量',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  component,
  mainCategory: '系统',
  subCategory: '设备状态',
  category: '系统/设备状态',
  version: '2.1.0',
  tags: ['系统', '设备', '离线', '状态'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'deviceStatus',
      name: '设备状态数据',
      description: '获取离线设备数量统计',
      supportedTypes: ['api'],
      required: true,
      example: {
        offline_count: 5
      }
    }
  ]
} as ComponentDefinition;