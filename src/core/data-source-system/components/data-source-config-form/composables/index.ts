/**
 * 数据源配置表单 Composables 统一导出
 * 提供所有业务逻辑 composables 的导出，便于在组件中使用
 */

// 主状态管理 composable
export { useDataSourceState, createDefaultHttpConfig, createDefaultWebSocketConfig } from './useDataSourceState'
export type {
  DataSourceType,
  DataSourceConfigState,
  ValidationState,
  RuntimeState,
  UseDataSourceStateOptions
} from './useDataSourceState'

// HTTP配置管理 composable
export { useHttpConfig } from './useHttpConfig'
export type { UseHttpConfigOptions, HttpState } from './useHttpConfig'

// WebSocket配置管理 composable
export { useWebSocketConfig } from './useWebSocketConfig'
export type {
  UseWebSocketConfigOptions,
  WebSocketConnectionState,
  MessageStats,
  MessageLog
} from './useWebSocketConfig'

// 弹窗管理 composable
export { useModalManagement } from './useModalManagement'
export type { ModalState, UseModalManagementOptions } from './useModalManagement'

// 数据处理 composable
export { useDataProcessing } from './useDataProcessing'
export type {
  UseDataProcessingOptions,
  ProcessingQueueItem,
  ProcessorState,
  ScriptExecutionContext
} from './useDataProcessing'

// Composables 使用示例
export const ComposableUsageExamples = {
  useDataSourceState: {
    basic: `
// 基础用法
const {
  configState,
  validationState,
  runtimeState,
  updateHttpConfig,
  validateConfiguration,
  saveConfiguration
} = useDataSourceState({
  autoSave: true,
  enableValidation: true
})`,

    withOptions: `
// 带选项的用法
const dataSourceState = useDataSourceState({
  autoSave: true,
  autoSaveInterval: 60000,
  enableLocalStorage: true,
  localStorageKey: 'myDataSourceConfig',
  validationDelay: 300
})`
  },

  useHttpConfig: {
    basic: `
// HTTP配置管理
const {
  httpConfig,
  httpState,
  setMethod,
  setUrl,
  addHeader,
  testConnection,
  validateConfig
} = useHttpConfig({
  autoValidate: true,
  enableTesting: true
})`,

    withSystemApis: `
// 带系统API的HTTP配置
const httpConfigManager = useHttpConfig({
  systemApis: systemApiList,
  enableTesting: true
})

// 应用系统API
httpConfigManager.applySystemApi(selectedApi)`
  },

  useWebSocketConfig: {
    basic: `
// WebSocket配置管理
const {
  wsConfig,
  connectionState,
  isConnected,
  connect,
  disconnect,
  sendMessage
} = useWebSocketConfig({
  autoValidate: true,
  enableMessageLog: true
})`,

    withHeartbeat: `
// 带心跳的WebSocket配置
const wsManager = useWebSocketConfig({
  enableTesting: true,
  maxLogMessages: 200
})

// 配置心跳
wsManager.updateHeartbeatConfig({
  enabled: true,
  interval: 30000,
  messageType: 'json'
})`
  },

  useModalManagement: {
    basic: `
// 弹窗管理
const {
  modalStates,
  activeModals,
  openModal,
  closeModal,
  confirmModal
} = useModalManagement({
  defaultSize: 'medium',
  maxConcurrentModals: 3
})`,

    specificModals: `
// 特定弹窗快捷方法
const modalManager = useModalManagement()

// 打开添加数据弹窗
await modalManager.openAddRawDataModal((data) => {
  console.log('新增数据:', data)
})

// 打开系统API选择弹窗
await modalManager.openSystemApiListModal(apiList, (api) => {
  console.log('选中API:', api)
})`
  },

  useDataProcessing: {
    basic: `
// 数据处理管理
const {
  processingQueue,
  processorState,
  addToQueue,
  processQueue,
  processImmediately
} = useDataProcessing({
  enableRealTimeProcessing: true,
  enablePerformanceMonitoring: true
})`,

    immediate: `
// 立即处理数据
const processingManager = useDataProcessing()

try {
  const result = await processingManager.processImmediately(
    rawDataItems,
    processingConfig
  )
  console.log('处理结果:', result)
} catch (error) {
  console.error('处理失败:', error)
}`
  }
}

// Composables 功能描述
export const ComposableDescriptions = {
  useDataSourceState: '统一的数据源配置状态管理，支持多种数据源类型的配置、验证和持久化',
  useHttpConfig: 'HTTP数据源专用配置管理，包含连接测试、系统API集成和cURL生成功能',
  useWebSocketConfig: 'WebSocket连接管理，支持实时连接、心跳机制、自动重连和消息日志',
  useModalManagement: '弹窗状态统一管理，提供弹窗栈、数据传递和生命周期控制',
  useDataProcessing: '数据处理引擎，支持多种处理策略、队列管理和性能监控'
}

// Composables 依赖关系
export const ComposableDependencies = {
  useDataSourceState: ['vue', 'vue-i18n', 'types'],
  useHttpConfig: ['vue', 'vue-i18n', 'types'],
  useWebSocketConfig: ['vue', 'vue-i18n', 'types'],
  useModalManagement: ['vue', 'vue-i18n', 'types'],
  useDataProcessing: ['vue', 'vue-i18n', 'types']
}

// 最佳实践指南
export const ComposableBestPractices = {
  stateManagement: '使用 useDataSourceState 作为主状态管理器，其他 composables 作为功能增强',
  errorHandling: '所有 composables 都包含完整的错误处理和用户友好的错误消息',
  performance: '启用性能监控以识别潜在的性能瓶颈',
  testing: '使用内置的测试和验证功能确保配置正确性',
  cleanup: '在组件卸载时正确清理定时器和连接资源'
}

// 版本信息
export const ComposablesVersion = '1.0.0'
export const LastUpdated = new Date().toISOString()
