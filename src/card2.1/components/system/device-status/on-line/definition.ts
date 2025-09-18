import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 在线设备组件定义
 * @summary 显示系统中在线设备的状态和数量统计
 */
export default {
  type: 'on-line',
  name: '在线设备',
  description: '显示系统中在线设备的状态和数量统计',
  icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 896C299.936 896 128 724.064 128 512S299.936 128 512 128s384 171.936 384 384-171.936 384-384 384zm0-64c177.152 0 320-142.848 320-320S689.152 192 512 192 192 334.848 192 512s142.848 320 320 320z"/><path fill="currentColor" d="M448 256h128v512H448z"/><path fill="currentColor" d="M320 384h384v128H320z"/></svg>',
  component,
  category: '系统/设备状态',
  version: '2.1.0',
  tags: ['设备', '状态', '监控', '在线'],
  dataDriven: true,
  supportedDataSources: ['api', 'websocket'],
  permission: '不限',
  dataSources: [
    {
      key: 'deviceData',
      name: '设备状态数据',
      description: '获取在线设备的状态和数量信息',
      supportedTypes: ['api', 'websocket'],
      required: true,
      example: {
        total: 150,
        online: 127,
        percentage: 84.7
      }
    }
  ]
} as ComponentDefinition;