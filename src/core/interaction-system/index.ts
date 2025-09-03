/**
 * 核心交互系统统一导出
 *
 * 该模块提供了完整的组件交互配置和管理功能，包括：
 * - 交互配置组件
 * - 配置管理器
 * - 统一的API接口
 */

// 导出交互配置组件
export { default as InteractionSettingsForm } from './components/InteractionSettingsForm.vue'
export { default as InteractionResponseEditor } from './components/InteractionResponseEditor.vue'
export { default as InteractionTemplateSelector } from './components/InteractionTemplateSelector.vue'
export { default as InteractionPreview } from './components/InteractionPreview.vue'

// 导出配置管理器
export { configRegistry, default as ConfigRegistry } from './managers/ConfigRegistry'

// 向后兼容的导出（为了保持现有代码正常工作）
export const initializeSettings = () => {
  // TODO: 在这里可以添加交互系统的初始化逻辑
}
