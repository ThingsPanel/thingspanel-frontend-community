import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description CPU 使用率组件定义
 * @summary 显示系统 CPU 使用率百分比，支持实时监控
 */
export default {
  type: 'cpu-usage',
  name: 'components.cpuUsage', // 存储翻译键，而不是调用$t()
  description: '显示系统 CPU 使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm5 5h6v6H9V9z"/><path d="M7 2h2v3H7V2zm8 0h2v3h-2V2zm-8 17h2v3H7v-3zm8 0h2v3h-2v-3zM2 7h3v2H2V7zm0 6h3v2H2v-2zm17-6h3v2h-3V7zm0 6h3v2h-3v-2z" fill="#3b82f6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '监控', 'CPU', '性能', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;