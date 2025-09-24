import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';
/**
 * @description 组件定义
 * @summary 设备总数卡片，用于展示系统中设备的总数量统计。
 */
export default {
  type: 'access',
  name: 'components.access', // 存储翻译键，而不是调用$t()
  title: '设备总数',
  description: '显示系统中设备的总数量统计，支持根据权限显示不同范围的设备数据',
  icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4zm-2-8V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm0 5v-2c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm0 5v-2c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z"/></svg>',
  component,
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  // 由于此组件没有可供用户在编辑器中配置的属性，因此省略 `props` 定义
} as ComponentDefinition;