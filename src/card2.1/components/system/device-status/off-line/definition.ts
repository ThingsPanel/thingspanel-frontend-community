import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 离线设备组件定义
 * @summary 显示系统中离线设备的状态和数量统计
 */
export default {
  type: 'off-line',
  name: '离线设备',
  description: '显示系统中离线设备的状态和数量统计',
  icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 896C299.936 896 128 724.064 128 512S299.936 128 512 128s384 171.936 384 384-171.936 384-384 384zm0-64c177.152 0 320-142.848 320-320S689.152 192 512 192 192 334.848 192 512s142.848 320 320 320z"/><path fill="currentColor" d="M448 320h128v384H448zm-192 64h384v128H256z"/></svg>',
  component,
  category: '系统/设备状态',
  version: '2.1.0',
  tags: ['设备', '状态', '监控', '离线'],
  dataDriven: true,
  supportedDataSources: ['api', 'websocket'],
  permission: '不限',
  dataSources: [
    {
      key: 'deviceData',
      name: '设备状态数据',
      description: '获取离线设备的状态和数量信息',
      supportedTypes: ['api', 'websocket'],
      required: true,
      example: {
        total: 150,
        offline: 23,
        percentage: 15.3
      }
    }
  ]
} as ComponentDefinition;