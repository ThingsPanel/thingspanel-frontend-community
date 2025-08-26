/**
 * 数据源配置表单组件统一导出
 * 提供所有基础组件的导出，便于在重构后的DataSourceConfigForm中使用
 */

// 基础编辑器组件
export { default as JsonDataInput } from './JsonDataInput.vue'
export { default as KeyValueEditor } from './KeyValueEditor.vue'
export { default as ScriptEditor } from './ScriptEditor.vue'

// 数据输入组件
export { default as HttpDataInput } from './HttpDataInput.vue'
export { default as HttpConfigForm } from './HttpConfigForm.vue'
export { default as WebSocketDataInput } from './WebSocketDataInput.vue'

// 预览和状态组件
export { default as ProcessingPreview } from './ProcessingPreview.vue'
export { default as StatusIndicator } from './StatusIndicator.vue'

// 组件类型定义
export type { StatusType, DisplayMode } from './StatusIndicator.vue'

// 组件使用示例和文档
export const ComponentUsageExamples = {
  JsonDataInput: {
    basic: `
<JsonDataInput
  v-model="jsonData"
  show-label
  label="JSON配置"
  :rows="6"
  @validation-change="handleValidation"
/>`,

    autoFormat: `
<JsonDataInput
  v-model="jsonData"
  :auto-format="true"
  :auto-validate="true"
  placeholder="输入JSON，失焦时自动格式化"
/>`
  },

  KeyValueEditor: {
    headers: `
<KeyValueEditor
  v-model="headers"
  label="HTTP请求头"
  placeholder-key="Header-Name"
  placeholder-value="Header-Value"
  :enable-toggle="true"
  :show-import-export="true"
/>`,

    params: `
<KeyValueEditor
  v-model="urlParams"
  label="URL参数"
  placeholder-key="参数名"
  placeholder-value="参数值"
  @change="handleParamsChange"
/>`
  },

  ScriptEditor: {
    basic: `
<ScriptEditor
  v-model="script"
  language="javascript"
  :show-templates="true"
  :show-validation="true"
  @validation-change="handleScriptValidation"
/>`,

    processing: `
<ScriptEditor
  v-model="processingScript"
  template-type="data-processing"
  :show-statistics="true"
  placeholder="编写数据处理脚本..."
/>`
  },

  HttpDataInput: {
    basic: `
<HttpDataInput
  v-model="httpConfig"
  :system-apis="systemApiList"
  @test-result="handleTestResult"
  @change="handleConfigChange"
/>`,

    readonly: `
<HttpDataInput
  v-model="httpConfig"
  :readonly="true"
  :show-system-api-selector="false"
/>`
  },

  HttpConfigForm: {
    basic: `
<HttpConfigForm
  v-model="httpConfig"
  :system-apis="systemApiList"
  @test-result="handleTestResult"
  @change="handleConfigChange"
/>`,

    withDynamicParams: `
<HttpConfigForm
  v-model="httpConfig"
  :show-system-api-selector="true"
  @validation-change="handleValidation"
  @change="handleConfigChange"
/>`
  },

  WebSocketDataInput: {
    basic: `
<WebSocketDataInput
  v-model="wsConfig"
  @test-result="handleTestResult"
  @message="handleMessage"
  @change="handleConfigChange"
/>`
  },

  ProcessingPreview: {
    basic: `
<ProcessingPreview
  v-model="previewConfig"
  :auto-refresh-default="true"
  :refresh-interval-default="5000"
  @preview-change="handlePreviewChange"
  @error="handleProcessingError"
/>`
  },

  StatusIndicator: {
    compact: `
<StatusIndicator
  status="success"
  text="连接正常"
  :show-timestamp="true"
  :timestamp="Date.now()"
/>`,

    detailed: `
<StatusIndicator
  status="loading"
  display-mode="detailed"
  text="数据处理中"
  description="正在处理传感器数据..."
  :progress="75"
  :show-progress="true"
/>`,

    iconOnly: `
<StatusIndicator
  status="error"
  display-mode="icon-only"
  text="连接失败"
  description="无法连接到WebSocket服务器"
/>`,

    badge: `
<StatusIndicator
  status="warning"
  display-mode="badge"
  :badge-value="5"
  text="警告状态"
/>`
  }
}

// 组件功能说明
export const ComponentDescriptions = {
  JsonDataInput: '高功能JSON编辑器，支持格式化、验证、压缩等操作',
  KeyValueEditor: '通用键值对编辑器，支持HTTP头部、URL参数等多种场景',
  ScriptEditor: 'JavaScript/TypeScript脚本编辑器，内置模板和验证功能',
  HttpDataInput: 'HTTP请求配置组件，支持完整的HTTP配置和连接测试',
  HttpConfigForm: 'HTTP配置表单组件，支持动态参数和脚本系统，替代HttpDataInput',
  WebSocketDataInput: 'WebSocket连接配置组件，支持实时连接和消息预览',
  ProcessingPreview: '数据处理预览组件，提供实时数据预览和性能监控',
  StatusIndicator: '通用状态指示器，支持多种显示模式和动画效果'
}

// 组件依赖关系
export const ComponentDependencies = {
  JsonDataInput: ['Naive UI'],
  KeyValueEditor: ['Naive UI'],
  ScriptEditor: ['Naive UI', 'JsonDataInput'],
  HttpDataInput: ['Naive UI', 'JsonDataInput', 'KeyValueEditor'],
  HttpConfigForm: ['Naive UI', '@vicons/ionicons5', '主题系统', '国际化'],
  WebSocketDataInput: ['Naive UI', 'JsonDataInput', 'KeyValueEditor'],
  ProcessingPreview: ['Naive UI', 'JsonDataInput'],
  StatusIndicator: ['Naive UI', '@vicons/ionicons5']
}

// 版本信息
export const ComponentVersion = '1.0.0'
export const LastUpdated = new Date().toISOString()
