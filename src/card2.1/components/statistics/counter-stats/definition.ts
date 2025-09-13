import type { ComponentDefinition } from '@/card2.1/types'
import type { CounterStatsConfig } from './settingConfig'
import { customConfig, counterStatsSettingConfig } from './settingConfig'
import CounterStats from './index.vue'

export const counterStatsDefinition: ComponentDefinition<CounterStatsConfig> = {
  type: 'counter-stats',
  name: '📊统计计数',
  description: '显示统计数据和变化趋势',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" /></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: CounterStats,
  defaultConfig: customConfig,
  config: { type: 'counter-stats', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig },
  defaultLayout: { canvas: { width: 250, height: 120, x: 0, y: 0 }, gridstack: { w: 3, h: 2, x: 0, y: 0, minW: 2, minH: 1, maxW: 6, maxH: 3 } },
  layout: { defaultSize: { width: 3, height: 2 }, minSize: { width: 2, height: 1 }, maxSize: { width: 6, height: 3 }, resizable: true },
  permission: '不限',
  tags: ['统计', '计数', '数据'],
  features: { realtime: true, dataBinding: true, themeable: true, responsive: true, configurable: true },
  dataSources: [{
    key: 'statsData', name: '统计数据', description: '统计计数数据源',
    supportedTypes: ['static', 'api', 'websocket'],
    example: { "title": "访问量", "value": 12345, "change": 5.2 },
    fieldMappings: {
      'title': { targetField: 'title', type: 'value', required: false, defaultValue: '统计数据' },
      'value': { targetField: 'value', type: 'value', required: true, defaultValue: 0 },
      'change': { targetField: 'change', type: 'value', required: false, defaultValue: 0 }
    },
    required: true, updateInterval: 30000,
    errorHandling: { onError: 'showLastValue', retryCount: 3, retryInterval: 5000 }
  }],
  settingConfig: counterStatsSettingConfig
}

export default counterStatsDefinition