import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * 版本信息组件定义
 * 显示系统当前版本和最新版本信息
 */
export default {
  type: 'version',
  name: 'components.version', // 存储翻译键，而不是调用$t()
  description: '显示当前系统版本和最新版本信息，支持版本比较',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 6v6l4 2" fill="#8b5cf6"/><text x="12" y="16" text-anchor="middle" font-size="3" fill="white">v</text></svg>',
  component,
  version: '2.1.0',
  tags: ['版本', '系统信息', '更新状态', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，版本信息由静态配置提供，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件和导航功能
    supportedEvents: ['click', 'navigate'],
  },
  permission: '不限'
} as ComponentDefinition