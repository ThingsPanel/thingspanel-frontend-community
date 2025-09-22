import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 版本信息组件定义
 * 显示系统当前版本和最新版本信息
 */
export default {
  type: 'version',
  name: $t('widget-library.components.version'),
  description: '显示当前系统版本和最新版本信息，支持版本比较',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 6v6l4 2" fill="#8b5cf6"/><text x="12" y="16" text-anchor="middle" font-size="3" fill="white">v</text></svg>',
  component,
  version: '2.1.0',
  tags: ['版本', '系统信息', '更新状态'],
  permission: '不限'
} as ComponentDefinition