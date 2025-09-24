import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 内存使用率组件定义
 * @summary 显示系统内存使用率百分比，支持实时监控
 */
export default {
  type: 'memory-usage',
  name: 'components.memoryUsage', // 存储翻译键，而不是调用$t()
  description: '显示系统内存使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/><rect x="7" y="7" width="2" height="6" fill="#10b981"/><rect x="11" y="8" width="2" height="5" fill="#06b6d4"/><rect x="15" y="6" width="2" height="7" fill="#8b5cf6"/><path d="M8 21h8v2H8v-2z" fill="#6b7280"/><path d="M12 17v4" fill="#6b7280"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '监控', '内存', '性能', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;