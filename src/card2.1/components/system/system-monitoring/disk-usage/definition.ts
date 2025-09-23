import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 磁盘使用率组件定义
 * @summary 显示系统磁盘使用率百分比，支持实时监控
 */
export default {
  type: 'disk-usage',
  name: 'widget-library.components.diskUsage', // 存储翻译键，而不是调用$t()
  description: '显示系统磁盘使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 18V4h12v16H6z"/><path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#f59e0b"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '监控', '磁盘', '存储', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;