import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description 租户数量统计组件定义
 * @summary 显示系统中租户总数统计
 */
export default {
  type: 'tenant-count',
  name: 'components.tenantCount', // 存储翻译键，而不是调用$t()
  description: '显示系统中租户总数统计，每60秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><circle cx="18" cy="8" r="3" fill="#3b82f6"/><circle cx="6" cy="8" r="3" fill="#10b981"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '租户', '统计', '用户管理', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;