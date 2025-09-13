import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, simpleMapSettingConfig } from './settingConfig'
import SimpleMap from './index.vue'
export const simpleMapDefinition: ComponentDefinition = {
  type: 'simple-map', name: '📍简单地图', description: '显示位置信息的简单地图',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C15.31,2 18,4.66 18,7.95C18,12.41 12,19 12,19S6,12.41 6,7.95C6,4.66 8.69,2 12,2M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6Z" /></svg>',
  version: '1.0.0', author: 'ThingsPanel', component: SimpleMap, defaultConfig: customConfig,
  config: { type: 'simple-map', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig },
  defaultLayout: { gridstack: { w: 4, h: 3, x: 0, y: 0, minW: 3, minH: 2, maxW: 8, maxH: 6 } },
  layout: { defaultSize: { width: 4, height: 3 }, minSize: { width: 3, height: 2 }, maxSize: { width: 8, height: 6 }, resizable: true },
  permission: '不限', tags: ['位置', '地图'], features: { dataBinding: true, configurable: true },
  dataSources: [{ key: 'locationData', name: '位置数据', description: '地图位置数据源', supportedTypes: ['static', 'api'], 
    example: { "latitude": 39.9042, "longitude": 116.4074, "address": "北京市" }, required: false }],
  settingConfig: simpleMapSettingConfig
}
export default simpleMapDefinition