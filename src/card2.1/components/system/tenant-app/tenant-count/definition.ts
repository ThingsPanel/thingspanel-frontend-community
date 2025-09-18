import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 租户数量统计组件定义
 * @summary 显示系统中租户总数统计
 */
export default {
  type: 'tenant-count',
  name: '租户数量',
  description: '显示系统中租户总数统计，每60秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  component,
  category: '系统/租户与应用',
  version: '2.1.0',
  tags: ['系统', '租户', '统计', '用户管理'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: '不限',
  dataSources: [
    {
      key: 'tenantData',
      name: '租户统计数据',
      description: '获取系统租户总数统计信息',
      supportedTypes: ['api'],
      required: true,
      example: {
        user_total: 25
      }
    }
  ]
} as ComponentDefinition;