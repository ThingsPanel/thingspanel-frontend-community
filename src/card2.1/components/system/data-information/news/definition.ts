import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 消息资讯组件定义
 * 显示系统消息总数统计
 */
export default {
  type: 'news',
  name: $t('widget-library.components.news'),
  description: '显示系统消息总数统计，支持实时数据展示',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/><path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h12v2H4v-2z" fill="#06b6d4"/></svg>',
  component,
  version: '2.1.0',
  tags: ['消息', '统计', '数据展示', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: '不限'
} as ComponentDefinition