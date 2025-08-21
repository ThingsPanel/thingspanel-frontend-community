/**
 * 实时图表卡片组件导出
 * 支持多种图表类型的实时数据可视化
 */

import RealtimeChartCard from './RealtimeChartCard.vue'
import realtimeChartCardDefinition from './definition'

export default realtimeChartCardDefinition
export { RealtimeChartCard, realtimeChartCardDefinition }

// 组件元数据
export const componentMeta = {
  name: 'RealtimeChartCard',
  displayName: '实时图表卡片',
  category: '图表可视化',
  description: '支持多种图表类型的实时数据可视化组件，适用于时序数据展示和监控',
  version: '1.0.0',
  author: 'ThingsPanel',
  tags: ['chart', 'realtime', 'timeseries', 'visualization', 'data', 'monitoring'],

  // 数据源支持
  dataSourceSupport: {
    supportedTypes: ['api', 'websocket', 'mqtt', 'static', 'database'],
    recommendedUpdateInterval: 2000,
    requiresRealtime: true,
    maxDataPoints: 500
  },

  // 技术特性
  technicalFeatures: {
    canvasRendering: true,
    realTimeUpdates: true,
    multiSeries: true,
    interactiveZoom: true,
    thresholdAlerts: true,
    dataExport: true
  },

  // 性能配置
  performance: {
    recommendedMaxInstances: 10,
    memoryUsage: 'high',
    cpuUsage: 'medium',
    optimizedForRealtime: true
  },

  // 使用场景
  useCases: [
    '环境监控仪表板',
    '系统性能监控',
    '业务数据分析',
    '设备状态追踪',
    '网络流量监控',
    '传感器数据可视化',
    '实时交易监控',
    '服务器资源监控'
  ]
}
