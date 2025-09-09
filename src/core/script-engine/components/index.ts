/**
 * Script Engine 组件库入口
 * 导出所有可用的脚本编辑器组件
 */

export { default as ScriptEditor } from './ScriptEditor.vue'
export { default as ScriptExecutionResultPanel } from './ScriptExecutionResultPanel.vue'
export { default as SimpleScriptEditor } from './SimpleScriptEditor.vue'

// 组件类型导出
export type { ScriptEditorProps, ScriptEditorEmits } from './ScriptEditor.vue'

// 重新导出 script-engine 的类型
export type {
  ScriptExecutionResult,
  ScriptTemplate,
  ScriptConfig,
  ScriptExecutionContext,
  TemplateCategory,
  ScriptLog
} from '../types'
