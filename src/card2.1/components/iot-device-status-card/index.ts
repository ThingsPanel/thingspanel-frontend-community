/**
 * IoT设备状态卡片组件导出
 * 专为物联网设备监控设计的状态卡片
 */

import IoTDeviceStatusCard from './IoTDeviceStatusCard.vue'
import iotDeviceStatusCardDefinition from './definition'

export default iotDeviceStatusCardDefinition
export { IoTDeviceStatusCard, iotDeviceStatusCardDefinition }

// 组件元数据
export const componentMeta = {
  name: 'IoTDeviceStatusCard',
  displayName: 'IoT设备状态卡片',
  category: 'IoT设备',
  description: '专为物联网设备监控设计的状态卡片，支持实时状态、指标监控、告警处理',
  version: '1.0.0',
  author: 'ThingsPanel',
  tags: ['iot', 'device', 'monitoring', 'status', 'realtime'],

  // 数据源支持
  dataSourceSupport: {
    supportedTypes: ['api', 'websocket', 'mqtt', 'static'],
    recommendedUpdateInterval: 5000,
    requiresRealtime: true
  },

  // 使用场景
  useCases: ['环境监测传感器', '智能网关设备', '移动设备追踪', '工业设备监控', '智能家居设备']
}
