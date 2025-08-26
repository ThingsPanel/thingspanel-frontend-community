/**
 * 数据源配置表单系统 - 统一导出文件
 * 
 * 重构后的目录结构：
 * ├── forms/        - 表单组件
 * ├── modals/       - 弹窗组件  
 * ├── sections/     - 业务区块组件
 * ├── ui/           - 基础UI组件
 * ├── composables/  - 业务逻辑
 * ├── types/        - 类型定义
 * └── docs/         - 文档
 */

// ===== 主要表单组件 =====
export { default as DataSourceConfigForm } from './forms/DataSourceConfigForm.vue'
export { default as DataSourceConfigFormSimple } from './forms/DataSourceConfigFormSimple.vue'

// ===== 弹窗组件 =====
export { default as AddRawDataModal } from './modals/AddRawDataModal.vue'
export { default as DataDetailModal } from './modals/DataDetailModal.vue'
export { default as ApiListModal } from './modals/ApiListModal.vue'

// ===== 业务区块组件 =====
export { default as DataSourceHeader } from './sections/DataSourceHeader.vue'
export { default as RawDataManagement } from './sections/RawDataManagement.vue'
export { default as FinalDataProcessing } from './sections/FinalDataProcessing.vue'

// ===== 基础UI组件 =====
export {
  JsonDataInput,
  KeyValueEditor,
  ScriptEditor,
  HttpDataInput,
  HttpConfigForm,
  WebSocketDataInput,
  ProcessingPreview,
  StatusIndicator,
  ComponentUsageExamples,
  ComponentDescriptions,
  ComponentDependencies
} from './ui'

// ===== Composables业务逻辑 =====
export {
  useDataSourceState,
  useHttpConfig,
  useWebSocketConfig,
  useModalManagement,
  useDataProcessing
} from './composables'

// ===== 类型定义 =====
export type {
  // HTTP配置相关
  HttpConfiguration,
  HttpMethod,
  
  // WebSocket配置相关
  WebSocketConfigData,
  
  // 原始数据相关
  RawDataItem,
  RawDataType,
  
  // 弹窗相关
  ModalType,
  ModalConfig,
  
  // 表单接口
  DataSourceFormData,
  ValidationResult,
  
  // 事件类型
  ConfigChangeEvent,
  TestConnectionEvent,
  RawDataEvent,
  
  // 通用类型
  KeyValuePair,
  TestConnectionResponse,
  SystemApiItem
} from './types'

// ===== 系统信息 =====
export const DataSourceConfigFormInfo = {
  version: '2.0.0',
  lastUpdated: new Date().toISOString(),
  description: '数据源配置表单系统 - 重构版本',
  features: [
    '✅ 模块化目录结构',
    '✅ 清晰的组件层次',
    '✅ 完整的TypeScript支持',
    '✅ 统一的composables系统',
    '✅ 丰富的UI组件库',
    '✅ 多数据项管理功能',
    '✅ 批量导入操作',
    '✅ 实时预览和测试'
  ],
  components: {
    forms: 2,
    modals: 3, 
    sections: 3,
    ui: 8,
    composables: 5,
    types: 14
  }
}

// ===== 快速使用指南 =====
export const QuickStartGuide = {
  basic: `
// 基础使用 - 完整数据源配置表单
import { DataSourceConfigForm } from '@/core/data-source-system/components/data-source-config-form'

<DataSourceConfigForm
  v-model="configData"
  :data-sources="dataSources"
  component-id="device-001"
  component-type="sensor"
  @change="handleConfigChange"
/>`,

  simplified: `
// 简化使用 - 轻量级配置表单
import { DataSourceConfigFormSimple } from '@/core/data-source-system/components/data-source-config-form'

<DataSourceConfigFormSimple
  v-model="basicConfig"
  :data-sources="dataSources"
  @change="handleConfigChange"
/>`,

  modal: `
// 弹窗形式 - 添加原始数据项
import { AddRawDataModal } from '@/core/data-source-system/components/data-source-config-form'

<AddRawDataModal
  v-model:visible="showModal"
  :data-source-key="currentDataSource"
  @submit="handleRawDataSubmit"
  @cancel="handleModalCancel"
/>`,

  composable: `
// 使用composables - 自定义业务逻辑
import { useDataSourceState, useHttpConfig } from '@/core/data-source-system/components/data-source-config-form'

const { configState, updateConfig } = useDataSourceState(initialData)
const { testConnection, httpState } = useHttpConfig(configState.httpConfig)`
}