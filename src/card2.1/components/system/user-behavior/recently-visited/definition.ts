import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 最近访问组件定义
 * 显示用户最近访问的页面列表，支持快速导航
 */
export default {
  type: 'recently-visited',
  name: $t('widget-library.components.recentlyVisited'),
  description: '显示用户最近访问的页面列表，支持点击快速导航',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['访问记录', '导航', '用户行为'],
  permission: '不限'
} as ComponentDefinition