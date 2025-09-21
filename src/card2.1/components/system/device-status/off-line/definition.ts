import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 离线设备数组件定义
 * @summary 显示当前离线的设备数量，支持实时监控
 */
export default {
  type: 'off-line',
  name: 'widget-library.components.offLine',
  description: '显示当前离线的设备数量',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><circle cx="12" cy="12" r="3" fill="#ef4444"/></svg>',
  component,
  mainCategory: 'widget-library.categories.system',
  subCategory: 'widget-library.subCategories.deviceStatus',
  category: 'widget-library.subCategories.deviceStatus',
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