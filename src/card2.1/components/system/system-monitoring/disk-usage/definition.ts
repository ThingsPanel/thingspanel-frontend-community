import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';
import { $t } from '@/locales';

/**
 * @description 磁盘使用率组件定义
 * @summary 显示系统磁盘使用率百分比，支持实时监控
 */
export default {
  type: 'disk-usage',
  name: $t('widget-library.components.diskUsage'),
  description: '显示系统磁盘使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 18V4h12v16H6z"/><path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#f59e0b"/></svg>',
  component,
  category: $t('widget-library.subCategories.systemMonitoring'),
  version: '2.1.0',
  tags: ['系统', '监控', '磁盘', '存储'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: 'SYS_ADMIN',
  dataSources: [
    {
      key: 'systemMetrics',
      name: '系统指标数据',
      description: '获取系统磁盘使用率数据',
      supportedTypes: ['api'],
      required: true,
      example: {
        disk_usage: 78.2
      }
    }
  ]
} as ComponentDefinition;