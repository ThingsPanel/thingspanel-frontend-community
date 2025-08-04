// 导出类型定义
export * from './types/api-types'

// 导出工具函数
export * from './utils/api-helpers'

<<<<<<< Updated upstream
// 导出已创建的组件
export { default as DeviceSelector } from './components/DeviceSelector.vue'
export { default as BaseApiForm } from './components/BaseApiForm.vue'
export { default as TelemetryApiForm } from './components/TelemetryApiForm.vue'
export { default as PollingConfig } from './components/PollingConfig.vue'

// 导出待创建的组件（注释）
=======
// 导出组件（待创建）
// export { default as DeviceSelector } from './components/DeviceSelector.vue'
// export { default as BaseApiForm } from './components/BaseApiForm.vue'
// export { default as TelemetryApiForm } from './components/TelemetryApiForm.vue'
>>>>>>> Stashed changes
// export { default as AttributesApiForm } from './components/AttributesApiForm.vue'
// export { default as EventApiForm } from './components/EventApiForm.vue'
// export { default as CommandApiForm } from './components/CommandApiForm.vue'
// export { default as DeviceInfoApiForm } from './components/DeviceInfoApiForm.vue'
// export { default as SimulationApiForm } from './components/SimulationApiForm.vue'
<<<<<<< Updated upstream
=======
// export { default as PollingConfig } from './components/PollingConfig.vue'
>>>>>>> Stashed changes
// export { default as WebSocketConfig } from './components/WebSocketConfig.vue'

// API类型选项（用于下拉选择）
export const API_TYPE_OPTIONS = [
  // 遥测数据
  { label: '遥测数据 - 当前值', value: 'telemetry_current' },
  { label: '遥测数据 - 历史值', value: 'telemetry_history' },
  { label: '遥测数据 - 发布', value: 'telemetry_pub' },
  { label: '遥测数据 - 日志', value: 'telemetry_logs' },
  
  // 属性数据
  { label: '属性数据 - 数据集', value: 'attributes_dataset' },
  { label: '属性数据 - 指定键值', value: 'attributes_key' },
  { label: '属性数据 - 发布', value: 'attributes_pub' },
  { label: '属性数据 - 日志', value: 'attributes_logs' },
  
  // 事件数据
  { label: '事件数据 - 数据集', value: 'event_dataset' },
  
  // 命令数据
  { label: '命令数据 - 发布', value: 'command_pub' },
  { label: '命令数据 - 日志', value: 'command_logs' },
  { label: '命令数据 - 自定义命令', value: 'command_custom' },
  
  // 设备信息
  { label: '设备信息 - 详情', value: 'device_detail' },
  { label: '设备信息 - 连接信息', value: 'device_connect' },
  { label: '设备信息 - 告警状态', value: 'device_alarm_status' },
  { label: '设备信息 - 告警历史', value: 'device_alarm_history' },
  
  // 模拟数据
  { label: '模拟数据 - 获取', value: 'simulation_get' },
  { label: '模拟数据 - 发送', value: 'simulation_send' }
]

// 轮询间隔选项
export const POLLING_INTERVAL_OPTIONS = [
  { label: '1秒', value: 1000 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 },
  { label: '30分钟', value: 1800000 },
  { label: '1小时', value: 3600000 }
]

// 默认配置
export const DEFAULT_CONFIG = {
  pollingType: 'http' as const,
  enabled: false,
  refreshInterval: 5000,
  parameters: {}
} 