import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'

/**
 * 操作指引卡片组件定义
 * 根据用户角色显示相应的操作指引列表
 */
export default {
  type: 'operation-guide-card',
  name: 'components.operationGuideCard',
  description: '根据用户角色显示相应的操作指引列表，支持快速导航',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><path d="M9 11h6v2H9v-2zm0 4h4v2H9v-2z" fill="#fbbf24"/></svg>',
  component,
  category: 'widget-library.subCategories.operationGuide',
  version: '2.1.0',
  tags: ['指引', '操作手册', '用户引导', '交互'],
  dataDriven: false, // 这是一个纯交互性组件，基于用户角色提供导航功能，不依赖外部数据源
  interactionCapabilities: {
    // 声明组件支持点击事件和导航功能
    supportedEvents: ['click', 'navigate'],
  },
  permission: '不限'
} as ComponentDefinition