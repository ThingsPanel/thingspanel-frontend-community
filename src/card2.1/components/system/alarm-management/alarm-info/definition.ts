import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 告警信息组件定义
 * 显示最新的告警信息列表，支持查看详情和状态展示
 */
export default {
  type: 'alarm-info',
  name: $t('widget-library.components.alarmInfo'),
  description: '显示最新的告警信息列表，包含告警名称、状态、内容和时间',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
  component,
  category: $t('widget-library.subCategories.alarmManagement'),
  version: '2.1.0',
  tags: ['告警', '信息展示', '状态监控'],
  permission: '不限'
} as ComponentDefinition