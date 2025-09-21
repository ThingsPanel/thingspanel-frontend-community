import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 在线设备数组件定义
 * @summary 显示当前在线的设备数量，支持实时监控
 */
export default {
  type: 'on-line',
  name: '在线设备数',
  description: '显示当前在线的设备数量',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  component,
  mainCategory: '系统',
  subCategory: '设备状态',
  category: '系统/设备状态',
  version: '2.1.0',
  tags: ['系统', '设备', '在线', '状态'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'deviceStatus',
      name: '设备状态数据',
      description: '获取在线设备数量统计',
      supportedTypes: ['api'],
      required: true,
      example: {
        online_count: 12
      }
    }
  ]
} as ComponentDefinition;