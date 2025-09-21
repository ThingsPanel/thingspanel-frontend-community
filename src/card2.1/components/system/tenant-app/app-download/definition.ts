import type { ComponentDefinition } from '@/card2.1/core/types'
import component from './component.vue'
import { $t } from '@/locales'

/**
 * 应用下载组件定义
 * 提供移动应用的下载入口，包含二维码和应用商店链接
 */
export default {
  type: 'app-download',
  name: $t('widget-library.components.appDownload'),
  description: '提供移动应用的下载入口，包含二维码扫描和应用商店下载链接',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zM14 21h-4v-1h4v1zm3-4H7V6h10v11z"/><path d="M12 8l-4 4h3v4h2v-4h3l-4-4z" fill="#06b6d4"/></svg>',
  component,
  category: $t('widget-library.subCategories.tenantApp'),
  version: '2.1.0',
  tags: ['应用下载', '二维码', '移动应用'],
  permission: '不限'
} as ComponentDefinition