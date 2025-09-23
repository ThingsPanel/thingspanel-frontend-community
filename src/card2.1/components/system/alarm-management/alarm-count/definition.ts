import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 告警管理组件定义
 * @summary 提供告警管理功能的快速入口和导航界面
 */
export default {
  type: 'alarm-count',
  name: 'widget-library.components.alarmCount',
  description: '提供告警管理功能的快速入口，包括查看告警、配置规则等交互功能',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.1 0-2 .9-2 2v.17c-2.1.4-3.5 2.24-3.5 4.83v4l-2 2v1h15v-1l-2-2V9c0-2.59-1.4-4.43-3.5-4.83V4c0-1.1-.9-2-2-2zm-1 17h2c0 1.1-.9 2-2 2s-2-.9-2-2z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '告警', '管理', '交互'],
  dataDriven: false, // 这是一个纯交互性组件，不依赖外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件和导航功能
    supportedEvents: ['click', 'navigate'],
  },
  permission: '不限'
} as ComponentDefinition;