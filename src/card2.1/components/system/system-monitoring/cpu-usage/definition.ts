import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';
import { $t } from '@/locales';

/**
 * @description CPU 使用率组件定义
 * @summary 显示系统 CPU 使用率百分比，支持实时监控
 */
export default {
  type: 'cpu-usage',
  name: $t('widget-library.components.cpuUsage'),
  description: '显示系统 CPU 使用率百分比，每30秒自动刷新数据',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm5 5h6v6H9V9z"/><path d="M7 2h2v3H7V2zm8 0h2v3h-2V2zm-8 17h2v3H7v-3zm8 0h2v3h-2v-3zM2 7h3v2H2V7zm0 6h3v2H2v-2zm17-6h3v2h-3V7zm0 6h3v2h-3v-2z" fill="#3b82f6"/></svg>',
  component,
  category: $t('widget-library.subCategories.systemMonitoring'),
  version: '2.1.0',
  tags: ['系统', '监控', 'CPU', '性能'],
  dataDriven: true,
  supportedDataSources: ['api'],
  permission: 'SYS_ADMIN',
  dataSources: [
    {
      key: 'systemMetrics',
      name: '系统指标数据',
      description: '获取系统 CPU 使用率数据',
      supportedTypes: ['api'],
      required: true,
      example: {
        cpu_usage: 65.3
      }
    }
  ]
} as ComponentDefinition;