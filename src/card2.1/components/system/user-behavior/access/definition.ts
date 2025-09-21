import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';
import { $t } from '@/locales';

/**
 * @description 组件定义
 * @summary 访问量卡片，用于展示系统或应用的总访问次数。
 */
export default {
  type: 'access',
  name: $t('widget-library.components.access'),
  title: '访问量',
  description: '显示系统或应用的累计访问量',
  icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 384a128 128 0 1 0 0 256 128 128 0 0 0 0-256zm0 320a192 192 0 1 1 0-384 192 192 0 0 1 0 384z"/><path fill="currentColor" d="M512 896a448 448 0 1 1 0-896 448 448 0 0 1 0 896zm0-64a384 384 0 1 0 0-768 384 384 0 0 0 0 768z"/></svg>',
  component,
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  // 由于此组件没有可供用户在编辑器中配置的属性，因此省略 `props` 定义
} as ComponentDefinition;