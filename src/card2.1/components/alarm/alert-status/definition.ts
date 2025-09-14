import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, alertStatusSettingConfig } from './settingConfig'
import AlertStatus from './index.vue'
import AlertStatusSetting from './setting.vue'
export const alertStatusDefinition: ComponentDefinition = { type: 'alert-status', name: '⚠️告警状态', description: '显示系统告警和状态信息', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z" /></svg>', version: '1.0.0', author: 'ThingsPanel', component: AlertStatus, configComponent: AlertStatusSetting, defaultConfig: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, config: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, defaultLayout: { gridstack: { w: 3, h: 2, x: 0, y: 0, minW: 2, minH: 2, maxW: 6, maxH: 4 } }, layout: { defaultSize: { width: 3, height: 2 }, minSize: { width: 2, height: 2 }, maxSize: { width: 6, height: 4 }, resizable: true }, permission: '不限', tags: ['告警', '状态', '监控'], features: { realtime: true, dataBinding: true, configurable: true }, dataSources: [
    { key: 'title', name: '标题', description: '告警标题', supportedTypes: ['static', 'api', 'websocket'], example: "高温告警", required: false },
    { key: 'amount', name: '金额', description: '相关金额数据', supportedTypes: ['static', 'api', 'websocket'], example: 1000, required: false },
    { key: 'description', name: '描述', description: '告警描述信息', supportedTypes: ['static', 'api', 'websocket'], example: "系统运行正常", required: false }
  ], settingConfig: alertStatusSettingConfig }
export default alertStatusDefinition